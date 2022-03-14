import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { GroupshopsService } from './groupshops.service';
import { GroupShop as Groupshop } from './entities/groupshop.entity';
import { CreateGroupshopInput } from './dto/create-groupshops.input';
import { UpdateGroupshopInput } from './dto/update-groupshops.input';
import {
  createParamDecorator,
  ExecutionContext,
  Ip,
  Req,
} from '@nestjs/common';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';

export const ReqDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().req,
);

@Resolver(() => Groupshop)
export class GroupshopsResolver {
  constructor(
    private readonly GroupshopsService: GroupshopsService,
    private readonly crypt: EncryptDecryptService,
  ) {}

  @Mutation(() => Groupshop)
  createGroupshop(
    @Args('createGroupshopInput') createGroupshopInput: CreateGroupshopInput,
  ) {
    // console.log(
    //   '🚀 ~ file: groupshops.resolver.ts ~ line 15 ~ GroupshopsResolver ~ createGroupshopInput',
    //   createGroupshopInput,
    // );

    return this.GroupshopsService.create(createGroupshopInput);
  }

  @Query(() => [Groupshop], { name: 'groupshops' })
  findAll() {
    return this.GroupshopsService.findAll();
  }

  @Query(() => Groupshop, { name: 'getQrDealLink' })
  findQrDealLink(
    @Args('email') email: string,
    @Args('ordernumber') ordernumber: string,
  ) {
    return this.GroupshopsService.findfindQrDealLinkAll(email, ordernumber);
  }

  @Query(() => Groupshop, { name: 'groupshop' })
  async findOne(@Args('code') code: string) {
    return await this.GroupshopsService.findOne(await this.crypt.decrypt(code));
  }

  @Mutation(() => Groupshop, { name: 'addDealProduct' })
  addDealProduct(
    @Args('updateGroupshopInput') updateGroupshopInput: UpdateGroupshopInput,
  ) {
    return this.GroupshopsService.update(updateGroupshopInput);
  }

  // @Mutation(() => Groupshop)
  // removeGroupshop(@Args('id', { type: () => Int }) id: number) {
  //   return this.GroupshopsService.remove(id);
  // }
}
