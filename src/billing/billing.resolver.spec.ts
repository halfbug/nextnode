import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BillingsService } from './billing.service';
import { Billing } from './entities/billing.entity';
import { CreateBillingInput } from './dto/create-billing.input';
import { UpdateBillingInput } from './dto/update-billing.input';

@Resolver(() => Billing)
export class BillingResolver {
  constructor(private readonly billingsService: BillingsService) {}

  @Mutation(() => Billing)
  createBilling(
    @Args('createBillingInput') createBillingInput: CreateBillingInput,
  ) {
    console.log(
      '🚀 ~ file: billings.resolver.ts ~ line 15 ~ BillingResolver ~ createBillingInput',
      createBillingInput,
    );
    return this.billingsService.create(createBillingInput);
  }

  @Query(() => [Billing], { name: 'billings' })
  findAll() {
    return this.billingsService.findAll();
  }

  @Query(() => Billing, { name: 'billing' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.billingsService.findOne(id);
  }

  @Mutation(() => Billing)
  updateBilling(
    @Args('updateBillingInput') updateBillingInput: UpdateBillingInput,
  ) {
    return this.billingsService.update(
      updateBillingInput.id,
      updateBillingInput,
    );
  }

  @Mutation(() => Billing)
  removeBilling(@Args('id', { type: () => Int }) id: string) {
    return this.billingsService.remove(id);
  }
}
