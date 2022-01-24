import { InputType, ID, Field } from '@nestjs/graphql';
import { SalesTargetType } from 'src/appsettings/dto/create-appsetting.input';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { SettingsInput } from 'src/stores/dto/create-store.input';
import { ProductInputType } from './product.input';

@InputType()
export class SocialLinksInput {
  @Field({ nullable: true })
  instagram?: string;

  @Field({ nullable: true })
  pinterest?: string;

  @Field({ nullable: true })
  tiktok?: string;

  @Field({ nullable: true })
  twitter?: string;

  @Field({ nullable: true })
  facebook?: string;
}

@InputType()
export class CreateCampaignInput {
  // @Field(() => ID)
  // id: string;

  @Field({ nullable: true })
  status: string;

  @Field({ defaultValue: 0 })
  createdAt: string;

  @Field({ nullable: true })
  criteria: string;

  @Field({ nullable: true })
  storeId: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  joinExisting: boolean;

  @Field({ nullable: true })
  collectionId: string;

  // @Field(() => ProductInputType, { nullable: true })
  // products?: ProductInputType[];

  @Field(() => [String], { nullable: true })
  products?: string[];

  @Field({ nullable: true })
  rewards?: string;

  @Field((type) => SalesTargetType, { nullable: true })
  salesTarget?: SalesTargetType;

  @Field((type) => SettingsInput, { nullable: true })
  settings?: SettingsInput;

  @Field((type) => SocialLinksInput, { nullable: true })
  socialLinks?: SocialLinksInput;

  @Field()
  isActive?: boolean;
}
