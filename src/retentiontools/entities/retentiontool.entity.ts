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

  @Field()
  createdAt: Date;

  @Field()
  updatedAt?: Date;
}

@ObjectType()
export class SyncStatus {
  @Field({ nullable: true })
  status?: string;
}
