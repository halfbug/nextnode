import { Injectable, Req, Res } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KalavioService } from 'src/email/kalavio.service';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';

@Injectable()
export class DropKlaviyoCron {
  constructor(
    private kalavioService: KalavioService,
    private dropsGroupshopService: DropsGroupshopService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES) // CronExpression.EVERY_10_MINUTES)
  async klaviyoGroupshopStatus() {
    const groupshops =
      await this.dropsGroupshopService.findExpiredDropGroupshhop();
    groupshops?.map(async (groupshop) => {
      const klaviyoId = groupshop.customerDetail.klaviyoId;
      const params = new URLSearchParams({
        groupshop_status: 'expired',
      });
      const data = params.toString();
      await this.kalavioService.klaviyoProfileUpdate(klaviyoId, data);
      groupshop.status = 'expired';
      await this.dropsGroupshopService.update(groupshop.id, groupshop);
    });
  }
}
