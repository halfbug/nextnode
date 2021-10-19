import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import Product from './products/entities/product.model';
import { ProductsModule } from './products/products.module';
import { ShopifyStoreModule } from './shopify-store/shopify-store.module';
import { StoreService } from './shopify-store/store/store.service';

@Module({
  imports: [
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
          entities: [Product],
        };
      },
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    ProductsModule,
    ShopifyStoreModule,
  ],
  // providers: [StoreService],
})
export class AppModule {}
