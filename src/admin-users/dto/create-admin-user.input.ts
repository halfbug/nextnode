import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateAdminUserInput {
  @Field({ defaultValue: new Date() })
  createdAt: Date;

  @Field({ nullable: true })
  username: string;

  @Field({ nullable: true })
  password: string;

  @Field(() => [String], { nullable: true })
  roles: [string];

  @Field({ defaultValue: 'Active', nullable: true })
  status: string;
}
