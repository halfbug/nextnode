import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { KalavioService } from 'src/email/kalavio.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { DropKlaviyoEvent } from '../events/drop-klaviyo.event';
import { OrdersService } from 'src/inventory/orders.service';

@Injectable()
export class DropKlaviyoListener {
  constructor(
    private shopifyService: ShopifyService,
    private eventEmitter: EventEmitter2,
    private configSevice: ConfigService,
    private crypt: EncryptDecryptService,
    private dropsGroupshopService: DropsGroupshopService,
    private kalavioService: KalavioService,
    private storesService: StoresService,
    private ordersService: OrdersService,
    private inventryService: InventoryService,
  ) {}

  @OnEvent('drop.klaviyo')
  async dropKlaviyo(event: DropKlaviyoEvent | { webhook: any }) {
    try {
      console.log('drop.klaviyo  ', JSON.stringify(event));
      const webdata = event.webhook;
      const shortURL = webdata.shortUrl;
      const klaviyoId = webdata.customerDetail.klaviyoId;

      // Update latest milestone discount that is active on the klaviyo profile
      const currentProfile = await this.kalavioService.getProfilesById(
        klaviyoId,
      );
      let current_milestone_discount;
      const latestShortUrl =
        currentProfile.data.attributes.properties?.groupshop_url;
      if (shortURL === latestShortUrl) {
        const memberLength = webdata.members?.length;
        if (memberLength === 0) {
          current_milestone_discount = 'NA';
        } else if (memberLength === 1) {
          current_milestone_discount = webdata.milestones[0].discount;
        } else if (memberLength === 2) {
          current_milestone_discount = webdata.milestones[1].discount;
        } else {
          current_milestone_discount = webdata.milestones[2]
            ? webdata.milestones[2].discount
            : '';
        }
        const params = new URLSearchParams({
          current_milestone_discount: current_milestone_discount,
        });
        const data = params.toString();
        await this.kalavioService.klaviyoProfileUpdate(klaviyoId, data);
      }

      // Drop Groupshop Order Trigger on Klaviyo
      const orderid_referral1 =
        webdata.members.length >= 2 ? webdata.members[1].orderId : null;
      const orderid_referral2 =
        webdata.members.length >= 3 ? webdata.members[2].orderId : null;

      let cust_referral1_name = '';
      if (orderid_referral1 !== null) {
        const cust_referral1 =
          await this.ordersService.getCustomerNameByOrderId(orderid_referral1);
        cust_referral1_name = cust_referral1[0].customer.firstName;
      }
      let cust_referral2_name = '';
      if (orderid_referral2 !== null) {
        const cust_referral2 =
          await this.ordersService.getCustomerNameByOrderId(orderid_referral2);
        cust_referral2_name = cust_referral2[0].customer.firstName;
      }
      const mdata = {
        current_gs_referral1: cust_referral1_name,
        current_gs_referral2: cust_referral2_name,
        referral_count: webdata.members.length - 1,
      };
      const body = {
        event: 'Drop Groupshop Order Trigger',
        customer_properties: {
          first_name: webdata.customerDetail.firstName,
          last_name: webdata.customerDetail.lastName,
          email:
            webdata.customerDetail.email !== 'None'
              ? webdata.customerDetail.email
              : null,
          phone_number: webdata.customerDetail.phone,
          groupshop_url: webdata.shortUrl,
        },
        properties: mdata,
      };
      this.kalavioService.sendKlaviyoEmail(body);
    } catch (err) {
      console.log(err);
      Logger.error(err, DropKlaviyoListener.name);
    }
  }
}
