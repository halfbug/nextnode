import { ObjectType, Field, ID } from '@nestjs/graphql';
import { SalesTarget } from 'src/appsettings/entities/sales-target.entity';
import { CSettings } from 'src/stores/entities/settings.entity';
import { Details } from './details.entity';
import { SocialLinks } from './social-links.entity';

@ObjectType('Campaign')
export class Campaign {
  @Field(() => ID)
  id: string;

  @Field({ defaultValue: 'Active', nullable: true })
  status: string;

  // @Field({ defaultValue: 0 })
  // createdAt: string;

  @Field({ nullable: true })
  storeId: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  criteria: string;

  @Field({ nullable: true, defaultValue: false })
  joinExisting: boolean;

  @Field(() => SalesTarget, { nullable: true })
  salesTarget: SalesTarget;

  @Field({ nullable: true })
  collectionId: string;

  // @Field(() => Inventory)
  // products?: Inventory[];

  @Field(() => [String], { nullable: true })
  products?: string[];

  @Field(() => [String], { nullable: true })
  collections?: string[];

  @Field(() => [String], { nullable: true })
  addableProducts?: string[];

  @Field({ nullable: true })
  rewards?: string;

  @Field()
  isActive?: boolean;

  @Field({ nullable: true })
  settings?: CSettings;

  @Field({ nullable: true })
  socialLinks?: SocialLinks;

  @Field({ nullable: true })
  expiredAt?: Date;

  @Field({ nullable: true })
  details?: Details;
}

@ObjectType()
export class Metrics {
  @Field({ nullable: true })
  cashBack?: number;

  @Field({ nullable: true })
  feeCharges?: number;

  @Field({ nullable: true })
  revenue?: number;

  @Field({ nullable: true })
  uniqueVisitors?: string;

  @Field({ nullable: true })
  totalOrders?: string;
}
