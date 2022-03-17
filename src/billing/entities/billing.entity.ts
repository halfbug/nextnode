import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum BillingTypeEnum {
  ON_CASHBACK,
  ON_GS_CREATION,
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
  amount: number;

  @Field()
  totalCashBack: number;

  @Field()
  groupShopId: string;

  @Field()
  storeId: string;

  @Field()
  revenue?: number;
}
