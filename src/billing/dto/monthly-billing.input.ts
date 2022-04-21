import { ObjectType, Field } from '@nestjs/graphql';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';

@ObjectType()
export class MonthYearType {
  @Field()
  year?: number;

  @Field()
  month?: number;
}
@ObjectType()
export class MonthlyBillingInput {
  @Field()
  _id?: MonthYearType;

  @Field()
  feeCharges?: number;

  @Field()
  cashBack?: number;

  @Field()
  revenue?: number;

  @Field()
  count?: number;
}
@ObjectType()
export class TotalRevenue {
  @Field()
  _id?: string;

  @Field()
  revenue?: number;
}
@ObjectType()
export class Total {
  @Field()
  _id?: MonthYearType;

  @Field()
  count?: number;
}
@ObjectType()
export class SingleDayBillingInput {
  @Field()
  _id?: MonthYearType;

  @Field()
  totalCashback?: number;

  @Field()
  revenue?: number;

  @Field()
  amountFeeCharge?: number;

  @Field(() => BillingPlanEnum)
  plan?: BillingPlanEnum;

  @Field()
  storeTotalGS?: number;

  @Field()
  todaysTotalGS?: number;
}
