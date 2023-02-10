import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  DiscountCode,
  Member,
  Milestone,
  OBSettings,
} from 'src/groupshops/entities/groupshop.entity';
import { Customer } from 'src/inventory/dto/create-order.input';
import { Product } from 'src/inventory/entities/product.entity';
import { Store } from 'src/stores/entities/store.entity';

@ObjectType('DropCustomer')
export class DropCustomer {
  @Field({ nullable: true })
  klaviyoId: string;
  @Field({ nullable: true })
  fullName: string;
  @Field({ nullable: true })
  firstName: string;
  @Field({ nullable: true })
  lastName: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  phone: string;
}
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

  @Field(() => DiscountCode, { nullable: true })
  discountCode: DiscountCode;

  @Field(() => DropCustomer)
  customerDetail: DropCustomer;

  @Field(() => [Member], { nullable: 'itemsAndList' })
  members?: Member[];

  @Field()
  shortUrl?: string;

  @Field()
  expiredShortUrl?: string;

  @Field(() => [Milestone])
  milestones: Milestone[];

  @Field(() => [Product])
  bestSellerProducts?: Product[];

  @Field(() => [Product])
  runningOutProducts?: Product[];

  @Field(() => [Product])
  skincareProducts?: Product[];

  @Field(() => [Product])
  hairProducts?: Product[];

  @Field(() => [Product])
  spotlightProducts?: Product[];

  @Field(() => [Product])
  allProducts?: Product[];

  @Field(() => [Product])
  latestProducts?: Product[];

  @Field(() => OBSettings, { nullable: true })
  obSettings?: OBSettings;

  @Field(() => Store, { nullable: true })
  store?: Store;

  @Field({ nullable: true })
  expiredAt?: Date;

  @Field({ nullable: true, defaultValue: 0 })
  revisedCount?: number;

  @Field({ nullable: true, defaultValue: 0 })
  status?: string;

  @Field({ nullable: true })
  createdAt?: Date;
}
