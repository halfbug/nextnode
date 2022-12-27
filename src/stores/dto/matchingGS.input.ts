import { Field, ObjectType, PartialType } from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import {
  DealProducts,
  GroupShop,
  Member,
} from 'src/groupshops/entities/groupshop.entity';
import { Product } from 'src/inventory/entities/product.entity';
import { Store } from '../entities/store.entity';

@ObjectType()
export class MatchingGS extends PartialType(Store) {
  @Field({ nullable: true })
  groupshops?: GroupShop;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  popularProducts?: Product[];

  @Field({ nullable: true })
  campaign?: Campaign;

  @Field(() => [DealProducts], { nullable: 'itemsAndList' })
  dealProducts?: DealProducts[];

  @Field(() => [Product], { nullable: 'itemsAndList' })
  bestSeller?: Product[];

  @Field(() => [Member], { nullable: 'itemsAndList' })
  members?: Member[];
}
