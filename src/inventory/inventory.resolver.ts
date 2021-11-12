import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Info,
  Field,
} from '@nestjs/graphql';
import { InventoryService } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryInput } from './dto/create-inventory.input';
import { UpdateInventoryInput } from './dto/update-inventory.input';
import { Collection } from './entities/collection.entity';
import { Product } from './entities/product.entity';
import { ProductQueryInput } from './dto/product-query.input';

@Resolver(() => Inventory)
export class InventoryResolver {
  constructor(private readonly inventoryService: InventoryService) {}

  // @Mutation(() => Inventory)
  // createInventory(
  //   @Args('createInventoryInput') createInventoryInput: CreateInventoryInput,
  // ) {
  //   return this.inventoryService.create(createInventoryInput);
  // }

  // @Query(() => [Inventory], { name: 'inventory' })
  // find() {
  //   return this.inventoryService.findAll();
  // }

  @Query(() => [Collection], { name: 'collections' })
  findStoreCollections(@Args('shop') shop: string, @Info() info: any) {
    const selectedFileds = info.fieldNodes[0].selectionSet.selections.map(
      (item) => item.name.value,
    );
    console.log(
      '🚀 ~ file: inventory.resolver.ts ~ line 38 ~ InventoryResolver ~ findStoreCollections ~ selectedFileds',
      selectedFileds,
    );
    const withproducts = selectedFileds.includes('products');
    const collections = this.inventoryService.findStoreCollections(
      shop,
      withproducts,
    );
    return collections;
  }

  @Query(() => [Product], { name: 'products' })
  findStoreProducts(
    @Args('productQueryInput') productQueryInput: ProductQueryInput,
  ) {
    return this.inventoryService.findStoreProducts(productQueryInput);
  }

  @Query(() => Inventory, { name: 'inventory' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.inventoryService.findOne(id);
  }

  // @Mutation(() => Inventory)
  // updateInventory(
  //   @Args('updateInventoryInput') updateInventoryInput: UpdateInventoryInput,
  // ) {
  //   return this.inventoryService.update(
  //     updateInventoryInput.id,
  //     updateInventoryInput,
  //   );
  // }

  // @Mutation(() => Inventory)
  // removeInventory(@Args('id', { type: () => Int }) id: number) {
  //   return this.inventoryService.remove(id);
  // }
}
