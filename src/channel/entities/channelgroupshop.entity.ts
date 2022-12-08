import {
  ObjectType,
  Field,
  registerEnumType,
  ID,
  Int,
  Float,
} from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import {
  DealProducts,
  DiscountCode,
  Member,
  Milestone,
} from 'src/groupshops/entities/groupshop.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import {
  CreateOrderInput as Order,
  Customer,
} from 'src/inventory/dto/create-order.input';
import { Product } from 'src/inventory/entities/product.entity';
import { PartnerMember } from 'src/partners/entities/partner.entity';
import { Store } from 'src/stores/entities/store.entity';

@ObjectType()
export class ChannelGroupShop {
  @Field({ nullable: true })
  customerDetail: Customer;

  @Field()
  channelId: string;

  @Field(() => ID)
  id: string;

  @Field()
  campaignId: string;

  @Field()
  storeId: string;

  @Field(() => Int, { defaultValue: 0 })
  totalProducts: number;

  @Field(() => [DealProducts], { nullable: 'itemsAndList' })
  dealProducts?: DealProducts[];

  @Field()
  url: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field({ nullable: true })
  exipredShortLink?: string;

  @Field()
  createdAt: Date;

  @Field()
  expiredAt: Date;

  @Field(() => DiscountCode)
  discountCode: DiscountCode;

  @Field(() => [Member])
  members: Member[];

  @Field(() => [Milestone])
  milestones: Milestone[];

  @Field(() => Store, { nullable: true })
  store?: Store;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  popularProducts?: Product[];

  @Field(() => Campaign, { nullable: true })
  campaign?: Campaign;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  allProducts?: Product[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  bestSeller?: Product[];

  // @Field({ nullable: true })
  // isActive?: boolean;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  ownerProducts?: Product[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  refferalProducts?: Product[];
}

@ObjectType()
export class SignUpUsers {
  @Field({ nullable: true })
  customerDetail: Customer;

  @Field()
  channelId: string;

  @Field(() => ID)
  id: string;

  @Field()
  campaignId: string;

  @Field()
  storeId: string;

  @Field()
  url: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field(() => DiscountCode)
  discountCode: DiscountCode;

  @Field(() => Channel)
  channel: Channel;
}
