import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DropsGroupshopService } from './drops-groupshop.service';
import { DropsGroupshop } from './entities/drops-groupshop.entity';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { Public } from 'src/auth/public.decorator';
import { NotFoundException, UseInterceptors } from '@nestjs/common';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { ViewedInterceptor } from 'src/gs-common/viewed.inceptor';

@Resolver(() => DropsGroupshop)
export class DropsGroupshopResolver {
  constructor(
    private readonly dropsGroupshopService: DropsGroupshopService,
    private readonly crypt: EncryptDecryptService,
  ) {}

  @Public()
  @Mutation(() => DropsGroupshop)
  createDropsGroupshop(
    @Args('createDropsGroupshopInput')
    createDropsGroupshopInput: CreateDropsGroupshopInput,
  ) {
    return this.dropsGroupshopService.create(createDropsGroupshopInput);
  }

  @Query(() => [DropsGroupshop], { name: 'dropsGroupshop' })
  findAll() {
    return this.dropsGroupshopService.findAll();
  }

  @Query(() => DropsGroupshop, { name: 'dropsGroupshop' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.dropsGroupshopService.findOne(id);
  }

  @Public()
  // @UseInterceptors(ViewedInterceptor)
  @Query(() => DropsGroupshop, { name: 'DropGroupshop' })
  async findDropsGroupshopByCode(@Args('code') code: string) {
    const gs = await this.dropsGroupshopService.findDropGroupshopByCode(
      // code,
      await this.crypt.decrypt(code),
    );
    if (gs) {
      return gs;
    } else {
      throw new NotFoundException(`Not Found drops groupshop`);
    }
  }

  @Public()
  @Mutation(() => DropsGroupshop)
  updateDropsGroupshop(
    @Args('updateDropsGroupshopInput')
    updateDropsGroupshopInput: UpdateDropsGroupshopInput,
  ) {
    return this.dropsGroupshopService.update(
      updateDropsGroupshopInput.id,
      updateDropsGroupshopInput,
    );
  }

  @Mutation(() => DropsGroupshop)
  removeDropsGroupshop(@Args('id', { type: () => Int }) id: number) {
    return this.dropsGroupshopService.remove(id);
  }
}
