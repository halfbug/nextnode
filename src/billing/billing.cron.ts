import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';
import { StoresService } from 'src/stores/stores.service';
import { BillingsService } from './billing.service';

@Injectable()
export class BillingUsageCargeCron {
  private readonly logger = new Logger(BillingUsageCargeCron.name);
  constructor(
    private readonly billingService: BillingsService,
    private readonly storesService: StoresService,
    private shopifyapi: ShopifyService,
  ) {}

  usageDescripton(plan: BillingPlanEnum, cashback, gscharge, totalCharge) {
    switch (plan) {
      case BillingPlanEnum.EXPLORE:
        return `Explore (free for 30 days) + Cashback charge - $${cashback}`;

      case BillingPlanEnum.LAUNCH:
        return `Launch (${totalCharge}) >> Groupshop charge - ${gscharge} + Cashback charge - $${cashback}`;

      case BillingPlanEnum.GROWTH:
        return `Growth (${totalCharge}) >> Groupshop charge - ${gscharge} + Cashback charge - $${cashback}`;

      case BillingPlanEnum.ENTERPRISE:
        return `Unicorn  (${totalCharge}) >> Groupshop charge - ${gscharge} + Cashback charge - $${cashback}`;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM) // EVERY_DAY_AT_11AM)
  async handleBillingCron() {
    // this.logger.error('Called every 30 seconds');
    this.logger.debug(`Started At : ${new Date()}`);
    const stores = await this.storesService.findActiveAll();

    stores.map(async (store) => {
      if (store.subscription) {
        const allstoresBilling = await this.billingService.getAllStoreBilling();
        const useageQuery = allstoresBilling.find(
          (storeBilling) => storeBilling.store === store.id,
        );

        Logger.warn(store.shop, 'BillingUsageCargeCron');
        console.log(
          '🚀 ~ file: billing.cron.ts ~ line 30 ~ BillingUsageCargeCron ~ stores.map ~ useageQuery',
          useageQuery,
        );
        if (useageQuery) {
          // let cashbackUsage = '30';
          let cashbackUsage = useageQuery['totalfeeByCashback'];
          if (store.currencyCode !== 'USD' && cashbackUsage > 0) {
            cashbackUsage = await this.billingService.currencyConversion(
              store.currencyCode,
              parseFloat(cashbackUsage),
            );
          }
          const totalCharge =
            parseFloat(cashbackUsage) + parseFloat(useageQuery['totalfeeByGS']);
          Logger.debug(useageQuery['totalfeeByCashback'], 'totalfeeByCashback');

          Logger.debug(useageQuery['totalfeeByGS'], 'totalfeeByGS');
          Logger.debug(totalCharge, 'total charge');

          const usageCharge =
            Date.now() < store.appTrialEnd.getTime()
              ? parseFloat(cashbackUsage)
              : totalCharge;

          if (usageCharge > 0) {
            this.shopifyapi.shop = store.shop;
            this.shopifyapi.accessToken = store.accessToken;
            const { body: shopifyRes } =
              await this.shopifyapi.appUsageRecordCreate(
                store.subscription?.['appSubscription']['lineItems'][0]['id'],
                usageCharge,
                this.usageDescripton(
                  store.plan,
                  cashbackUsage,
                  useageQuery['totalfeeByGS'],
                  totalCharge,
                ),
              );

            if (shopifyRes['appUsageRecordCreate']['appUsageRecord']) {
              const billingUpdateRec = useageQuery['badgeIds'].map(
                (billingId: string) => {
                  return {
                    updateOne: {
                      filter: { id: billingId },
                      update: { $set: { isPaid: true } },
                    },
                  };
                },
              );

              this.billingService.bulkUpdate(billingUpdateRec);
            }
          }
        }
      }
    });
    //
    // Logger.debug('cron srunning', BillingUsageCargeCron.name);
  }
}
