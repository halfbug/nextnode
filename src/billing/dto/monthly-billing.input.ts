import { ObjectType, Field } from '@nestjs/graphql';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';

@ObjectType()
export class MonthYearType {
  @Field({ nullable: true })
  year?: number;

  @Field({ nullable: true })
  month?: number;

  @Field({ nullable: true })
  date?: number;
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
  @Field({ nullable: true })
  _id?: MonthYearType;

  @Field({ nullable: true })
  totalCashback?: number;

  @Field({ nullable: true })
  revenue?: number;

  @Field({ nullable: true })
  amountFeeCharge?: number;

  @Field(() => BillingPlanEnum, { nullable: true })
  plan?: BillingPlanEnum;

  @Field({ nullable: true })
  storeTotalGS?: number;

  @Field({ nullable: true })
  todaysTotalGS?: number;
}
