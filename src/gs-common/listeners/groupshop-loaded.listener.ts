import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { UpdateDropsGroupshopInput } from 'src/drops-groupshop/dto/update-drops-groupshop.input';
import { UpdateGroupshopInput } from 'src/groupshops/dto/update-groupshops.input';
import { GSUpdatePriceRuleEvent } from 'src/groupshops/events/groupshop-update-price-rule.event';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { PartnerService } from 'src/partners/partners.service';
import { DROPS_EXPIRE_DAYS, FIRST_EXPIRE_DAYS } from 'src/utils/constant';
import { addDays, getDateDifference } from 'src/utils/functions';
import { EventType } from '../entities/lifecycle.modal';
import { GSLoadedEvent } from '../events/groupshop-loaded.event';
import { GsCommonService } from '../gs-common.service';
import { LifecycleService } from '../lifecycle.service';
import { KalavioService } from 'src/email/kalavio.service';
import { VistorsService } from '../vistors.service';

@Injectable()
export class GSLoadedListener {
  constructor(
    private readonly vistorsrv: VistorsService,
    private kalavioService: KalavioService,
    private readonly lifecyclesrv: LifecycleService,
    private readonly groupshopsrv: GroupshopsService,
    private readonly gsUpdatePriceRuleEvt: GSUpdatePriceRuleEvent,
    private readonly gpsrv: PartnerService,
    private readonly dropsService: DropsGroupshopService,
    private readonly GSCommonService: GsCommonService,
  ) {}

  @OnEvent('groupshop.loaded')
  async updateSubscription(event: GSLoadedEvent) {
    const { groupshopCode: code, userIp: ip } = event;
    const gsType = this.GSCommonService.identifyGS(code);
    let gs;
    if (gsType === 'DROPS') {
      gs = await this.dropsService.findDropsGS(code);
    } else if (gsType === 'PARTNER') {
      gs = await this.gpsrv.findOne(code);
    } else if (gsType === 'CHANNEL') {
      // CHANNLE CODE WILL GO HERE
    } else {
      gs = await this.groupshopsrv.find(code);
    }
    // 0. find groupshop by code.
    // if (!gs) {
    //   gs = await this.gpsrv.findOne(code);
    // }
    // 1. find groupshop all views
    const gsviews = (await this.vistorsrv.findAll(gs?.id)) || [];
    // console.log(
    //   '🚀 ~ file: viewed.inceptor.ts ~ line 54 ~ ViewedInterceptor ~ tap ~ gsviews',
    //   gsviews,
    // );
    if (gsType === 'DROPS' && gsviews?.length === 0) {
      const klaviyoId = gs?.customerDetail?.klaviyoId;
      const shortURL = gs?.shortUrl;

      // Request to create Discount code on shopify
      // const discountCode = await this.dropsService.createDropDiscountCode(gs);
      // const upgs = new UpdateDropsGroupshopInput();
      // upgs.discountCode = discountCode;
      // await this.dropsService.update(gs.id, upgs);

      // const gsExpireAt = addDays(new Date(), DROPS_EXPIRE_DAYS);
      // const upgs = new UpdateDropsGroupshopInput();
      // // upgs.id = gs.id;
      // upgs.expiredAt = gsExpireAt;
      // upgs.status = 'active';
      // await this.dropsService.update(gs.id, upgs);
      // //    2.2 add started at and expired at event in lifecycle collection.
      // this.lifecyclesrv.create({
      //   groupshopId: gs.id,
      //   event: EventType.started,
      // });
      // this.lifecyclesrv.create({
      //   groupshopId: gs.id,
      //   event: EventType.expired,
      //   dateTime: gsExpireAt,
      // });
      //    2.3 update visitor service.
      this.vistorsrv.create(gs.id, ip);
    } else {
      // 1.5 groupshop should not be expired
      const isNotExpired = getDateDifference(gs.expiredAt).time > -1;

      // 2. on zero views add a start event in life cycle
      if (gsviews?.length === 0 && isNotExpired) {
        //    2.1. update groupshop expire time.
        const gsExpireAt = addDays(new Date(), FIRST_EXPIRE_DAYS);
        const upgs = new UpdateGroupshopInput();
        upgs.id = gs.id;
        upgs.expiredAt = gsExpireAt;
        await this.groupshopsrv.update(upgs);
        //    2.2 add started at and expired at event in lifecycle collection.
        this.lifecyclesrv.create({
          groupshopId: gs.id,
          event: EventType.started,
        });
        this.lifecyclesrv.create({
          groupshopId: gs.id,
          event: EventType.expired,
          dateTime: gsExpireAt,
        });
        //    2.3 update visitor service.
        this.vistorsrv.create(gs.id, ip);
        //   2.4 update price-rule on shopify
        this.gsUpdatePriceRuleEvt.groupshop = gs;
        this.gsUpdatePriceRuleEvt.endDate = gsExpireAt;
        this.gsUpdatePriceRuleEvt.emit();
      } else {
        // 3. find view with ip.
        const isIPExist = !!(await this.vistorsrv.findOne(ip, gs.id));
        // console.log('ip--', await this.vistorsrv.findOne(ip, gs.id));
        // console.log({ isIPExist });
        // 4. if no ip found add view record.
        if (!isIPExist) this.vistorsrv.create(gs.id, ip);
      }
    }
  }
}
