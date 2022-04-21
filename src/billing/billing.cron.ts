import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StoresService } from 'src/stores/stores.service';
import { BillingsService } from './billing.service';

@Injectable()
export class BillingUsageCargeCron {
  private readonly logger = new Logger(BillingUsageCargeCron.name);
  constructor(
    private readonly billingService: BillingsService,
    private readonly storesService: StoresService,
  ) {}
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleBillingCron() {
    // this.logger.error('Called every 30 seconds');
    this.logger.debug(`Started At : ${new Date()}`);
    const stores = await this.storesService.findActiveAll();
    // console.log(
    //   '🚀 ~ file: billing.cron.ts ~ line 18 ~ BillingUsageCargeCron ~ handleCron ~ stores',
    //   stores,
    // );
    stores.map(async (store) => {
      const edate = new Date();
      const d = new Date();
      const sdate = new Date(d.setDate(d.getDate() - 1));
      const useageQuery = await this.billingService.getBillingByDate(
        store.id,
        sdate,
        edate,
      );
      console.log(
        '🚀 ~ file: billing.cron.ts ~ line 30 ~ BillingUsageCargeCron ~ stores.map ~ useageQuery',
        useageQuery,
      );
    });
    //
    // Logger.debug('cron srunning', BillingUsageCargeCron.name);
  }
}
