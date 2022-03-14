import { InputType, Field } from '@nestjs/graphql';
import { BillingTypeEnum } from '../entities/billing.entity';

@InputType()
export class CreateBillingInput {
  @Field(() => BillingTypeEnum, { nullable: true })
  type: BillingTypeEnum;

  @Field()
  amount: string;

  @Field()
  totalCashBack: string;

  @Field()
  storeId: string;
}
