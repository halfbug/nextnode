import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Campaign from './entities/campaign.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign]), DefaultColumnsService],
  providers: [CampaignsResolver, CampaignsService],
})
export class CampaignsModule {}
