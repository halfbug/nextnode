import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  DiscountCode,
  Member,
  Milestone,
  OBSettings,
} from 'src/groupshops/entities/groupshop.entity';
import { Customer } from 'src/inventory/dto/create-order.input';

@ObjectType()
export class DropsGroupshop {
  @Field()
  id: string;

  @Field({ nullable: true })
  storeId: string;

  @Field({ nullable: true })
  url: string;

  @Field({ nullable: true })
  expiredUrl: string;

  @Field(() => Int, { defaultValue: 0 })
  totalProducts: number;

  @Field(() => DiscountCode)
  discountCode: DiscountCode;

  @Field()
  customerDetail: Customer;

  @Field(() => Member)
  members?: Member[];

  @Field()
  shortUrl?: string;

  @Field()
  expiredShortUrl?: string;

  @Field(() => [Milestone])
  milestones: Milestone[];

  @Field(() => OBSettings, { nullable: true })
  obSettings?: OBSettings;
}
