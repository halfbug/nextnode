import { Injectable } from '@nestjs/common';
import { Controller, forwardRef, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/inventory/orders.service';
import { KalavioService } from '../kalavio.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GroupshopCashbackEvent } from 'src/groupshops/events/groupshop-cashback.event';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as getSymbolFromCurrency from 'currency-symbol-map';
import { RoleTypeEnum } from 'src/groupshops/entities/groupshop.modal';

@Injectable()
export class GroupshopCashbackListener {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private ordersService: OrdersService,
    private kalavioService: KalavioService,
  ) {}

  @OnEvent('cashbackEmail.generated')
  async handleCashbackEvent(res: GroupshopCashbackEvent) {
    const PUBLIC_KEY = this.configService.get('KLAVIYO_PUBLIC_KEY');
    let orderline_items = [];
    //console.log('resData1111 : ' + JSON.stringify(res));
    const dealUrl = res.groupshop.url;
    const discountOne =
      res.store.activeCampaign.salesTarget.rewards[0].discount.replace('%', '');
    const discountTwo =
      res.store.activeCampaign.salesTarget.rewards[1].discount.replace('%', '');
    const discountThree =
      res.store.activeCampaign.salesTarget.rewards[2].discount.replace('%', '');
    const groupMembers = res.groupshop.members;
    const groupMemberength = res.groupshop.members.length;
    let recInnerDiscount = 0;
    let recDiscount = 0;
    let customerRole = 0;
    let orderData = [];
    if (groupMemberength === 0) {
      recDiscount = 0;
    } else if (groupMemberength === 1 || groupMemberength === 2) {
      recDiscount = discountOne;
    } else if (groupMemberength === 4 || groupMemberength === 3) {
      recDiscount = discountTwo;
    } else if (groupMemberength === 5) {
      recDiscount = discountThree;
    } else {
      recDiscount = 0;
    }
    await Promise.all(
      groupMembers.map(async (member, key) => {
        console.log('cmp orderId :' + res.orderId + ' == ' + member.orderId);
        if (res.orderId == member.orderId) {
          if (key == 0) {
            recInnerDiscount = 0;
          } else if (key == 1 || key == 2) {
            recInnerDiscount = discountOne;
          } else if (key == 3 || key == 4) {
            recInnerDiscount = discountTwo;
          } else if (key == 5) {
            recInnerDiscount = discountThree;
          } else {
            recInnerDiscount = discountOne;
          }
          const availedDiscount = member.availedDiscount;
          customerRole = member.role;
          orderData = await this.ordersService.getOrderDetailsByOrderId(
            member.orderId,
          );

          orderData[0].LineItems.map((items) => {
            const itemQuantity = items.quantity;

            const calPrice = +((recInnerDiscount / 100) * items.price)
              .toString()
              .match(/^-?\d+(?:\.\d{0,2})?/)[0];
            const itemPrice = items.price - calPrice;

            const productID = items.product.id;
            const VariantId = items.variant.id;

            let variantTitle = '';
            items.product[0].variants.map((variant) => {
              if (VariantId == variant.id) {
                variantTitle = variant.title;
              }
            });
            const resData = {
              product_title: items.product[0].title,
              variant_title: variantTitle,
              orderProductImage: items.product[0].featuredImage,
              orderProductId: productID,
              orderPrice: items.price,
              orderQuantity: itemQuantity,
              orderTotalPrice: (itemPrice * itemQuantity)
                .toString()
                .match(/^-?\d+(?:\.\d{0,2})?/)[0],
            };

            orderline_items = [...orderline_items, { ...resData }];
          });
        }
      }),
    );
    let netDiscountCal = 0;
    if (customerRole == RoleTypeEnum.owner && groupMemberength <= 5) {
      netDiscountCal = 50 - recDiscount;
    } else {
      netDiscountCal = discountThree - recDiscount;
    }

    console.log(
      'groupMember  :: ' +
        groupMemberength +
        ' --- ' +
        netDiscountCal +
        ' --- ' +
        customerRole,
    );
    console.log('netDiscountCal  :: ' + discountThree + ' --- ' + recDiscount);

    const availableCashbackCal = Math.floor(
      (netDiscountCal / 100) * orderData[0].price,
    );

    const currencySymbol = getSymbolFromCurrency(
      orderData[0]?.currencyCode || 'USD',
    );

    let custName = orderData[0].customer.firstName;
    if (custName === '') {
      custName = orderData[0].customer.lasttName;
    }
    const customerEmail = orderData[0].customer.email;
    let getUptoDiscount = 0;
    if (customerRole == 0) {
      getUptoDiscount = 50 - recDiscount;
    } else {
      getUptoDiscount = discountThree - recDiscount;
    }

    const calOrderSalePrice = +((recInnerDiscount / 100) * orderData[0].price)
      .toString()
      .match(/^-?\d+(?:\.\d{0,2})?/)[0];
    const totalPrice = +(orderData[0].price + calOrderSalePrice)
      .toString()
      .match(/^-?\d+(?:\.\d{0,2})?/)[0];
    const mdata = {
      earnedcashback: res.cashbackAmount
        .toString()
        .match(/^-?\d+(?:\.\d{0,2})?/)[0],
      customerEmail: customerEmail,
      customer_role: customerRole,
      brandName: res.store.brandName,
      logoImage: res.store.logoImage,
      order_number: orderData[0].name,
      customerName: custName,
      orderLineItems: orderline_items,
      currencyCode: currencySymbol,
      availableCashback: availableCashbackCal,
      getUptoDiscount: getUptoDiscount,
      total_price: totalPrice,
      total_sale_price: orderData[0].price,
      dealUrl: `${this.configService.get('FRONT')}/${dealUrl}`,
    };

    const body = JSON.stringify({
      token: PUBLIC_KEY,
      event: 'Groupshop Cashback Notification',
      customer_properties: {
        $email: customerEmail,
      },
      properties: mdata,
    });

    this.kalavioService.sendKlaviyoEmail(body);
  }
}