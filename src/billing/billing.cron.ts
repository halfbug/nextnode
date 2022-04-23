import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
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
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async handleBillingCron() {
    // this.logger.error('Called every 30 seconds');
    this.logger.debug(`Started At : ${new Date()}`);
    const stores = await this.storesService.findActiveAll();

    stores.map(async (store) => {
      if (store.subscription && store.plan > 0) {
        Logger.debug(JSON.stringify(store.subscription));
        const edate = new Date();
        const d = new Date();
        const sdate = new Date(d.setDate(d.getDate() - 1));
        const useageQuery = await this.billingService.getBillingByDate(
          store.id,
          sdate,
          edate,
        );

        Logger.warn(store.shop, 'BillingUsageCargeCron');
        console.log(
          '🚀 ~ file: billing.cron.ts ~ line 30 ~ BillingUsageCargeCron ~ stores.map ~ useageQuery',
          useageQuery,
        );
        this.shopifyapi.shop = store.shop;
        this.shopifyapi.accessToken = store.accessToken;
        const { body: shopifyRes } = await this.shopifyapi.appUsageRecordCreate(
          store.subscription?.['appSubscription']['lineItems'][0]['id'],
          useageQuery['amountFeeCharge'],
          'groupshop free charge',
        );
        if (shopifyRes['appUsageRecordCreate']['appUsageRecord']) {
          const billingUpdateRec = useageQuery['badgeIds'].map((billingId) => {
            return {
              updateOne: {
                filter: { id: billingId },
                update: { $set: { isPaid: true } },
              },
            };
          });

          this.billingService.bulkUpdate(billingUpdateRec);
        }
      }
    });
    //
    // Logger.debug('cron srunning', BillingUsageCargeCron.name);
  }
}
