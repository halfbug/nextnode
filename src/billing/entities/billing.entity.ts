import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';

export enum BillingTypeEnum {
  ON_CASHBACK,
  ON_GS_CREATION,
  ON_REFFERRAL_ADDED,
}
registerEnumType(BillingTypeEnum, {
  name: 'BillingTypeEnum',
});

@ObjectType('Billing')
export class Billing {
  @Field(() => ID)
  id: string;

  @Field(() => BillingTypeEnum, { nullable: true })
  type: BillingTypeEnum;

  @Field()
  feeCharges: number;

  @Field({ nullable: true })
  cashBack: number;

  @Field({ nullable: true })
  plan: BillingPlanEnum;

  @Field()
  groupShopId: string;

  @Field()
  storeId: string;

  @Field()
  revenue?: number;

  @Field({ defaultValue: false })
  isPaid?: boolean;
}
