import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Campaign from './entities/campaign.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { InventoryModule } from 'src/inventory/inventory.module';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign]),
    DefaultColumnsService,
    InventoryModule,
    StoresModule,
  ],
  providers: [CampaignsResolver, CampaignsService],
})
export class CampaignsModule {}
