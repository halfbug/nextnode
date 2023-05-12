import { Cron, CronExpression } from '@nestjs/schedule';
import { log } from 'console';
import { StoresService } from 'src/stores/stores.service';
import { InventoryService } from './inventory.service';
import { Injectable, Logger } from '@nestjs/common';
import { CollectionUpdateEnum } from 'src/stores/entities/store.entity';

@Injectable()
export class SyncCollectionCron {
  constructor(
    private storeService: StoresService,
    private inventryService: InventoryService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async syncCollections() {
    log('Cron running');
    try {
      const stores = await this.storeService.findAll();
      for (const store of stores) {
        if (!store.collectionsToUpdate?.length) {
          Logger.log(
            `No collections to update in store ${store.shop}`,
            'SYNC_COLLECTION_CRON',
            true,
          );
          continue;
        } else {
          Logger.log(
            `Sync Collection CRON Started (${store.collectionsToUpdate?.length} needs to update in store ${store.shop})`,
            'SYNC_COLLECTION_CRON',
            true,
          );

          this.storeService.updateStore(store.id, {
            collectionUpdateStatus: CollectionUpdateEnum.PROGRESS,
            id: store.id,
          });
          await this.inventryService.runSyncCollectionCron(store);
        }
      }
    } catch (error) {
      console.error(
        'Error performing bulk collection query:',
        JSON.stringify(error),
        error,
      );
    }
  }
}
