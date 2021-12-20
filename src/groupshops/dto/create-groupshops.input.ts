import { InputType, Int, Field, ID } from '@nestjs/graphql';
import { CreateOrderInput as LineItem } from 'src/inventory/dto/create-order.input';
import {
  ProductTypeEnum,
  RefundStatusEnum,
  RoleTypeEnum,
} from '../entities/groupshop.entity';

// import { GroupShop } from '../entities/Groupshop.entity';
@InputType()
export class DealProductsInput {
  @Field({ nullable: true })
  productId: string;

  @Field(() => ProductTypeEnum, { nullable: true })
  type: ProductTypeEnum;

  @Field({ nullable: true })
  addedBy: string;

  @Field({ nullable: true })
  customerIP: string;
}

@InputType()
export class DiscountCodeInput {
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  percentage: string;
  @Field({ nullable: true })
  priceRuleId: string;
}

@InputType()
export class MemberInput {
  @Field({ nullable: true })
  orderId: string;

  @Field({ nullable: true })
  availedDiscount: number;

  @Field(() => RoleTypeEnum, { nullable: true })
  role: RoleTypeEnum;

  @Field(() => [RefundInput], { nullable: 'itemsAndList' })
  refund?: RefundInput[];

  @Field(() => [LineItem], { nullable: 'itemsAndList' })
  lineItems?: LineItem[];
}

@InputType()
export class MilestoneInput {
  @Field({ nullable: true })
  activatedAt: Date;
  @Field({ nullable: true })
  discount: string;
}

@InputType()
export class RefundInput {
  @Field(() => RefundStatusEnum, { nullable: true })
  status: RefundStatusEnum;
  @Field({ nullable: true })
  createdAt: Date;
  @Field({ nullable: true })
  discount: number;
  @Field(() => Int, { nullable: true })
  amount: number;

  constructor(
    status?: RefundStatusEnum,
    createdAt?: Date,
    discount?: number,
    amount?: number,
  ) {
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.discount = discount;
    this.amount = amount;
  }
}

@InputType()
export class CreateGroupshopInput {
  @Field()
  campaignId: string;

  @Field()
  storeId: string;

  @Field(() => Int, { defaultValue: 0 })
  totalProducts: number;

  @Field(() => [DealProductsInput], { nullable: 'itemsAndList' })
  dealProducts?: DealProductsInput[];

  @Field()
  url: string;

  @Field()
  createdAt: Date;

  @Field()
  expiredAt: Date;

  @Field(() => DiscountCodeInput)
  discountCode: DiscountCodeInput;

  @Field(() => [MemberInput])
  members: MemberInput[];

  @Field(() => [MilestoneInput])
  milestones: MilestoneInput[];
}
