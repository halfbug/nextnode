import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateRetentiontoolInput {
  constructor(createdAt?: Date, updatedAt?: Date) {
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  @Field()
  storeId: string;

  @Field()
  shop: string;

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
