import {
  ObjectType,
  Field,
  registerEnumType,
  ID,
  Int,
  Float,
} from '@nestjs/graphql';

@ObjectType()
export class SignUp {
  @Field({ nullable: true })
  email: string;
}
