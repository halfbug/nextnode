import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { GroupshopsService } from './groupshops.service';
import {
  GroupShop as Groupshop,
  Member,
  MostViralCustomers,
  uniqueClicks,
  activeGroupshop,
  MatchingGS,
} from './entities/groupshop.entity';
import { MostViralProducts } from 'src/inventory/entities/orders.entity';
import { CreateGroupshopInput } from './dto/create-groupshops.input';
import { UpdateGroupshopInput } from './dto/update-groupshops.input';
import {
  createParamDecorator,
  ExecutionContext,
  Ip,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { QRInput } from './dto/qr-code.input';
import { ViewedInterceptor } from 'src/gs-common/viewed.inceptor';
import { addDays, getDateDifference } from 'src/utils/functions';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { GSUpdatePriceRuleEvent } from './events/groupshop-update-price-rule.event';
import { TotalGS } from 'src/billing/dto/monthly-billing.input';
import { Public } from 'src/auth/public.decorator';

export const ReqDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().req,
);

@Resolver(() => Groupshop)
export class GroupshopsResolver {
  constructor(
    private readonly GroupshopsService: GroupshopsService,
    private readonly crypt: EncryptDecryptService,
    private readonly lifecyclesrv: LifecycleService,
    private readonly gsUpdatePriceRuleEvt: GSUpdatePriceRuleEvent,
  ) {}

  @Mutation(() => Groupshop)
  createGroupshop(
    @Args('createGroupshopInput') createGroupshopInput: CreateGroupshopInput,
  ) {
    // console.log(
    //   '🚀 ~ file: groupshops.resolver.ts ~ line 15 ~ GroupshopsResolver ~ createGroupshopInput',
    //   createGroupshopInput,
    // );

    return this.GroupshopsService.create(createGroupshopInput);
  }

  @Query(() => [Groupshop], { name: 'groupshops' })
  findAll() {
    return this.GroupshopsService.findAll();
  }

  @Query(() => [Groupshop], { name: 'totalGroupshops' })
  totalGs(@Args('storeId') storeId: string) {
    return this.GroupshopsService.totalGs(storeId);
  }

  @Query(() => QRInput, { name: 'getQrDealLink' })
  findQrDealLink(@Args('email') email: string) {
    return this.GroupshopsService.findfindQrDealLinkAll(email);
  }

  @Query(() => uniqueClicks, { name: 'getCampaignUniqueClicks' })
  getCampaignUniqueClicks(@Args('campaignId') campaignId: string) {
    return this.GroupshopsService.getCampaignUniqueClicks(campaignId);
  }

  @Query(() => [Member], { name: 'getGsOrders' })
  findGsOrders(@Args('groupshopUrl') groupshopUrl: string) {
    console.log(groupshopUrl);
    return this.GroupshopsService.findGsOrders(groupshopUrl);
  }

  @Query(() => uniqueClicks, { name: 'getUniqueClicks' })
  async getuniqueClicks(
    @Args('storeId') storeId: string,
    @Args('startFrom') startFrom: string,
    @Args('toDate') toDate: string,
  ) {
    const result = await this.GroupshopsService.getuniqueClicks(
      storeId,
      startFrom,
      toDate,
    );
    return result;
  }

  @Public()
  @Query(() => activeGroupshop, { name: 'getActiveGroupshop' })
  async getActiveGroupshop(@Args('storeId') storeId: string) {
    const result = await this.GroupshopsService.getActiveGroupshop(storeId);
    return result;
  }
  @Public()
  @Query(() => [activeGroupshop], { name: 'getActiveGroupshops' })
  async getActiveGroupshops(@Args('email') email: string) {
    const result = await this.GroupshopsService.getActiveGroupshops(email);
    console.log(
      '🚀 ~ file: groupshops.resolver.ts ~ line 113 ~ GroupshopsResolver ~ getActiveGroupshops ~ result',
      result,
    );
    return result;
  }

  @Public()
  @UseInterceptors(ViewedInterceptor)
  @Query(() => Groupshop, { name: 'groupshop' })
  async findOne(@Args('code') code: string, @Args('status') status: string) {
    console.log('code status', code, status);
    if (status === 'activated') {
      //load gs, currentdate > expiredate, update expire = currdate+7
      const Dcode = await this.crypt.decrypt(code);
      const groupshop = await this.GroupshopsService.find(Dcode);
      const isExpired = !(getDateDifference(groupshop.expiredAt).time > -1);
      if (isExpired) {
        //update groupshop expire date
        const newExpiredate = addDays(new Date(), 7);
        const updateGS = await this.GroupshopsService.updateExpireDate(
          {
            expiredAt: newExpiredate,
            id: groupshop.id,
          },
          Dcode,
        );
        // console.log(
        //   '🚀 ~ file: groupshops.resolver.ts ~ line 81 ~ GroupshopsResolver ~ findOne ~ updateGS',
        //   updateGS,
        // );

        // add lifcycle event for revised groupshop
        this.lifecyclesrv.create({
          groupshopId: groupshop.id,
          event: EventType.revised,
          dateTime: new Date(),
        });
        this.lifecyclesrv.create({
          groupshopId: groupshop.id,
          event: EventType.expired,
          dateTime: newExpiredate,
        });
        // update price rule end date.
        this.gsUpdatePriceRuleEvt.groupshop = updateGS;
        this.gsUpdatePriceRuleEvt.endDate = addDays(new Date(), 7);
        this.gsUpdatePriceRuleEvt.emit();
        return updateGS;
      }
    }
    return await this.GroupshopsService.findOne(await this.crypt.decrypt(code));
  }
  @Public()
  @Mutation(() => Groupshop, { name: 'addDealProduct' })
  addDealProduct(
    @Args('updateGroupshopInput') updateGroupshopInput: UpdateGroupshopInput,
  ) {
    return this.GroupshopsService.update(updateGroupshopInput);
  }

  // @Mutation(() => Groupshop)
  // removeGroupshop(@Args('id', { type: () => Int }) id: number) {
  //   return this.GroupshopsService.remove(id);
  // }
  @Query(() => TotalGS, { name: 'countOfGsMonthly' })
  async countOfGsMonthly1(
    @Args('storeId') storeId: string,
    @Args('month') month: string,
    @Args('year') year: string,
  ) {
    const res = await this.GroupshopsService.countOfGsMonthly(
      storeId,
      month,
      year,
    );
    console.log(
      '🚀 ~ file: billing.resolver.ts ~ line 140 ~ BillingsResolver ~ res',
      res,
    );
    return res;
  }

  @Query(() => [MostViralCustomers], { name: 'mostViralCustomers' })
  async mostViralCustomers(
    @Args('storeId') storeId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ) {
    if (storeId !== '') {
      const data = await this.GroupshopsService.findMostViralCustomers(
        storeId,
        startDate,
        endDate,
      );
      return data;
    }
  }

  @Query(() => [MostViralProducts], { name: 'mostCampaignViralProducts' })
  async mostCampaignViralProducts(@Args('campaignId') campaignId: string) {
    if (campaignId !== '') {
      return await this.GroupshopsService.findCampaignMostViralProducts(
        campaignId,
      );
    }
  }

  @Public()
  @Query(() => [MatchingGS], { name: 'matchingGS' })
  async AllMatchingGS(
    @Args({ name: 'storeId', type: () => [String] }) storeId: string[],
  ) {
    if (storeId.length > 0) {
      return await this.GroupshopsService.findGSWithStoreId(storeId);
    }
  }
}
