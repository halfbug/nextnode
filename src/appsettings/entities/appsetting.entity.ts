import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { SalesTarget } from './sales-target.entity';

@ObjectType()
export class Appsetting {
  @Field(() => ID)
  id: string;

  @Field((type) => [SalesTarget], { nullable: true })
  salestargets?: SalesTarget[];
}
