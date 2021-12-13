import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from 'src/shopify-store/events/order-placed.envent';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  CreateGroupshopInput,
  DealProductsInput,
  MemberInput,
  MilestoneInput,
} from '../dto/create-groupshops.input';
import { UpdateGroupshopInput } from '../dto/update-groupshops.input';
import { ProductTypeEnum, RoleTypeEnum } from '../entities/groupshop.entity';
import { GroupshopsService } from '../groupshops.service';

@Injectable()
export class OrderPlacedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configSevice: ConfigService,
    private eventEmitter: EventEmitter2,
    private gsService: GroupshopsService,
  ) {}

  static formatTitle(name: string) {
    return `GS${Math.floor(1000 + Math.random() * 9000)}${name.substring(
      1,
      name.length,
    )}`;
  }
  static addDays(date: Date, number: number) {
    const newDate = new Date(date);
    return new Date(newDate.setDate(newDate.getDate() + number));
  }
  async setDiscountCode(
    title: string,
    percentage: number,
    products: string[],
    starts: Date,
    ends: Date,
    shop: string,
    accessToken: string,
  ) {
    const client = await this.shopifyapi.client(shop, accessToken);
    const priceRule = await client.query({
      data: {
        query: `mutation priceRuleCreate($priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
          priceRuleCreate(priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
            priceRule {
              id
              title
              target
              startsAt
              endsAt
            }
            priceRuleDiscountCode {
              code
            }
            priceRuleUserErrors {
              message
            }
          }
        }`,
        variables: {
          priceRule: {
            title: title,
            target: 'LINE_ITEM',
            value: {
              percentageValue: -percentage,
            },
            itemEntitlements: {
              productIds: products,
            },
            customerSelection: {
              forAllCustomers: true,
            },
            allocationMethod: 'EACH',
            validityPeriod: {
              start: starts,
              end: ends,
            },
          },
          priceRuleDiscountCode: { code: title },
        },
      },
    });
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 65 ~ OrderPlacedListener ~ priceRule',
      JSON.stringify(priceRule),
    );
    const {
      priceRuleCreate: {
        priceRule: { id: priceRuleId },
      },
    } = priceRule.body['data'];
    return {
      title,
      percentage: percentage.toString(),
      priceRuleId: priceRuleId,
    };
  }

  @OnEvent('order.placed')
  async createGroupShop(event: OrderPlacedEvent) {
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 18 ~ OrderPlacedListener ~ createGroupShop ~ event',
      event,
    );

    console.log(
      '🚀 ~ Lineitmes ~ OrderPlacedListener ~ createGroupShop ~ event',
      event.lineItems,
    );

    const {
      order: { discountCode, name, customer, id: orderId },
      store: {
        shop,
        accessToken,
        campaigns: [
          {
            id: campaignId,
            salesTarget: { rewards },
            products: campaignProducts,
          },
        ],
        id,
      },
      lineItems,
    } = event;

    //check if product is a member of active campain.
    const dealProducts = lineItems
      .filter((item) => !campaignProducts.includes(item.product.id))
      .map((nitem) => ({
        productId: nitem.product.id,
        type: ProductTypeEnum.deal,
        addedBy: customer.firstName,
        customerIP: customer.ip,
      }));

    const gsMember = new MemberInput();
    gsMember.orderId = orderId;

    const totalCampaignProducts = campaignProducts.concat(
      dealProducts.map((p) => p.productId),
    );

    const title = OrderPlacedListener.formatTitle(name);
    const expires = OrderPlacedListener.addDays(new Date(), 7);

    if (discountCode) {
      // const updateGroupshop = await this.gsService.findOne(discountCode);
      let ugroupshop = new UpdateGroupshopInput();
      ugroupshop = await this.gsService.findOne(discountCode);
      gsMember.role = RoleTypeEnum.referral;
      // gsMember.availedDiscount = 
      ugroupshop.members = [...ugroupshop.members, gsMember];
      console.log(
        '🚀 ~ file: order-placed.listener.ts ~ line 155 ~ OrderPlacedListener ~ createGroupShop ~ updateGroupshop',
        ugroupshop,
      );
      console.log('------------ discount meet ---------');
    } else {
      const newGroupshop = new CreateGroupshopInput();
      newGroupshop.storeId = id;
      newGroupshop.campaignId = campaignId;
      newGroupshop.discountCode = await this.setDiscountCode(
        title,
        parseInt(rewards[0].discount),
        totalCampaignProducts,
        new Date(),
        expires,
        shop,
        accessToken,
      );
      newGroupshop.dealProducts = [new DealProductsInput()];
      newGroupshop.dealProducts = dealProducts;
      newGroupshop.totalProducts = totalCampaignProducts.length;
      newGroupshop.url = `/${shop.split('.')[0]}/${title}`;
      newGroupshop.createdAt = new Date();
      newGroupshop.expiredAt = expires;
      // newGroupshop.
      // gsMember.availedDiscount = rewards[0].discount;
      gsMember.role = RoleTypeEnum.owner;
      newGroupshop.members = [gsMember];
      const gsMilestone = new MilestoneInput();
      gsMilestone.activatedAt = new Date();
      gsMilestone.discount = rewards[0].discount;
      newGroupshop.milestones = [gsMilestone];
      this.gsService.create(newGroupshop);
    }
    // const client = await this.shopifyapi.client(shop, accessToken);
    // const qres = await client.query({

    // });
    //       const inventoryReceivedEvent = new InventoryReceivedEvent();
    //   inventoryReceivedEvent.bulkOperationResponse =
    //     poll.body['data']['currentBulkOperation'];
    //   inventoryReceivedEvent.shop = shop;
    //   inventoryReceivedEvent.accessToken = accessToken;

    //   this.eventEmitter.emit('inventory.received', inventoryReceivedEvent);
  }
}
