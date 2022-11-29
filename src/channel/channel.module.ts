import { forwardRef, Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelResolver } from './channel.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import Channel from './entities/channel.model';
import { ChannelGroupshopService } from './channelgroupshop.service';
import ChannelGroupshop from './entities/channelgroupshop.model';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { StoresModule } from 'src/stores/stores.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, ChannelGroupshop]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    forwardRef(() => StoresModule),
    forwardRef(() => EmailModule),
  ],
  providers: [ChannelResolver, ChannelService, ChannelGroupshopService],
  exports: [ChannelService, ChannelGroupshopService],
})
export class ChannelModule {}
