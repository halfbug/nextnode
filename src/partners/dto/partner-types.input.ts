import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TotalPGS {
  @Field({ nullable: true })
  count?: number;
  @Field({ nullable: true })
  tierName?: number;
  @Field({ nullable: true })
  tierCharges?: number;
  @Field({ nullable: true })
  tierLimit?: string;
}
