import { Injectable } from '@nestjs/common';
import { Controller, forwardRef, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { KalavioService } from '../kalavio.service';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GroupshopSavedEvent } from 'src/groupshops/events/groupshop-saved.event';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as getSymbolFromCurrency from 'currency-symbol-map';
import { UploadImageService } from 'src/shopify-store/ImageUpload/uploadimage.service';

@Injectable()
export class GroupshopSavedListener {
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private httpService: HttpService,
    private inventoryService: InventoryService,
    private ordersService: OrdersService,
    private kalavioService: KalavioService,
    private uploadImageService: UploadImageService,
  ) {}

  @OnEvent('groupshop.saved')
  async handleTokenReceivedEvent(res: GroupshopSavedEvent) {
    const PUBLIC_KEY = this.configService.get('KLAVIYO_PUBLIC_KEY');
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');

    //console.log('resData : ' + JSON.stringify(res));
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

    const order_price = Number(res.data.order.price);
    const total_discounts = Number(res.data.order.totalDiscounts);
    const sumTotalPrice = (order_price + total_discounts)
      .toString()
      .match(/^-?\d+(?:\.\d{0,2})?/)[0];
    const discount_1_price = Math.floor((discount_1 / 100) * order_price);
    const discount_2_price = Math.floor((discount_2 / 100) * order_price);
    const discount_3_price = Math.floor((discount_3 / 100) * order_price);
    const memberLength = res?.ugroupshop?.members.length || 0;
    const shopName = res.data.order.shop;
    const orderData = await this.ordersService.getOrderDetailsByOrderId(
      res.data.order.id,
    );
    //console.log('orderData : ' + JSON.stringify(orderData));
    let order_line_items = [];
    let recDiscount = 0;
    let milestoneStatus = 'pending';
    orderData[0].LineItems.map((items) => {
      const itemQuantity = items.quantity;
      if (memberLength === 0) {
        recDiscount = 0;
      } else if (
        memberLength === 1 ||
        memberLength === 2 ||
        memberLength === 3
      ) {
        recDiscount = discount_1;
      } else if (memberLength === 4 || memberLength === 5) {
        recDiscount = discount_2;
      } else {
        recDiscount = discount_1;
        milestoneStatus = 'reached';
      }
      const calPrice = +((recDiscount / 100) * items.price)
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
        orderVariantId: VariantId,
        orderPrice: itemPrice,
        orderQuantity: itemQuantity,
        length: memberLength,
        orderTotalPrice: (items.price * itemQuantity)
          .toString()
          .match(/^-?\d+(?:\.\d{0,2})?/)[0],
        orderTotalSalePrice: (itemPrice * itemQuantity)
          .toString()
          .match(/^-?\d+(?:\.\d{0,2})?/)[0],
      };
      order_line_items = [...order_line_items, { ...resData }];
    });

    const leftDiscount = discount_3 - recDiscount;
    const uptoCashback = Math.floor((leftDiscount / 100) * order_price);
    const currencySymbol = getSymbolFromCurrency(
      orderData[0].currencyCode || 'USD',
    );

    const sms_marketing_consent =
      res.data.order?.customer?.sms_marketing || null;
    const phone_number = res.data.order?.customer?.phone || null;

    let custName = orderData[0].customer.firstName;
    if (custName === '') {
      custName = orderData[0].customer.lasttName;
    }
    const customerEmail = orderData[0].customer.email;

    const mydate = new Date(orderData[0].createdAt);
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
    let brandLogo = '';
    if (res.data.store.logoImage != '') {
      const imgPath = res.data.store.logoImage.split('/');
      //brandLogo = await this.uploadImageService.getSignedUrl(imgPath[4]);
      brandLogo = `${this.configService.get('LOGO_PATH')}/${imgPath[4]}`;
    } else {
      brandLogo = `${this.configService.get(
        'HOST',
      )}/public/images/default-logo.png`;
    }

    // console.log(brandLogo);

    if (res.post == 'yes') {
      // console.log('groupshop saved listener received');
      const campaigns_products = res.data.store.activeCampaign.products;
      const currentDiscount = res.groupdeal.discountCode.percentage;
      const shortLink = res.groupdeal.shortUrl;
      const dealUrl = res.groupdeal.url;
      const maxDiscount = Math.floor((50 / 100) * order_price);
      let campaigns_line_items = [];

      const qrImage = await this.kalavioService.generateQrCode(shortLink);
      const campaigns_items = campaigns_products.slice(0, 2);
      await Promise.all(
        campaigns_items.map(async (id) => {
          const campaignSingleProduct =
            await this.inventoryService.findProductById(id);
          const { title, price, featuredImage } = campaignSingleProduct;
          const variantPrice = (currentDiscount / 100) * price;
          const prdId = id.replace('gid://shopify/Product/', '');
          // const getCollectionName =
          //   await this.inventoryService.getCollectionNameByProductId(
          //     shopName,
          //     id,
          //   );
          //const collectionName = getCollectionName[0]?.title || '';
          const salePrice = +(price - variantPrice)
            .toString()
            .match(/^-?\d+(?:\.\d{0,2})?/)[0];
          const discountPrice = price - salePrice;
          const campaignResult = {
            product_title: title,
            product_category: '',
            product_image: featuredImage !== '' ? featuredImage : 'dummy-image',
            product_price: price,
            product_url: `${this.configService.get(
              'FRONT',
            )}${dealUrl}/product&${prdId}`,
            sale_price: salePrice,
            discount_price: +discountPrice
              .toString()
              .match(/^-?\d+(?:\.\d{0,2})?/)[0],
          };
          campaigns_line_items = [
            ...campaigns_line_items,
            { ...campaignResult },
          ];
        }),
      );
      console.log(qrImage);
      const mdata = {
        logoImage: brandLogo,
        shopUrl: `https://${res.data.store.shop}`,
        brandName: res.data.store.brandName,
        shippingAddress: ' --- ',
        customerName: custName,
        customerEmail: customerEmail,
        dealUrl: `${this.configService.get('FRONT')}${dealUrl}`,
        shortUrl: shortLink,
        sms_marketing_consent: sms_marketing_consent,
        phone_number: phone_number,
        qrImage: qrImage,
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
        milestoneStatus: milestoneStatus,
        campaignsLineItems: campaigns_line_items,
        orderLineItems: order_line_items,
      };

      const body = JSON.stringify({
        token: PUBLIC_KEY,
        event: 'Groupshop Order Trigger',
        customer_properties: {
          $email: customerEmail,
        },
        properties: mdata,
      });

      this.kalavioService.sendKlaviyoEmail(body);
    } else {
      console.log('groupshop referrer listener received');
      const dealUrl = res.ugroupshop.url;
      const shortLink = res.ugroupshop.shortUrl;
      const qrImage = await this.kalavioService.generateQrCode(shortLink);

      const rdata = {
        logoImage: brandLogo,
        brandName: res.data.store.brandName,
        shopUrl: `https://${res.data.store.shop}`,
        shippingAddress: ' --- ',
        customerName: custName,
        customerEmail: customerEmail,
        dealUrl: `${this.configService.get('FRONT')}${dealUrl}`,
        shortUrl: shortLink,
        sms_marketing_consent: sms_marketing_consent,
        phone_number: phone_number,
        qrImage: qrImage,
        created_at: orderDate,
        order_number: res.data.order.name,
        total_price: sumTotalPrice,
        total_sale_price: order_price,
        currencyCode: currencySymbol,
        getDiscount: recDiscount,
        milestoneStatus: milestoneStatus,
        getUptoCashback: uptoCashback,
        getUptoDiscount: leftDiscount,
        orderLineItems: order_line_items,
      };

      const body = JSON.stringify({
        token: PUBLIC_KEY,
        event: 'Groupshop Referrer Order Trigger',
        customer_properties: {
          $email: customerEmail,
        },
        properties: rdata,
      });

      this.kalavioService.sendKlaviyoEmail(body);
    }
  }
}
