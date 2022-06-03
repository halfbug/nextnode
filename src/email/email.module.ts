import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { InventoryModule } from 'src/inventory/inventory.module';
import { CatController } from './connect/connect.controller';
import { GroupshopCashbackListener } from './listeners/groupshop-cashback.listener';
import { GroupshopSavedListener } from './listeners/groupshop-saved.listener';
import { KalavioService } from './kalavio.service';
import { UploadImageService } from 'src/shopify-store/ImageUpload/uploadimage.service';

import { UploadImageModule } from 'src/shopify-store/ImageUpload/uploadimage.module';
import { KalavioResolver } from './kalavio.resolver';

@Module({
  imports: [HttpModule, InventoryModule, UploadImageModule],
  providers: [
    GroupshopSavedListener,
    GroupshopCashbackListener,
    KalavioService,
    KalavioResolver,
  ],
  exports: [KalavioService],
  controllers: [CatController],
})
export class EmailModule {}
