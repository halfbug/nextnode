import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingPlanEnum } from './entities/store.entity';
import { StoresService } from './stores.service';

@Injectable()
export class StoreUpdatePlanCron {
  private readonly logger = new Logger(StoreUpdatePlanCron.name);
  constructor(private readonly storesService: StoresService) {}

  // @Cron('0 59 23 * * *')
  // @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('Called for daily cron for store plan check');
    const stores = await this.storesService.findActiveAll();
    console.log(
      'file: store.cron line 15 ~ stores',
      stores.map((item) => `${item.brandName} ${item.plan}`),
    );
    stores.map(async (store) => {
      if (
        store.subscription &&
        store.subscription.status === 'Active' &&
        store.planResetDate
      ) {
        console.log(`now=${Date.now()} planreset=${store.planResetDate}`);

        const id = store.id;
        let payload;
        // here only after trial period run this if
        if (Date.now() >= store.planResetDate.getTime()) {
          // update store plan to launch after trial end. update planResetDate to next 30 days date
          console.log('im in curdate > = planresetdate', store.brandName);
          const nextDate = new Date(
            new Date(
              store.planResetDate.getTime() + 30 * 24 * 60 * 60 * 1000,
            ).setHours(23, 59, 59, 999),
          );
          payload = {
            id: store.id,
            plan: BillingPlanEnum.LAUNCH,
            planResetDate: nextDate,
          };
          const updatedStore = await this.storesService.update(id, payload);
        }
        // else if (Date.now() >= store.planResetDate.getTime()) {
        //   console.log('im in plan reset');

        //   const nextDate = new Date(
        //     new Date(
        //       store.planResetDate.getTime() + 30 * 24 * 60 * 60 * 1000,
        //     ).setHours(23, 59, 59, 999),
        //   );
        //   payload = {
        //     id: store.id,
        //     plan: BillingPlanEnum.LAUNCH,
        //     planResetDate: nextDate,
        //   };
        // }
        // else {
        //   payload = {
        //     id: store.id,
        //     plan: store.plan,
        //   };
        // }
        // const updatedStore = await this.storesService.update(id, payload);
        console.log(
          'file: store.cron line 58 ~ stores',
          stores.map((item) => `${item.brandName} ${item.plan}`),
        );
        //  1 planResetDate done
        //  2 update planResetDate when first time appTrialEnd is updated done
        //if current trialend date comes update to laucnh done
        // if current trial update planResetDate = trial+30 done
        // cron cur = planResetDate update plan to launch
        // on every GS create , take range of planResetDate and - 30days count GS and sqitch plan acc to count
      }
    });
  }
}
