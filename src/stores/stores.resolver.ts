import { Resolver, Query, Mutation, Args, Int, Info } from '@nestjs/graphql';
import { StoresService } from './stores.service';
import { Store } from './entities/store.entity';
import { CreateStoreInput } from './dto/create-store.input';
import { UpdateStoreInput } from './dto/update-store.input';

@Resolver(() => Store)
export class StoresResolver {
  constructor(private readonly storesService: StoresService) {}

  @Mutation(() => Store)
  createStore(@Args('createStoreInput') createStoreInput: CreateStoreInput) {
    return this.storesService.create(createStoreInput);
  }

  @Query(() => [Store], { name: 'stores' })
  findAll() {
    return this.storesService.findAll();
  }

  @Query(() => [Store], { name: 'activeStores' })
  findActive() {
    return this.storesService.findActiveAll();
  }

  @Query(() => Store, { name: 'storeName' })
  async findOne(@Args('shop') shop: string, @Info() info: any) {
    const selectedFileds = info.fieldNodes[0].selectionSet.selections.map(
      (item) => item.name.value,
    );
    const withCampaigns = selectedFileds.includes('campaigns');
    const res = await this.storesService.findOneWithCampaings(shop);
    // console.log(
    //   '🚀 ~ file: stores.resolver.ts ~ line 28 ~ StoresResolver ~ findOne ~ res',
    //   res,
    // );
    if (withCampaigns) return res;
    else return this.storesService.findOneByName(shop);
  }

  @Query(() => Store, { name: 'store' })
  findOneById(@Args('id') id: string) {
    return this.storesService.findOneById(id);
  }

  @Mutation(() => Store)
  updateStore(@Args('updateStoreInput') updateStoreInput: UpdateStoreInput) {
    return this.storesService.update(updateStoreInput.id, updateStoreInput);
  }

  @Mutation(() => Store)
  removeStore(@Args('id', { type: () => String }) id: string) {
    return this.storesService.remove(id);
  }

  @Mutation(() => Store)
  updateDiscoveryTools(
    @Args('UpdateDiscoveryTools') UpdateDiscoveryTools: UpdateStoreInput,
  ) {
    return this.storesService.updateDiscoveryTool(
      UpdateDiscoveryTools.id,
      UpdateDiscoveryTools,
    );
  }
}
