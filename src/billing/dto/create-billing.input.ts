import { InputType, Field } from '@nestjs/graphql';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';
import { BillingTypeEnum } from '../entities/billing.entity';

@InputType()
export class CreateBillingInput {
  @Field(() => BillingTypeEnum, { nullable: true })
  type: BillingTypeEnum;

  @Field()
  feeCharges: number;

  @Field({ nullable: true })
  cashBack?: number;

  @Field({ nullable: true })
  plan?: BillingPlanEnum;

  @Field()
  groupShopId: string;

  @Field()
  storeId: string;

  @Field()
  revenue?: number;

  @Field({ defaultValue: false })
  isPaid?: boolean;
}
