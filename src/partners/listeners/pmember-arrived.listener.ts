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
import { CreateOrderInput as LineItem } from 'src/inventory/dto/create-order.input';

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
      JSON.stringify(event),
    );
    const memobj = new PartnerMember();
    const {
      pgroupshop: {
        id,
        partnerCommission,
        shortUrl,
        storeId,
        partnerDetails: { fname, email },
      },
      store: { shop, brandName, logoImage },
      lineItems,
      order,
    } = event;
    console.log(
      '🚀 ~ file: pmember-arrived.listener.ts ~ line 39 ~ PMemberArrivedListener ~ membersaved ~ partnerCommission',
      partnerCommission,
    );
    memobj.orderId = order.id;
    memobj.storeId = storeId;
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
    let newLI = [new LineItem()];
    newLI = lineItems.map((item) => {
      item.customer = order.customer;
      return item;
    });
    memobj.lineItems = [...newLI];
    // memobj.lineItems.c = lineItems;
    const res = await this.pMemberSrv.create(memobj);

    // Groupshop Influencer Commission Email
    const gicdata = {
      logoImage: logoImage,
      brandName: brandName,
      shopUrl: `https://${shop}`,
      orderAmount: orderAmount,
      comissionAmount: ((orderAmount * parseInt(partnerCommission)) / 100)
        .toFixed(2)
        .toString()
        .replace('.00', ''),
      customerFirstName: order.customer.firstName,
      customerLastName: order.customer.lastName,
      shortUrl: shortUrl,
    };
    const gicbody = {
      event: 'Groupshop Influencer Commission',
      customer_properties: {
        $email: email,
        $first_name: fname,
      },
      properties: gicdata,
    };
    this.kalavioService.sendKlaviyoEmail(gicbody);

    // Influencer Referral Email
    const girdata = {
      logoImage: logoImage,
      brandName: brandName,
      shopUrl: `https://${shop}`,
      discount: parseInt(partnerCommission),
      partnerName: fname,
      shortUrl: shortUrl,
    };
    const girbody = {
      event: 'Groupshop Influencer Referral',
      customer_properties: {
        $email: order.customer.email,
        $first_name: order.customer.firstName,
        $last_name: order.customer.lastName,
      },
      properties: girdata,
    };
    this.kalavioService.sendKlaviyoEmail(girbody);

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
