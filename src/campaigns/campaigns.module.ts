import { forwardRef, Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Campaign from './entities/campaign.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { InventoryModule } from 'src/inventory/inventory.module';
import { StoresModule } from 'src/stores/stores.module';
import { GroupshopsModule } from 'src/groupshops/groupshops.module';
import { PartnersModule } from 'src/partners/partners.module';
import { InventorySavedCampaignsListener } from './listeners/inventory-saved-campaigns.listener';
import { ProductOutofstockListner } from './listeners/product-outofstock.listner';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    DefaultColumnsService,
    InventoryModule,
    forwardRef(() => StoresModule),
    forwardRef(() => GroupshopsModule),
    PartnersModule,
  ],
  providers: [
    CampaignsResolver,
    CampaignsService,
    InventorySavedCampaignsListener,
    ProductOutofstockListner,
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}
