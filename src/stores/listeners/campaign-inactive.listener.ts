import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CampaignInactiveEvent } from 'src/billing/events/campaign-inactive.event';
// import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { StoresService } from '../stores.service';

@Injectable()
export class CampaignInActiveListener {
  constructor(private storeService: StoresService) {}

  @OnEvent('campaign.inactive')
  async updateStoreStatus(event: CampaignInactiveEvent) {
    const { id, isActive, storeId } = event;
    const allCampaign =
      await this.storeService.findOneWithActiveCampaignByStoreId(storeId);
    console.log('active-campaigns=', allCampaign.activeCampaign.length);
    if (allCampaign.activeCampaign.length <= 0) {
      this.storeService.update(storeId, { id: storeId, status: 'InActive' });
    }
  }
  @OnEvent('campaign.active')
  async updateStoreToActive(event: CampaignInactiveEvent) {
    const { id, isActive, storeId } = event;
    const allCampaign =
      await this.storeService.findOneWithActiveCampaignByStoreId(storeId);
    console.log('active-campaigns=', allCampaign.activeCampaign.length);
    if (allCampaign.activeCampaign.length > 0) {
      this.storeService.update(storeId, { id: storeId, status: 'Active' });
    }
  }
}
