import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { ConfigService } from '@nestjs/config';
import { KalavioService } from 'src/email/kalavio.service';
// import { PartnerService } from '../partners.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { PMemberArrivedEvent } from '../events/pmember-arrived.event';
import { PMemberService } from '../pmember.service';
import { PartnerMember } from '../entities/partner.entity';

@Injectable()
export class PMemberArrivedListener {
  constructor(
    private eventEmitter: EventEmitter2,
    private crypt: EncryptDecryptService,
    private configSevice: ConfigService,
    private kalavioService: KalavioService,
    // private partnerService: PartnerService,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
    private pMemberSrv: PMemberService,
  ) {}

  @OnEvent('pmember.arrived')
  async membersaved(event: PMemberArrivedEvent) {
    console.log(
      '🚀 ~ file: pmember-arrived.listener.ts ~ line 28 ~ PMemberArrivedListener ~ membersaved ~ event',
      event,
    );
    const memobj = new PartnerMember();
    const {
      pgroupshop: { id, partnerCommission },
      lineItems,
      order,
    } = event;
    console.log(
      '🚀 ~ file: pmember-arrived.listener.ts ~ line 39 ~ PMemberArrivedListener ~ membersaved ~ partnerCommission',
      partnerCommission,
    );
    memobj.orderId = order.id;
    memobj.groupshopId = id;
    const orderAmount: number = lineItems?.reduce(
      (priceSum: number, { price, quantity }) =>
        priceSum + quantity * parseFloat(price),
      0,
    );
    memobj.orderAmount = orderAmount;
    memobj.comissionAmount = (orderAmount * parseInt(partnerCommission)) / 100;
    memobj.isRedeem = false;
    memobj.customerInfo = order.customer;
    memobj.lineItems = lineItems;
    const res = await this.pMemberSrv.create(memobj);
    console.log(
      '🚀 ~ file: pmember-arrived.listener.ts ~ line 56 ~ PMemberArrivedListener ~ membersaved ~ res',
      res,
    );
    console.log(
      '🚀 line 51 ~ PMemberArrivedListener ~ membersaved ~ memobj',
      JSON.stringify(memobj),
    );
    console.log(
      'line 50 PMemberArrivedListener ~ membersaved ~ order',
      JSON.stringify(order),
    );
    console.log(
      'line 50 PMemberArrivedListener ~ membersaved ~ lineitem',
      JSON.stringify(lineItems),
    );
  }
}
