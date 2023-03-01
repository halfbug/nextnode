import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { UpdateStoreInput } from 'src/stores/dto/update-store.input';
import { CodeUpdateStatusTypeEnum } from 'src/stores/entities/store.entity';
import { StoresService } from 'src/stores/stores.service';
import { DropsCollectionUpdatedEvent } from '../events/drops-collection-update.event';

@Injectable()
export class DropsCollectionUpdatedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
  ) {}

  @OnEvent('dropsCollection.updated')
  async updateDropsDiscountCodes({
    dropsGroupshops,
    shop,
    accessToken,
    collections,
    storeId,
    drops,
  }: DropsCollectionUpdatedEvent) {
    try {
      for (const dg of dropsGroupshops) {
        await this.shopifyapi.setDiscountCode(
          shop,
          'Update',
          accessToken,
          dg.discountCode.title,
          null,
          [...new Set(collections.map((c) => c.shopifyId))],
          null,
          null,
          dg.discountCode.priceRuleId,
          true,
        );
      }

      const updateStoreInput = new UpdateStoreInput();
      updateStoreInput.drops = {
        ...drops,
        lastSync: new Date(),
        codeUpdateStatus: CodeUpdateStatusTypeEnum.completed,
      };

      await this.storesService.updateStore(storeId, updateStoreInput);
    } catch (err) {
      console.log(err, DropsCollectionUpdatedListener.name);
      Logger.error(err, DropsCollectionUpdatedListener.name);
    }
  }
}
