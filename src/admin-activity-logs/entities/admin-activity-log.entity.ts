import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AdminActivityLog {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
