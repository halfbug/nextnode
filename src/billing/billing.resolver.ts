import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BillingsService } from './billing.service';
import { Billing } from './entities/billing.entity';
import { CreateBillingInput } from './dto/create-billing.input';
import { UpdateBillingInput } from './dto/update-billing.input';
import {
  MonthlyBillingInput,
  MonthlyBillingInput2,
  SingleDayBillingInput,
  Total,
  TotalGS,
  TotalRevenue,
  GraphRevenue,
} from './dto/monthly-billing.input';
import { AppSubscription } from './entities/app-subscription.input';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { DateFormats, Days, monthsArr } from 'src/utils/functions';
import { Metrics } from 'src/campaigns/entities/campaign.entity';
import { ConfigService } from '@nestjs/config';
import { UpdateStoreInput } from 'src/stores/dto/update-store.input';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { AuthDecorator } from 'src/auth/auth.decorator';
import { AuthEntity } from 'src/auth/entities/auth.entity';

@Resolver(() => Billing)
export class BillingsResolver {
  constructor(
    private readonly billingService: BillingsService,
    private readonly lifecycleService: LifecycleService,
    private shopifyapi: ShopifyService,
    private readonly storeService: StoresService,
    private configService: ConfigService,
  ) {}

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

  @Query(() => [MonthlyBillingInput], { name: 'campaignMetric' })
  async campaignMetric(
    @Args('storeId') storeId: string,
    @Args('campaignId') campaignId: string,
  ) {
    const result = await this.billingService.campaignMetric(
      storeId,
      campaignId,
    );
    return result;
  }

  @Query(() => [Metrics], { name: 'overviewMetrics' })
  async overviewMetrics(
    @Args('storeId') storeId: string,
    @Args('startFrom') startFrom: string,
    @Args('toDate') toDate: string,
  ) {
    const result = await this.billingService.overviewMetrics(
      storeId,
      startFrom,
      toDate,
    );
    return result;
  }

  @Query(() => [Total], { name: 'findTotalGSMonthly' })
  findTotalGSMonthly(@Args('storeId') storeId: string) {
    return this.billingService.findTotalGSMonthly(storeId);
  }

  @Query(() => TotalGS, { name: 'findTotalGS' })
  findTotalGS(@Args('storeId') storeId: string) {
    return this.billingService.findTotalGS(storeId);
  }

  @Query(() => [SingleDayBillingInput], { name: 'getBillingByDate' })
  async getBillingByDate(
    @Args('storeId') storeId: string,
    @Args('month') month: string,
    @Args('year') year: string,
  ) {
    const { sdate, edate } = DateFormats(month, year);

    // new Date('Fri, 01 Apr 2022 19:00:00 GMT)
    // new Date('Mon, 30 Apr 2022 23:59:00 GMT')
    const result = await this.billingService.getBillingByDate(
      storeId,
      sdate,
      edate,
    );
    // console.log('🚀 getBillingByDate result', result);
    return result;
  }
  @Query(() => [SingleDayBillingInput], { name: 'getCustomBillingByDate' })
  async getCustomBillingByDate(
    @Args('storeId') storeId: string,
    @Args('sdate') sdate: string,
    // @Args('edate') edate: Date,
  ) {
    const edate = new Date(sdate); // Now
    edate.setDate(edate.getDate() + 30);
    const result = await this.billingService.getBillingByDate(
      storeId,
      new Date(sdate),
      edate,
    );
    // console.log('🚀 getCustomBillingByDate sdate', result);
    return result;
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

  @Mutation(() => AppSubscription, { name: 'billingSubscription' })
  async getBillingSubs(
    // @Args('shop') shop: string,
    // @Args('accessToken') accessToken: string,
    @AuthDecorator('currentSession') currentSession: AuthEntity,
  ) {
    const { shop, accessToken } = currentSession;
    this.shopifyapi.shop = shop;
    this.shopifyapi.accessToken = accessToken;
    const store: UpdateStoreInput = await this.storeService.findOne(shop);
    const trialDays =
      store && store?.subscription?.status === 'Zero Trial'
        ? 0
        : parseInt(this.configService.get('TRIAL_PERIOD'));
    const subscription = await this.shopifyapi.AppSubscriptionCreate(trialDays);
    const endOfTrialDate = new Date(
      new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).setHours(
        23,
        59,
        59,
        999,
      ),
    );

    this.storeService.updateField(
      { shop },
      {
        subscription: { status: 'PENDING', ...subscription },
        appTrialEnd: endOfTrialDate,
        planResetDate: endOfTrialDate,
      },
    );

    return { redirectUrl: subscription['confirmationUrl'] };
  }
  @Query(() => [MonthlyBillingInput2], { name: 'getCustomBilling' })
  async getCustomBilling(@Args('storeId') storeId: string) {
    return this.lifecycleService.getCustomBilling(storeId);
  }

  @Query(() => Total, { name: 'getStoreMonthsCount' })
  getStoreMonthsCount(@Args('storeId') storeId: string) {
    return this.billingService.getStoreMonthsCount(storeId);
  }

  @Query(() => [MonthlyBillingInput], { name: 'getGraphRevenue' })
  getGraphRevenue(@Args('storeId') storeId: string) {
    return this.billingService.findGraphRevenue(storeId);
  }

  @Query(() => [GraphRevenue], { name: 'getGraphRevenueByDate' })
  getGraphRevenueByDate(
    @Args('storeId') storeId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ) {
    return this.billingService.findGraphRevenueByDate(
      storeId,
      startDate,
      endDate,
    );
  }
}
