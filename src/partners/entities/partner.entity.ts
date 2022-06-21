import {
  ObjectType,
  Field,
  registerEnumType,
  ID,
  Int,
  Float,
} from '@nestjs/graphql';
import {
  DealProducts,
  DiscountCode,
} from 'src/groupshops/entities/groupshop.entity';

@ObjectType()
export class PartnerRewards {
  @Field({ nullable: true })
  baseline: string;
  @Field({ nullable: true })
  average: string;
  @Field({ nullable: true })
  maximum: string;
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

  @Field()
  campaignId: string;

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

  @Field(() => PartnerRewards)
  partnerRewards: PartnerRewards;

  @Field({ nullable: true })
  partnerCommission: string;

  @Field(() => partnerDetails)
  partnerDetails: partnerDetails;

  @Field({ nullable: true })
  isActive?: boolean;
}
