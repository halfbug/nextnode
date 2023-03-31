import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DropsCategoryService } from './drops-category.service';
import { DropsCategory } from './entities/drops-category.entity';
import {
  CreateDropsCategoryForFront,
  CreateDropsCategoryInput,
} from './dto/create-drops-category.input';

@Resolver(() => DropsCategory)
export class DropsCategoryResolver {
  constructor(private readonly dropsCategoryService: DropsCategoryService) {}

  @Mutation(() => DropsCategory)
  createDropsCategory(
    @Args('createDropsCategoryInput')
    createDropsCategoryInput: CreateDropsCategoryInput,
  ) {
    return this.dropsCategoryService.create(createDropsCategoryInput);
  }

  @Query(() => [DropsCategory], { name: 'dropsCategory' })
  findAll() {
    return this.dropsCategoryService.findAll();
  }

  @Query(() => DropsCategory, { name: 'dropsCategory' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.dropsCategoryService.findOne(id);
  }

  @Query(() => [DropsCategory])
  findByStoreId(@Args('storeId', { type: () => String }) storeId: string) {
    return this.dropsCategoryService.findByStoreId(storeId);
  }

  @Mutation(() => [DropsCategory])
  updateDropsCategory(
    @Args('CreateDropsCategoryForFront')
    updateDropsCategoryInput: CreateDropsCategoryForFront,
  ) {
    return this.dropsCategoryService.update(
      updateDropsCategoryInput.id,
      updateDropsCategoryInput.categoryData,
    );
  }

  @Mutation(() => DropsCategory)
  removeDropsCategory(@Args('id', { type: () => [String] }) id: [string]) {
    return this.dropsCategoryService.remove(id);
  }
}
