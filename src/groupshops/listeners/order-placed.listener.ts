import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateMemberInput } from 'aws-sdk/clients/managedblockchain';
import { Reward } from 'src/appsettings/entities/sales-target.model';
import { CashBackEvent } from 'src/billing/events/cashback.event';
import Orders from 'src/inventory/entities/orders.modal';
import { OrderPlacedEvent } from 'src/shopify-store/events/order-placed.envent';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { GS_CHARGE_CASHBACK } from 'src/utils/constant';
import { KalavioService } from 'src/email/kalavio.service';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
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
import { GroupshopSavedEvent } from '../events/groupshop-saved.event';
import { Groupshops, RefundStatusEnum } from '../entities/groupshop.modal';
import { GroupShopCreated } from '../events/groupshop-created.event';
import { GroupshopsService } from '../groupshops.service';
import Store from 'src/stores/entities/store.model';
import { RefAddedEvent } from '../events/refferal-added.event';
import { PartnerService } from 'src/partners/partners.service';
import { Partnergroupshop } from 'src/partners/entities/partner.modal';
import { PMemberArrivedEvent } from 'src/partners/events/pmember-arrived.event';

@Injectable()
export class OrderPlacedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configSevice: ConfigService,
    private eventEmitter: EventEmitter2,
    private gsService: GroupshopsService,
    private kalavioService: KalavioService,
    private crypt: EncryptDecryptService,
    private addedRef: RefAddedEvent,
    private partnerSrv: PartnerService,
    private pmemberArrived: PMemberArrivedEvent,
  ) {}

  accessToken: string;
  shop: string;
  store: Store;
  order: Orders;
  groupshop: Groupshops;
  partnerGroupshop: Partnergroupshop;

  static formatTitle(name: string) {
    return `GS${Math.floor(1000 + Math.random() * 9000)}${name?.substring(
      1,
      name.length,
    )}`;
  }
  static addDays(date: Date, number: number) {
    const newDate = new Date(date);
    return new Date(newDate.setDate(newDate.getDate() + number));
  }

  getNextMemberDiscount(totalMembers: number, rewards: Reward[]) {
    if (totalMembers === 6) return rewards[0].discount;
    return (
      rewards.filter((rew) => parseInt(rew.customerCount) === totalMembers)[0]
        ?.discount || null
    );
  }

  totalPricePercent(
    lineItems: Orders[],
    discountPercentage: number,
    role: RoleTypeEnum,
  ) {
    const totalPrice = lineItems?.reduce(
      (
        priceSum: number,
        { discountedPrice, price, quantity, discountInfo },
      ) => {
        // check if owner have another discount used
        // so we consider discounted price as selling price
        if (role === RoleTypeEnum.owner)
          return priceSum + quantity * (discountedPrice ?? parseFloat(price));
        else {
          // calculate price if the referral use other discounts as well
          // so we subtract other discount value from orignal price and consider it as selling price
          const fprice =
            discountInfo.length > 1
              ? parseFloat(price) -
                discountInfo.reduce((psum: number, discount: any) => {
                  if (discount.code.includes('script'))
                    return psum + +discount.amount;
                  else return psum;
                }, 0)
              : parseFloat(price);
          return priceSum + quantity * fprice;
        }
      },
      0,
    );
    const netPrice = (discountPercentage / 100) * totalPrice;
    return netPrice < 1 ? netPrice : Math.floor(netPrice);
  }

  totalRevenue(lineItems: any[], discountPercentage: number) {
    const totalPrice = lineItems?.reduce(
      (priceSum: number, { price, quantity }) =>
        priceSum + quantity * parseFloat(price),
      0,
    );
    const netPrice = ((100 - discountPercentage) / 100) * totalPrice;
    return netPrice < 1 ? netPrice : Math.floor(netPrice);
  }
  async shopifyRefund(amount: string, orderId: string, discount: number) {
    // console.log('.............shopifyrefund....................');
    // console.log({ amount });
    // console.log({ orderId });
    // console.log({ discount });

    const client = await this.shopifyapi.client(this.shop, this.accessToken);
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 79 ~ OrderPlacedListener ~ shopifyRefund ~ this.accessToken',
      this.accessToken,
    );
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 79 ~ OrderPlacedListener ~ shopifyRefund ~ this.shop,',
      this.shop,
    );
    const refund = await client.query({
      data: {
        query: `mutation refundCreate($input: RefundInput!) {
          refundCreate(input: $input) {
            order {
              id
              name
            }
            refund {
              id
              
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          input: {
            orderId: orderId,
            note: `GROUPSHOP - ${discount}% cash back for referral`,
            notify: true,
            transactions: {
              amount,
              gateway: 'exchange-credit',
              kind: 'REFUND',
              orderId: orderId,
            },
          },
        },
      },
    });
    console.log(JSON.stringify(refund));
    console.log('.............shopifyrefund....................');
  }

  calculateRefund(member: any, milestone: number) {
    const netDiscount = milestone * 100 - member.availedDiscount;
    // 100 -

    const refundAmount = this.totalPricePercent(
      member.lineItems,
      netDiscount,
      member.role,
    );
    const revenuePrice = this.totalRevenue(member.lineItems, netDiscount);

    // cashback - gsfees
    const percentageGiven = (100 - GS_CHARGE_CASHBACK) / 100;
    const cashBackUsageCharge = GS_CHARGE_CASHBACK / 100; //convert percentage in amount
    const cashBackUsageChargeAmount = refundAmount * cashBackUsageCharge;
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 151 ~ OrderPlacedListener ~ calculateRefund ~ refundAmount',
      refundAmount,
    );
    const shopifyAmount = Math.floor(refundAmount - cashBackUsageChargeAmount);
    console.log(
      '🚀 ~ file: order-placed.listener.ts ~ line 116  calculateRefund ~ refundAmount',
      refundAmount,
    );
    this.shopifyRefund(shopifyAmount.toString(), member.orderId, netDiscount);
    // after shopify refund we emit cashBack event n go to billing listner
    const cashBackEvent = new CashBackEvent();
    cashBackEvent.cashbackAmount = shopifyAmount;
    cashBackEvent.cashbackCharge = cashBackUsageChargeAmount;
    cashBackEvent.groupshop = this.groupshop;
    // cashBackEvent.revenue = revenuePrice;
    cashBackEvent.revenue = 0;
    cashBackEvent.orderId = member.orderId;
    cashBackEvent.netDiscount = netDiscount;
    cashBackEvent.store = this.store;
    console.log('.......cashback..........');
    this.eventEmitter.emit('cashback.generated', cashBackEvent);
    this.eventEmitter.emit('cashbackEmail.generated', cashBackEvent);

    const refund = new RefundInput(
      RefundStatusEnum.panding,
      new Date(),
      netDiscount,
      refundAmount,
    );

    member.refund = [...(member.refund ?? []), refund];
    member.availedDiscount += netDiscount;
    return member;
  }
  setPreviousMembersRefund(
    members: MemberInput[],
    discountCode: DiscountCodeInput,
  ) {
    const totalMembers = members.length;
    const currentMilestone = parseFloat(discountCode.percentage) / 100;
    return members.map((member) => {
      if (totalMembers === 6 && member.role === RoleTypeEnum.owner) {
        member = this.calculateRefund(member, 50 / 100);
      } else if (totalMembers === 10 && member.role === RoleTypeEnum.owner) {
        member = this.calculateRefund(member, 90 / 100);
      } else if (member.availedDiscount / 100 < currentMilestone) {
        member = this.calculateRefund(member, currentMilestone);
      }

      return member;
    });
  }

  @OnEvent('order.placed')
  async createGroupShop(event: OrderPlacedEvent) {
    try {
      // console.log(
      //   '🚀 ~ file: order-placed.listener.ts ~ line 18 ~ OrderPlacedListener ~ createGroupShop ~ event',
      //   event,
      // );
      const {
        order: {
          discountCode,
          name,
          customer,
          id: orderId,
          price: totalProductPrice,
        },
        store: {
          shop,
          accessToken,
          activeCampaign: {
            id: campaignId,
            salesTarget: { rewards },
            products: campaignProducts,
          },
          id,
        },
        lineItems,
      } = event;
      console.log('totalProductPrice : ' + totalProductPrice);
      this.accessToken = accessToken;
      this.shop = shop;
      this.order = event.order;
      this.store = event.store;

      const gsMember = new MemberInput();
      gsMember.orderId = orderId;
      // filter out items that price is less than or eq to 1
      const newLineItems = lineItems.filter(({ price }) => +price > 1);
      gsMember.lineItems = newLineItems;
      // console.log(
      //   '🚀 ~ file: order-placed.listener.ts ~ line 242 ~ OrderPlacedListener ~ createGroupShop ~ newLineItems',
      //   newLineItems,
      // );

      const title = OrderPlacedListener.formatTitle(name);
      const expires = OrderPlacedListener.addDays(new Date(), 14);
      let ownerDiscount = false;
      //check order price is greater than $1
      if (+totalProductPrice > 1) {
        let ugroupshop = null;
        let pgroupshop = null;
        if (discountCode) {
          // const updateGroupshop = await this.gsService.findOne(discountCode);
          ugroupshop = new UpdateGroupshopInput();
          ugroupshop = await this.gsService.findOneWithLineItems(discountCode);
          pgroupshop = await this.partnerSrv.findOne(discountCode);
          console.log(
            '🚀 ~ file: order-placed.listener.ts ~ line 293 ~ OrderPlacedListener ~ createGroupShop ~ pgroupshop',
            pgroupshop,
          );
        }
        if (ugroupshop) {
          console.log('🚀 ugroupshop groupshop', ugroupshop);
          const {
            discountCode: { title, priceRuleId },
            createdAt,
            expiredAt,
            id,
            dealProducts,
          } = ugroupshop;
          this.groupshop = ugroupshop as Groupshops;
          const totalCampaignProducts = campaignProducts.concat(
            dealProducts?.map((p: { productId: any }) => p.productId) || [],
          );

          gsMember.role = RoleTypeEnum.referral;
          gsMember.availedDiscount = parseFloat(
            ugroupshop.discountCode.percentage,
          );
          ugroupshop.members = [...ugroupshop.members, gsMember];

          this.addedRef.groupshop = this.groupshop;
          this.addedRef.groupshopId = id;
          this.addedRef.emit();

          ugroupshop.dealProducts = dealProducts;
          ugroupshop.totalProducts = totalCampaignProducts.length;
          ugroupshop.members = this.setPreviousMembersRefund(
            ugroupshop.members,
            ugroupshop.discountCode,
          );

          const newDiscount = this.getNextMemberDiscount(
            ugroupshop.members.length,
            rewards,
          );

          if (!!newDiscount) {
            ugroupshop.discountCode = await this.shopifyapi.setDiscountCode(
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
            gsMilestone.discount = `${newDiscount}`;
            ugroupshop.milestones = [...ugroupshop.milestones, gsMilestone];
          }
          await this.gsService.update(ugroupshop);

          const groupshopSavedEvent = new GroupshopSavedEvent();
          console.log('Referrer Order');
          groupshopSavedEvent.data = event;
          groupshopSavedEvent.post = 'no';
          groupshopSavedEvent.groupdeal = newDiscount;
          groupshopSavedEvent.ugroupshop = ugroupshop;
          this.eventEmitter.emit('groupshop.saved', groupshopSavedEvent);
        } else if (pgroupshop) {
          this.pmemberArrived.pgroupshop = pgroupshop;
          this.pmemberArrived.order = event.order;
          this.pmemberArrived.store = event.store;
          this.pmemberArrived.lineItems = event.lineItems;
          this.pmemberArrived.emit();
          // create billing for partner
        } else {
          ownerDiscount = !!discountCode && true;
          const dealProducts = newLineItems
            .filter((item) => !campaignProducts.includes(item.product.id))
            .map((nitem) => ({
              productId: nitem.product.id,
              type: ProductTypeEnum.deal,
              addedBy: customer.firstName,
              customerIP: customer.ip,
            }));
          const totalCampaignProducts = campaignProducts.concat(
            dealProducts.map((p) => p.productId),
          );
          const cryptURL = `/${shop.split('.')[0]}/deal/${this.crypt.encrypt(
            title,
          )}`;

          const ownerCryptURL = `/${
            shop.split('.')[0]
          }/deal/${this.crypt.encrypt(title)}/owner&${this.crypt.encrypt(
            event?.order?.name,
          )}`;
          const fulllink = `${this.configSevice.get('FRONT')}${cryptURL}`;
          const exipredFulllink = `${this.configSevice.get(
            'FRONT',
          )}${cryptURL}/status&activated`;
          const shortLink = await this.kalavioService.generateShortLink(
            fulllink,
          );
          const exipredShortLink = await this.kalavioService.generateShortLink(
            exipredFulllink,
          );
          console.log('myshort wwww: ' + shortLink);

          const newGroupshop = new CreateGroupshopInput();
          newGroupshop.storeId = id;
          newGroupshop.campaignId = campaignId;
          newGroupshop.discountCode = await this.shopifyapi.setDiscountCode(
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
          newGroupshop.url = cryptURL;
          newGroupshop.obSettings = { ownerUrl: ownerCryptURL, step: 0 };
          newGroupshop.shortUrl = shortLink;
          newGroupshop.exipredShortLink = exipredShortLink;
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
          // this.gsService.create(newGroupshop);

          const groupshopSavedEvent = new GroupshopSavedEvent();
          console.log('GroupshopSavedEvent Start');
          groupshopSavedEvent.data = event;
          groupshopSavedEvent.post = 'yes';
          groupshopSavedEvent.groupdeal = newGroupshop;
          this.eventEmitter.emit('groupshop.saved', groupshopSavedEvent);

          const savedGs = await this.gsService.create(newGroupshop);
          const groupShopCreated = new GroupShopCreated();
          groupShopCreated.groupshop = savedGs;
          groupShopCreated.store = event.store;
          // groupShopCreated.revenue = this.totalRevenue(lineItems, 0);
          groupShopCreated.revenue = 0;
          this.eventEmitter.emit('groupshop.created', groupShopCreated);
        }
      }
    } catch (err) {
      console.log(
        '🚀 ~ file: order-placed.listener.ts ~ line 452 ~ OrderPlacedListener ~ createGroupShop ~ err',
        err,
      );
      Logger.error(err, OrderPlacedListener.name);
    }
  }
}
