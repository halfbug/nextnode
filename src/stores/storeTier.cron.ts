import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { PartnerService } from 'src/partners/partners.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from './stores.service';
import { usageDescriptonForPartnerBilling } from 'src/utils/functions';
import {
  GS_TIER0_START_COUNT,
  GS_TIER0_END_COUNT,
  GSP_FEES1,
  GS_TIER1_START_COUNT,
  GS_TIER1_END_COUNT,
  GS_TIER2_START_COUNT,
  GS_TIER2_END_COUNT,
  GS_TIER3_START_COUNT,
  GS_TIER3_END_COUNT,
  GS_TIER4_START_COUNT,
  GS_TIER4_END_COUNT,
  GS_TIER5_START_COUNT,
  GS_TIER5_END_COUNT,
  GS_TIER6_START_COUNT,
} from 'src/utils/constant';

@Injectable()
export class StoreUpdateTierCron {
  private readonly logger1 = new Logger(StoreUpdateTierCron.name);
  constructor(
    private readonly storesService: StoresService,
    private readonly lifecyclesrv: LifecycleService,
    private shopifyapi: ShopifyService,
    private configService: ConfigService,
    private partnerService: PartnerService,
  ) {}
  @Cron('30 0 23 * * *')
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async handleTierCron() {
    // console.log('im in cron');
    try {
      if (this.configService.get('BILLING_LIVE') === 'false')
        throw new NotAcceptableException(
          StoreUpdateTierCron.name,
          'Billing live is false',
        );
      this.logger1.log(
        'Called for daily cron for store tier check',
        StoreUpdateTierCron.name,
        true,
      );
      const stores = await this.storesService.findActiveAll();
      console.log(
        'file: storeTier.cron line 35 ~ stores',
        stores.map((item) => `${item.brandName} ${item.tier}`),
      );
      stores.map(async (store) => {
        if (
          ['Active', 'ACTIVE', 'active'].includes(store.status) &&
          ['Active', 'ACTIVE', 'active'].includes(store.subscription.status) &&
          store.planResetDate
        ) {
          const id = store.id;
          let payload;
          // here only after trial period run this if
          if (
            store.tierRecurringDate &&
            Date.now() >= store.tierRecurringDate.getTime()
          ) {
            // 1. check if recurring date is occured
            // 2. update store tierRecurringDate after recurringDate is hit
            // 3. charge the merchant
            console.log('im in curdate > = tierRecurringDate', store.brandName);
            const nextDate = new Date(
              new Date(
                store.tierRecurringDate.getTime() + 30 * 24 * 60 * 60 * 1000,
              ).setHours(23, 59, 59, 999),
            );
            // charge the merchant
            // calculate active gs then charge accordingly also update tier in store according to the count
            const { count } = await this.partnerService.getActivePartnersCount(
              id,
            );
            console.log(
              '🚀 ~ file: storeTier.cron.ts ~ line 63 ~ StoreUpdateTierCron ~ stores.map ~ activePGS',
              count,
            );
            let latestTier;
            switch (true) {
              case count >= GS_TIER0_START_COUNT && count <= GS_TIER0_END_COUNT:
                latestTier = GSP_FEES1[0];
                break;
              case count >= GS_TIER1_START_COUNT && count <= GS_TIER1_END_COUNT:
                latestTier = GSP_FEES1[1];
                break;
              case count >= GS_TIER2_START_COUNT && count <= GS_TIER2_END_COUNT:
                latestTier = GSP_FEES1[2];
                break;
              case count >= GS_TIER3_START_COUNT && count <= GS_TIER3_END_COUNT:
                latestTier = GSP_FEES1[3];
                break;
              case count >= GS_TIER4_START_COUNT && count <= GS_TIER4_END_COUNT:
                latestTier = GSP_FEES1[4];
                break;
              case count >= GS_TIER5_START_COUNT && count <= GS_TIER5_END_COUNT:
                latestTier = GSP_FEES1[5];
                break;
              case count >= GS_TIER6_START_COUNT:
                latestTier = GSP_FEES1[6];
                break;
              default:
                break;
            }
            console.log(latestTier);

            const chargedAmount = latestTier.fee;
            payload = {
              id: store.id,
              tierRecurringDate: nextDate,
              tier: latestTier.name,
            };
            if (latestTier.fee !== 0) {
              // 1. charge merchant for active gs tier
              const shopifyRes = await this.shopifyapi.appUsageRecordCreate(
                store.subscription?.['appSubscription']['lineItems'][0]['id'],
                chargedAmount,
                usageDescriptonForPartnerBilling(
                  store.tier,
                  chargedAmount.toFixed(2),
                ),
              );
            }
            // 2. update the recurr date in store for next 30 days
            const updatedStore = await this.storesService.update(id, payload);

            // 3. life cycle record
            this.lifecyclesrv.create({
              storeId: store.id,
              event: EventType.partnerRecurringCharged,
              tier: store.tier,
              dateTime: new Date(),
              charge: chargedAmount,
            });
          }
        }
      });
    } catch (err) {
      Logger.error(err, StoreUpdateTierCron.name);
    }
  }
}
