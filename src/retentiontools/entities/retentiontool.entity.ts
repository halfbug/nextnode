import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Retentiontool {
  @Field()
  id?: string;

  @Field()
  shop: string;

  @Field()
  storeId: string;

  @Field({ nullable: true })
  groupshopsCreated?: number;

  @Field({ nullable: true })
  startDate?: string;

  @Field({ nullable: true })
  endDate?: string;

  @Field({ nullable: true })
  minOrderValue?: string;

  @Field(() => [String], { nullable: true })
  orderIds?: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt?: Date;
}

@ObjectType('CustomersType')
export class CustomersType {
  @Field({ nullable: true })
  firstName: string;
  @Field({ nullable: true })
  lastName: string;
  @Field({ nullable: true })
  email: string;
}

@ObjectType('RetentionAnalytics')
export class RetentionAnalytics {
  @Field({ nullable: true })
  id?: string;
  @Field({ nullable: true })
  cancelledAt?: string;
  @Field({ nullable: true })
  confirmed?: string;
  @Field(() => CustomersType, { nullable: true })
  customer?: CustomersType;
  @Field({ nullable: true })
  price?: string;
  @Field({ nullable: true })
  displayFinancialStatus?: string;
  @Field({ nullable: true })
  shopifyCreateAt?: string;
  @Field({ nullable: true })
  name?: string;
}

@ObjectType()
export class SyncStatus {
  @Field({ nullable: true })
  status?: string;
}
