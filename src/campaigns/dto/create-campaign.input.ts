import { InputType, ID, Field } from '@nestjs/graphql';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { ProductInputType } from './product.input';

@InputType()
export class CreateCampaignInput {
  // @Field(() => ID)
  // id: string;

  @Field({ nullable: true })
  status: string;

  @Field({ defaultValue: 0 })
  createdAt: string;

  @Field({ nullable: true })
  productSelectionCriteria: string;

  @Field({ nullable: true })
  storeId: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  joinExisting: boolean;

  @Field({ nullable: true })
  salesTargetId: string;

  @Field({ nullable: true })
  collectionId: string;

  // @Field(() => ProductInputType, { nullable: true })
  // products?: ProductInputType[];

  @Field(() => [String], { nullable: true })
  products?: string[];
}
