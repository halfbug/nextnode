import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { PartnerRewards } from 'src/partners/entities/partner.entity';
import { SalesTarget } from './sales-target.entity';

@ObjectType()
export class Appsetting {
  @Field(() => ID)
  id: string;

  @Field((type) => [SalesTarget], { nullable: true })
  salestargets?: SalesTarget[];

  @Field(() => PartnerRewards, { nullable: true })
  details?: PartnerRewards;
}
