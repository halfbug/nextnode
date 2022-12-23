import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductOutofstockEvent } from 'src/inventory/events/product-outofstock.event';
import { StoresService } from 'src/stores/stores.service';
import { CampaignsService } from '../campaigns.service';
import { UpdateCampaignInput } from '../dto/update-campaign.input';

@Injectable()
export class ProductOutofstockListner {
  constructor(
    private campaignService: CampaignsService,
    private storesService: StoresService,
  ) {}
  @OnEvent('is-outofstock')
  async checkCampaignProductStock(event: ProductOutofstockEvent) {
    try {
      const temp = await this.storesService.findOneWithActiveCampaing(
        event.shop,
      );
      const campaign = await this.campaignService.findOneWithProducts(
        temp.activeCampaign.id,
      );
      const productArray = campaign.products.filter(
        (ele) => ele.outofstock === false,
      );
      if (!productArray.length) {
        const updateCampaign = new UpdateCampaignInput();
        updateCampaign.criteria = 'allproducts';
        updateCampaign.storeId = temp.activeCampaign.storeId;
        this.campaignService.update(temp.activeCampaign.id, updateCampaign);
      }
    } catch (err) {
      console.log(
        'ERROR WHILE CHECKING CAMPAIGN PRODUCT (STOCK)',
        JSON.stringify(err),
      );
      Logger.error(err, 'campaign-criteria-update');
    }
  }
}
