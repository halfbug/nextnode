import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifyStoreModule } from './shopify-store/shopify-store.module';
import Store from './stores/entities/store.model';
import { StoresModule } from './stores/stores.module';
import { UtilsModule } from './utils/utils.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InventoryModule } from './inventory/inventory.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AppsettingsModule } from './appsettings/appsettings.module';
import { BillingModule } from './billing/billing.module';
import Inventory from './inventory/entities/inventory.modal';
import Campaign from './campaigns/entities/campaign.model';
import Orders from './inventory/entities/orders.modal';
import { Retentiontool } from './retentiontools/entities/retention.modal';
import { Appsetting } from './appsettings/entities/appsetting.model';
import { GroupshopsModule } from './groupshops/groupshops.module';
import { Groupshops } from './groupshops/entities/groupshop.modal';
import Billing from './billing/entities/billing.model';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { PartnersModule } from './partners/partners.module';
import {
  Partnergroupshop,
  Partnermember,
} from './partners/entities/partner.modal';
import { GsCommonModule } from './gs-common/gs-common.module';
import { Lifecycle } from './gs-common/entities/lifecycle.modal';
import { Visitors } from './gs-common/entities/visitors.modal';
import { AuthModule } from './auth/auth.module';
import { RetentiontoolsModule } from './retentiontools/retentiontools.module';
import { VideoModule } from './videos/video.module';
import { Video } from './videos/entities/video.modal';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { ChannelModule } from './channel/channel.module';
import { AppLoggerModule } from './applogger/applogger.module';
import AdminUser from './admin-users/entities/admin-user.model';
import Channel from './channel/entities/channel.model';
import ChannelGroupshop from './channel/entities/channelgroupshop.model';
import { AppLogger } from './applogger/entities/applogger.entity';
import { DropsGroupshopModule } from './drops-groupshop/drops-groupshop.module';
import DropsGroupshop from './drops-groupshop/entities/dropsgroupshop.model';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: true,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 20,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (configservice: ConfigService) => {
        console.log(configservice.get('DB_URL'));
        console.log(configservice.get('STAGE'));

        return {
          type: 'mongodb',
          url: configservice.get('DB_URL'),
          synchronize: true,
          useUnifiedTopology: true,
          // entities: [__dirname + './**/*.modal.ts'],
          entities: [
            Store,
            Inventory,
            Campaign,
            Orders,
            Retentiontool,
            Partnergroupshop,
            Appsetting,
            Groupshops,
            Billing,
            Lifecycle,
            Visitors,
            Partnermember,
            Video,
            AdminUser,
            Channel,
            ChannelGroupshop,
            AppLogger,
            DropsGroupshop,
          ],
        };
      },
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    ScheduleModule.forRoot(),
    ShopifyStoreModule,
    StoresModule,
    UtilsModule,
    InventoryModule,
    CampaignsModule,
    AppsettingsModule,
    GroupshopsModule,
    BillingModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public/', //last slash was important
    }),
    EmailModule,
    PartnersModule,
    GsCommonModule,
    RetentiontoolsModule,
    VideoModule,
    AdminUsersModule,
    ChannelModule,
    AuthModule,
    AppLoggerModule,
    DropsGroupshopModule,
  ],
})
export class AppModule {}
