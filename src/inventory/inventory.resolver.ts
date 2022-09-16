import { Resolver, Query, Args, Info } from '@nestjs/graphql';
import { InventoryService } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { Collection } from './entities/collection.entity';
import { Product } from './entities/product.entity';
import { ProductQueryInput } from './dto/product-query.input';
import { TotalProducts } from './entities/totalProducts.entity';

@Resolver(() => Inventory)
export class InventoryResolver {
  constructor(private readonly inventoryService: InventoryService) {}

  @Query(() => TotalProducts, { name: 'TotalProducts' })
  findStoreTotalProducts(@Args('shop') shop: string) {
    return this.inventoryService.findTotalProducts(shop);
  }

  @Query(() => [Collection], { name: 'collections' })
  findStoreCollections(@Args('shop') shop: string, @Info() info: any) {
    const selectedFileds = info.fieldNodes[0].selectionSet.selections.map(
      (item) => item.name.value,
    );
    // console.log(
    //   '🚀 ~ file: inventory.resolver.ts ~ line 38 ~ InventoryResolver ~ findStoreCollections ~ selectedFileds',
    //   selectedFileds,
    // );
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

  @Query(() => Product, { name: 'productById' })
  findProductById(@Args('id') id: string) {
    console.log({ id });
    return this.inventoryService.findProductById(id);
  }

  @Query(() => Inventory, { name: 'inventory' })
  findOne(@Args('shop') shop: string, @Args('recordType') recordType: string) {
    return this.inventoryService.findOne(shop, recordType);
  }

  @Query(() => [Product], { name: 'findAllProducts' })
  async findAllProducts(@Args('shop') shop: string) {
    const res = await this.inventoryService.findAllProducts(shop);
    // console.log(
    //   '🚀 ~ file: inventory.resolver.ts ~ line 57 ~ InventoryResolver ~ res',
    //   res,
    // );
    return res;
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
