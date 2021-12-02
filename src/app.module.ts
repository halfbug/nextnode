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
import Inventory from './inventory/entities/inventory.modal';
import Campaign from './campaigns/entities/campaign.model';
import Orders from './inventory/entities/orders.modal';
import { Appsetting } from './appsettings/entities/appsetting.model';

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
          entities: [Store, Inventory, Campaign, Orders, Appsetting],
        };
      },
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    ShopifyStoreModule,
    StoresModule,
    UtilsModule,
    InventoryModule,
    CampaignsModule,
    AppsettingsModule,
  ],
})
export class AppModule {}
