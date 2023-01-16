import { InputType, Field, ObjectType } from '@nestjs/graphql';
import {
  DiscountCodeInput,
  MemberInput,
  MilestoneInput,
  OBSettingsInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { Customer } from 'src/inventory/dto/create-order.input';

@InputType()
export class DropCustomer {
  @Field({ nullable: true })
  klaviyoId: string;
  @Field({ nullable: true })
  firstName: string;
  @Field({ nullable: true })
  lastName: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  phone: string;
}

@InputType()
export class CreateDropsGroupshopInput {
  @Field({ nullable: true })
  storeId?: string;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field({ nullable: true })
  expiredUrl?: string;

  @Field({ nullable: true })
  expiredShortUrl?: string;

  @Field(() => DiscountCodeInput, { nullable: true })
  discountCode?: DiscountCodeInput;

  @Field(() => DropCustomer)
  customerDetail: DropCustomer;

  @Field(() => [MemberInput], { nullable: true })
  members?: MemberInput[];

  @Field(() => MilestoneInput, { nullable: true })
  milestones: MilestoneInput[];

  @Field(() => OBSettingsInput, { nullable: true })
  obSettings?: OBSettingsInput;
}
