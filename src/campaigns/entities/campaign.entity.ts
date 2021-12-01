import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Inventory } from 'src/inventory/entities/inventory.entity';

@ObjectType('Campaign')
export class Campaign {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  status: string;

  @Field({ defaultValue: 0 })
  createdAt: string;

  @Field({ nullable: true })
  storeId: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  criteria: string;

  @Field({ nullable: true, defaultValue: false })
  joinExisting: boolean;

  @Field({ nullable: true })
  salesTargetId: string;

  @Field({ nullable: true })
  collectionId: string;

  // @Field(() => Inventory)
  // products?: Inventory[];

  @Field(() => [String], { nullable: true })
  products?: string[];

  @Field({ nullable: true })
  rewards?: string;
}
