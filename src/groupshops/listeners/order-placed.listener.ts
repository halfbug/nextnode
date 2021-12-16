import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Reward } from 'src/appsettings/entities/sales-target.model';
import { OrderPlacedEvent } from 'src/shopify-store/events/order-placed.envent';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  CreateGroupshopInput,
  DealProductsInput,
  DiscountCodeInput,
  MemberInput,
  MilestoneInput,
  RefundInput,
} from '../dto/create-groupshops.input';
import { UpdateGroupshopInput } from '../dto/update-groupshops.input';
import { ProductTypeEnum, RoleTypeEnum } from '../entities/groupshop.entity';
import { RefundStatusEnum } from '../entities/groupshop.modal';
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
    shop: string,
    action: string,
    accessToken: string,
    title?: string,
    percentage?: number,
    products?: string[],
    starts?: Date,
    ends?: Date,
    id?: string,
  ) {
    // if (percentage) {
    const client = await this.shopifyapi.client(shop, accessToken);
    let priceRule: any;

    if (action === 'Create')
      priceRule = await client.query({
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
            id: id || null,
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
    else
      priceRule = await client.query({
        data: {
          query: `mutation priceRuleUpdate($id: ID!,$priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
          priceRuleUpdate(id: $id, priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
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
            id,
            priceRule: {
              value: {
                percentageValue: -percentage,
              },
            },
          },
        },
      });
    // const

    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 65 ~ OrderPlacedListener ~ priceRule',
      JSON.stringify(priceRule),
    );
    const {
      [`priceRule${action}`]: {
        priceRule: { id: priceRuleId },
      },
    } = priceRule.body['data'];
    return {
      title,
      percentage: percentage.toString(),
      priceRuleId: priceRuleId,
    };
    // }
  }

  getNextMemberDiscount(totalMembers: number, rewards: Reward[]) {
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 134 ~ OrderPlacedListener ~ getNextMemberDiscount ~ totalMembers',
      totalMembers,
    );
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 134 ~ OrderPlacedListener ~ getNextMemberDiscount ~ rewards',
      rewards,
    );
    console.log(
      rewards.filter((rew) => parseInt(rew.customerCount) === totalMembers + 1),
    );
    if (totalMembers === 5) return rewards[0].discount;
    return (
      rewards.filter(
        (rew) => parseInt(rew.customerCount) === totalMembers + 1,
      )[0]?.discount || null
    );
  }

  calculatePreviousMembersRefund(
    members: MemberInput[],
    discountCode: DiscountCodeInput,
  ) {
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 167 ~ OrderPlacedListener ~ getPreviousMembersRefund ~ members',
      members,
    );

    const totalMembers = members.length;
    const membersRefund = members.map((member) => {
      if (member.availedDiscount < parseInt(discountCode.percentage)) {
        const refund = new RefundInput();
        refund.discount =
          parseInt(discountCode.percentage) - member.availedDiscount;
        refund.status = RefundStatusEnum.panding;
        refund.createdAt = new Date();
        // refund.amount = discountCode.percentage -
      }
    });
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      ugroupshop = await this.gsService.findOneWithLineItems(discountCode);
      const {
        discountCode: { title, priceRuleId },
        createdAt,
        expiredAt,
      } = ugroupshop;

      gsMember.role = RoleTypeEnum.referral;
      gsMember.availedDiscount = parseFloat(ugroupshop.discountCode.percentage);
      ugroupshop.members = [...ugroupshop.members, gsMember];
      const newDiscount = this.getNextMemberDiscount(
        ugroupshop.members.length,
        rewards,
      );
      console.log(
        '🚀 ~ file: order-placed.listener.ts ~ line 235 ~ OrderPlacedListener ~ createGroupShop ~ newDiscount',
        newDiscount,
      );

      if (newDiscount) {
        ugroupshop.discountCode = await this.setDiscountCode(
          shop,
          'Update',
          accessToken,
          title,
          parseInt(newDiscount),
          totalCampaignProducts,
          createdAt,
          expiredAt,
          priceRuleId,
        );
        const gsMilestone = new MilestoneInput();
        gsMilestone.activatedAt = new Date();
        gsMilestone.discount = `${newDiscount}%`;
        ugroupshop.milestones = [...ugroupshop.milestones, gsMilestone];
      }

      ugroupshop.dealProducts = dealProducts;
      ugroupshop.totalProducts = totalCampaignProducts.length;

      await this.gsService.update(ugroupshop);
    } else {
      const newGroupshop = new CreateGroupshopInput();
      newGroupshop.storeId = id;
      newGroupshop.campaignId = campaignId;
      newGroupshop.discountCode = await this.setDiscountCode(
        shop,
        'Create',
        accessToken,
        title,
        parseInt(rewards[0].discount),
        totalCampaignProducts,
        new Date(),
        expires,
      );
      newGroupshop.dealProducts = [new DealProductsInput()];
      newGroupshop.dealProducts = dealProducts;
      newGroupshop.totalProducts = totalCampaignProducts.length;
      newGroupshop.url = `/${shop.split('.')[0]}/${title}`;
      newGroupshop.createdAt = new Date();
      newGroupshop.expiredAt = expires;
      // newGroupshop.
      gsMember.availedDiscount = 0;
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
