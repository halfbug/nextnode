import { ObjectType, Field, ID } from '@nestjs/graphql';
import { SalesTarget } from 'src/appsettings/entities/sales-target.entity';
import { Settings } from 'src/stores/entities/settings.entity';
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

  @Field({ nullable: true })
  rewards?: string;

  @Field({ defaultValue: true })
  isActive?: boolean;

  @Field({ nullable: true })
  settings?: Settings;

  @Field({ nullable: true })
  socialLinks?: SocialLinks;
}
