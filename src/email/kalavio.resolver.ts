import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { CreateSignUpInput } from './dto/create-signup.input';
import { SignUp } from './entities/kalavio.entity';
import { KalavioService } from './kalavio.service';

@Resolver(SignUp)
export class KalavioResolver {
  constructor(private readonly kalavioService: KalavioService) {}

  @Mutation(() => SignUp)
  createSignUp(
    @Args('createSignUpInput') createSignUpInput: CreateSignUpInput,
  ) {
    console.log(
      '🚀 ~ file: kalavio.resolver.ts ~ line 15 ~ KalavioResolver ~ createSignUpInput',
      createSignUpInput,
    );
    return this.kalavioService.klaviyoSignUp(createSignUpInput);
  }
}
