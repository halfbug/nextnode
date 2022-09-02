import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { RetentiontoolsService } from './retentiontools.service';
import { Retentiontool, SyncStatus } from './entities/retentiontool.entity';
import { CreateRetentiontoolInput } from './dto/create-retentiontool.input';
import { StoresService } from 'src/stores/stores.service';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => Retentiontool)
export class RetentiontoolsResolver {
  constructor(
    private readonly retentiontoolsService: RetentiontoolsService,
    private storesService: StoresService,
  ) {}

  @Mutation(() => SyncStatus || undefined)
  async createRetentiontool(
    @Args('createRetentiontoolInput')
    createRetentiontoolInput: CreateRetentiontoolInput,
  ) {
    return this.retentiontoolsService.create(createRetentiontoolInput);
  }

  @Query(() => [Retentiontool], { name: 'retentiontools' })
  async findAll(@Args('storeId') storeId: string) {
    // console.log('🚀 ~ file: Partners.resolver.ts ~ findAll ');
    return await this.retentiontoolsService.findAll(storeId);
  }

  @Query(() => SyncStatus, { name: 'syncStoreCustomers' })
  async syncStoreCustomers(@Args('storeId') storeId: string) {
    const data = await this.retentiontoolsService.syncStoreCustomers(storeId);
    return data;
  }
}
