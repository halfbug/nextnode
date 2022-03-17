import { InputType, Field } from '@nestjs/graphql';
import { BillingTypeEnum } from '../entities/billing.entity';

@InputType()
export class CreateBillingInput {
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
