import { ObjectType, Field } from '@nestjs/graphql';

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
  amount?: number;

  @Field()
  totalCashBack?: number;

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
