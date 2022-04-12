import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BillingsService } from './billing.service';
import { Billing } from './entities/billing.entity';
import { CreateBillingInput } from './dto/create-billing.input';
import { UpdateBillingInput } from './dto/update-billing.input';
import {
  MonthlyBillingInput,
  Total,
  TotalRevenue,
} from './dto/monthly-billing.input';

@Resolver(() => Billing)
export class BillingsResolver {
  constructor(private readonly billingService: BillingsService) {}

  @Mutation(() => Billing)
  createBillings(
    @Args('createBillingsInput') createBillingsInput: CreateBillingInput,
  ) {
    console.log(
      '🚀 ~ file: billing.resolver.ts ~ line 15 ~ BillingssResolver ~ createBillingsInput',
      createBillingsInput,
    );
    return this.billingService.create(createBillingsInput);
  }

  @Query(() => [Billing], { name: 'billings' })
  findAll() {
    return this.billingService.findAll();
  }

  @Query(() => Billing, { name: 'billing' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.billingService.findOne(id);
  }

  @Query(() => [MonthlyBillingInput], { name: 'getMonthlyGSBilling' })
  getMonthlyGSBilling(@Args('storeId') storeId: string) {
    return this.billingService.findMonthlyBilling(storeId);
  }

  @Query(() => TotalRevenue, { name: 'findTotalRevenue' })
  findTotalRevenue(@Args('storeId') storeId: string) {
    return this.billingService.findTotalRevenue(storeId);
  }

  @Query(() => [Total], { name: 'findTotalGSMonthly' })
  findTotalGSMonthly(@Args('storeId') storeId: string) {
    return this.billingService.findTotalGSMonthly(storeId);
  }

  @Mutation(() => Billing)
  updateBillings(
    @Args('updateBillingsInput') updateBillingsInput: UpdateBillingInput,
  ) {
    return this.billingService.update(
      updateBillingsInput.id,
      updateBillingsInput,
    );
  }

  @Mutation(() => Billing)
  removeBillings(@Args('id', { type: () => Int }) id: string) {
    return this.billingService.remove(id);
  }
}