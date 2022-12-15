import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common/services';
import { OnEvent } from '@nestjs/event-emitter';
import { InventoryDoneEvent } from 'src/inventory/events/inventory-done.event';
import { StoresService } from 'src/stores/stores.service';
import { CampaignsService } from '../campaigns.service';
import { UpdateCampaignInput } from '../dto/update-campaign.input';

@Injectable()
export class InventorySavedCampaignsListener {
  constructor(
    private storeService: StoresService,
    private campaignService: CampaignsService,
  ) {}
  @OnEvent('inventory.done')
  async checkActiveCampaign(event: InventoryDoneEvent) {
    try {
      const store = await this.storeService.findOneWithActiveCampaing(
        event.shop,
      );
      if (store.activeCampaign.products.length < 1) {
        const updateCampaign = new UpdateCampaignInput();
        updateCampaign.criteria =
          store.activeCampaign.criteria === 'custom'
            ? 'bestseller'
            : store.activeCampaign.criteria;
        updateCampaign.storeId = store.activeCampaign.storeId;
        this.campaignService.update(store.activeCampaign.id, updateCampaign);
        Logger.log(
          `Empty Products updated to bestseller for the shop : ${event.shop}`,
          InventorySavedCampaignsListener.name,
          true,
        );
      }
    } catch (error) {
      Logger.error(error, InventorySavedCampaignsListener.name);
    }
  }
}
