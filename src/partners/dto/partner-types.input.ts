import { ObjectType, Field } from '@nestjs/graphql';
import { BillingTierEnum } from 'src/stores/entities/store.entity';

@ObjectType()
export class TotalPGS {
  @Field({ nullable: true })
  count?: number;
  @Field({ nullable: true })
  tierName?: number;
  @Field({ nullable: true })
  tierCharges?: number;
  @Field({ nullable: true })
  tierLimit?: string;
  @Field({ nullable: true })
  currentTierName?: number;
  @Field({ nullable: true })
  currentTierCharges?: number;
  @Field({ nullable: true })
  currentTierLimit?: string;
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
