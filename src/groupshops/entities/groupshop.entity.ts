import { ObjectType, Field, registerEnumType, ID, Int } from '@nestjs/graphql';

export enum ProductTypeEnum {
  deal,
  abandoned,
}
registerEnumType(ProductTypeEnum, {
  name: 'ProductTypeEnum',
});

export enum RefundStatusEnum {
  done,
  panding,
}
registerEnumType(RefundStatusEnum, {
  name: 'RefundStatusEnum',
});

export enum RoleTypeEnum {
  owner,
  referral,
}
registerEnumType(RoleTypeEnum, {
  name: 'RoleTypeEnum',
});

@ObjectType()
export class DealProducts {
  @Field({ nullable: true })
  productId: string;

  @Field(() => ProductTypeEnum, { nullable: true })
  type: ProductTypeEnum;

  @Field({ nullable: true })
  addedBy: string;

  @Field({ nullable: true })
  customerIP: string;
}

@ObjectType()
export class DiscountCode {
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  percentage: string;
  @Field({ nullable: true })
  priceRuleId: string;
}

@ObjectType()
export class Refund {
  @Field(() => RefundStatusEnum, { nullable: true })
  status: RefundStatusEnum;
  @Field({ nullable: true })
  createdAt: Date;
  @Field({ nullable: true })
  discount: number;
  @Field(() => Int, { nullable: true })
  amount: number;
}

@ObjectType()
export class Milestone {
  @Field({ nullable: true })
  activatedAt: Date;
  @Field({ nullable: true })
  discount: string;
}

@ObjectType()
export class Member {
  @Field({ nullable: true })
  orderId: string;

  @Field({ nullable: true })
  availedDiscount: number;

  @Field(() => RoleTypeEnum, { nullable: true })
  role: RoleTypeEnum;

  @Field(() => [Refund], { nullable: 'itemsAndList' })
  refund?: Refund[];
}

@ObjectType()
export class GroupShop {
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
}
