import { Injectable } from '@nestjs/common';
import { Controller, forwardRef, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InventoryService } from 'src/inventory/inventory.service';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GroupshopSavedEvent } from 'src/groupshops/events/groupshop-saved.event';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as getSymbolFromCurrency from 'currency-symbol-map';

@Injectable()
export class GroupshopSavedListener {
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private httpService: HttpService,
    private inventoryService: InventoryService,
  ) {}

  hello() {
    return 5;
  }

  @OnEvent('groupshop.saved')
  async handleTokenReceivedEvent(res: GroupshopSavedEvent) {
    const PUBLIC_KEY = this.configService.get('KLAVIYO_PUBLIC_KEY');
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');
    const url = `https://a.klaviyo.com/api/track`;

    console.log('resData : ' + JSON.stringify(res));
    const discount_1 =
      res.data.store.activeCampaign.salesTarget.rewards[0].discount.replace(
        '%',
        '',
      );
    const discount_2 =
      res.data.store.activeCampaign.salesTarget.rewards[1].discount.replace(
        '%',
        '',
      );
    const discount_3 =
      res.data.store.activeCampaign.salesTarget.rewards[2].discount.replace(
        '%',
        '',
      );

    const order_price = res.data.order.price;
    const discount_1_price = Math.floor((discount_1 / 100) * order_price);
    const discount_2_price = Math.floor((discount_2 / 100) * order_price);
    const discount_3_price = Math.floor((discount_3 / 100) * order_price);
    const memberLength = res?.ugroupshop?.members.length || 0;
    const shopName = res.data.order.shop;
    let order_line_items = [];
    const orderLineitem = res.data.lineItems;
    let recDiscount = 0;
    await Promise.all(
      orderLineitem.map(async (items) => {
        const itemQuantity = items.quantity;
        if (memberLength === 0) {
          recDiscount = 0;
        } else if (
          memberLength === 1 ||
          memberLength === 2 ||
          memberLength === 3
        ) {
          recDiscount = discount_1;
        } else if (memberLength === 4) {
          recDiscount = discount_2;
        } else if (memberLength === 5) {
          recDiscount = discount_3;
        } else {
          recDiscount = discount_1;
        }
        const calPrice = +((recDiscount / 100) * items.price)
          .toString()
          .match(/^-?\d+(?:\.\d{0,2})?/)[0];
        const itemPrice = items.price - calPrice;
        const totalDiscounts = items.totalDiscounts;

        const productID = items.product.id;
        const VariantId = items.variant.id;
        const singleProduct = await this.inventoryService.findProductById(
          productID,
        );
        const { featuredImage, title } = singleProduct;
        const resData = {
          product_title: title,
          orderProductImage: featuredImage,
          orderProductId: productID,
          orderVariantId: VariantId,
          orderPrice: itemPrice,
          orderQuantity: itemQuantity,
          length: memberLength,
          orderTotalPrice: (itemPrice * itemQuantity)
            .toString()
            .match(/^-?\d+(?:\.\d{0,2})?/)[0],
        };
        order_line_items = [...order_line_items, { ...resData }];
      }),
    );

    const leftDiscount = discount_3 - recDiscount;
    const uptoCashback = Math.floor((leftDiscount / 100) * order_price);

    const currencySymbol = getSymbolFromCurrency(
      res.data.order?.currencyCode || 'USD',
    );

    let custName = res.data.order.customer.firstName;
    if (custName === '') {
      custName = res.data.order.customer.lasttName;
    }
    const customerEmail = res.data.order.customer.email;

    const mydate = new Date(res.data.order.createdAt);
    let orderHours = mydate.getHours();
    let hoursFormat = 'AM';
    if (orderHours >= 12) {
      hoursFormat = 'PM';
      orderHours = orderHours - 12;
    }
    const month = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][mydate.getMonth()];
    const orderDate =
      month +
      ' ' +
      mydate.getDate() +
      ', ' +
      mydate.getFullYear() +
      ', ' +
      orderHours +
      ':' +
      mydate.getMinutes() +
      ' ' +
      hoursFormat;

    if (res.post == 'yes') {
      console.log('groupshop saved listener received');
      const campaigns_products = res.data.store.activeCampaign.products;
      const currentDiscount = res.groupdeal.discountCode.percentage;
      const dealUrl = res.groupdeal.url;
      const maxDiscount = Math.floor((50 / 100) * order_price);
      let campaigns_line_items = [];

      const campaigns_items = campaigns_products.slice(0, 2);
      await Promise.all(
        campaigns_items.map(async (id) => {
          const campaignSingleProduct =
            await this.inventoryService.findProductById(id);
          const { title, price, totalDiscounts, featuredImage } =
            campaignSingleProduct;
          const variantPrice = (currentDiscount / 100) * price;

          const getCollectionName =
            await this.inventoryService.getCollectionNameByProductId(
              shopName,
              id,
            );
          const collectionName = getCollectionName[0]?.title || '';
          console.log(collectionName);

          const campaignResult = {
            product_title: title,
            product_category: collectionName,
            product_image: featuredImage !== '' ? featuredImage : 'dummy-image',
            product_price: price,
            sale_price: price - variantPrice,
          };
          campaigns_line_items = [
            ...campaigns_line_items,
            { ...campaignResult },
          ];
        }),
      );

      const mdata = {
        logoImage: res.data.store.logoImage,
        brandName: res.data.store.brandName,
        shippingAddress:
          ' 2972 Westheimer Rd. Santa Ana, Illinois 85486 United States',
        customerName: custName,
        customerEmail: customerEmail,
        dealUrl: `${this.configService.get('FRONT')}/${dealUrl}`,
        created_at: orderDate,
        order_number: res.data.order.name,
        total_price: order_price,
        currencyCode: currencySymbol,
        discount_1: discount_1,
        discount_2: discount_2,
        discount_3: discount_3,
        discount1_price: discount_1_price,
        discount2_price: discount_2_price,
        discount3_price: discount_3_price,
        max_discount: maxDiscount,
        groupdeal_link: res.data.url,
        campaignsLineItems: campaigns_line_items,
        orderLineItems: order_line_items,
      };

      console.log('data : ' + JSON.stringify(mdata));
      //console.log('url : ' + res.data.groupshop.url);

      const body = JSON.stringify({
        token: PUBLIC_KEY,
        event: 'Groupshop Order Trigger',
        customer_properties: {
          $email: customerEmail,
        },
        properties: mdata,
      });

      const options = {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      };
      this.httpService.post(url, body, options).subscribe(async (res) => {
        console.log(res);
      });
    } else {
      console.log('groupshop referrer listener received');
      const dealUrl = res.ugroupshop.url;
      const rdata = {
        brandName: res.data.store.brandName,
        shippingAddress:
          ' 2972 Westheimer Rd. Santa Ana, Illinois 85486 United States',
        customerName: custName,
        customerEmail: customerEmail,
        dealUrl: `${this.configService.get('FRONT')}/${dealUrl}`,
        created_at: orderDate,
        order_number: res.data.order.name,
        total_price: order_price,
        currencyCode: currencySymbol,
        getDiscount: recDiscount,
        getUptoCashback: uptoCashback,
        orderLineItems: order_line_items,
      };

      console.log('rdata : ' + JSON.stringify(rdata));
      const body = JSON.stringify({
        token: PUBLIC_KEY,
        event: 'Groupshop Referrer Order Trigger',
        customer_properties: {
          $email: customerEmail,
        },
        properties: rdata,
      });

      const options = {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      };
      this.httpService.post(url, body, options).subscribe(async (res) => {
        console.log(res);
      });
    }
  }
}
