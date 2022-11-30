import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { BillingTierEnum } from 'src/stores/entities/store.entity';

@ObjectType()
export class TotalPGS {
  @Field({ nullable: true })
  count?: number;
  @Field({ nullable: true })
  tierName?: BillingTierEnum;
  @Field({ nullable: true })
  tierCharges?: number;
  @Field({ nullable: true })
  tierLimit?: string;
  @Field({ nullable: true })
  currentTierName?: BillingTierEnum;
  @Field({ nullable: true })
  currentTierCharges?: number;
  @Field({ nullable: true })
  currentTierLimit?: string;
  @Field(() => [Number])
  switchCount?: [number];
  @Field(() => [InfoType], { nullable: true })
  allTiersInfo?: InfoType[];
}
@ObjectType()
export class StorePayloadType {
  @Field({ nullable: true })
  id?: string;
  @Field({ nullable: true })
  tier?: BillingTierEnum;
  @Field({ nullable: true })
  tierRecurringDate?: Date;
}
@ObjectType()
export class InfoType {
  @Field({ nullable: true })
  index?: number;
  @Field({ nullable: true })
  name?: BillingTierEnum;
  @Field({ nullable: true })
  staticName?: string;
  @Field({ nullable: true })
  fee?: number;
  @Field({ nullable: true })
  limit?: string;
  @Field({ nullable: true })
  switchStartCount?: number;
}
