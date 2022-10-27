import {
  ObjectType,
  Field,
  registerEnumType,
  ID,
  Int,
  Float,
  InputType,
} from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import {
  DealProducts,
  DiscountCode,
  Member,
} from 'src/groupshops/entities/groupshop.entity';
import { Product } from 'src/inventory/entities/product.entity';
import { Store } from 'src/stores/entities/store.entity';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { CreateOrderInput as LineItem } from 'src/inventory/dto/create-order.input';
import { CustomerType } from 'src/inventory/entities/orders.entity';

@ObjectType()
export class PartnerRewards {
  @Field({ nullable: true })
  baseline?: string;
  @Field({ nullable: true })
  average?: string;
  @Field({ nullable: true })
  maximum?: string;
}

@ObjectType()
export class partnerDetails {
  @Field({ nullable: true })
  fname: string;
  @Field({ nullable: true })
  lname: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  shopifyCustomerId?: string;
}

@ObjectType()
export class Partnergroupshop {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  campaignId?: string;

  @Field()
  storeId: string;

  @Field(() => [DealProducts], { nullable: 'itemsAndList' })
  dealProducts?: DealProducts;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field({ nullable: true })
  createdAt: Date;

  @Field(() => DiscountCode)
  discountCode: DiscountCode;

  @Field(() => PartnerRewards, { nullable: true })
  partnerRewards?: PartnerRewards;

  @Field({ nullable: true })
  partnerCommission: string;

  @Field({ nullable: true })
  revenue?: string;

  @Field({ nullable: true })
  comissionAmount?: string;

  @Field({ nullable: true })
  purchases?: string;

  @Field(() => partnerDetails)
  partnerDetails: partnerDetails;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  members?: Member;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  popularProducts?: Product[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  refferalProducts?: Product[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  influencerProducts?: Product[];

  @Field(() => Campaign, { nullable: true })
  campaign?: Campaign;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  allProducts?: Product[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  bestSeller?: Product[];

  @Field(() => Store, { nullable: true })
  store?: Store;

  @Field(() => Int, { defaultValue: 0 })
  totalProducts: number;

  @Field(() => Int, { nullable: true })
  visitors: number;
  @Field(() => [PartnerMember], { nullable: 'itemsAndList' })
  memberDetails?: PartnerMember[];
}
@InputType('PartnerMemberInput')
@ObjectType('PartnerMember')
export class PartnerMember extends DefaultColumnsService {
  @Field()
  groupshopId: string;

  @Field({ nullable: true })
  orderId?: string;

  @Field({ nullable: true })
  storeId?: string;

  @Field({ nullable: true })
  orderAmount?: number;

  @Field({ nullable: true })
  comissionAmount?: number;

  @Field({ nullable: true })
  isRedeem?: boolean;
  @Field(() => CustomerType, { nullable: true })
  customerInfo?: CustomerType;
  @Field(() => [LineItem], { nullable: 'itemsAndList' })
  lineItems?: LineItem[];
}
