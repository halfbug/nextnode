import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('AdminUser')
export class AdminUser {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  username: string;

  // @Field({ nullable: true })
  // password: string;

  @Field(() => [String])
  roles: string[];

  @Field({ defaultValue: 'Active', nullable: true })
  status: string;
}
