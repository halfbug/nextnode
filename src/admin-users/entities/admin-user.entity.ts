import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('AdminUser')
export class AdminUser {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => [String])
  roles: string[];

  @Field({ defaultValue: 'Active', nullable: true })
  status: string;

  @Field({ nullable: true })
  userRole: string;

  @Field({ defaultValue: new Date() })
  createdAt: Date;

  @Field({ defaultValue: new Date() })
  updatedAt?: Date;
}
