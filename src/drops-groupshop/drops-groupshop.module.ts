import { Module } from '@nestjs/common';
import { DropsGroupshopService } from './drops-groupshop.service';
import { DropsGroupshopResolver } from './drops-groupshop.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Module({
  imports: [TypeOrmModule.forFeature([DropsGroupshop]), DefaultColumnsService],
  providers: [DropsGroupshopResolver, DropsGroupshopService],
  exports: [DropsGroupshopService],
})
export class DropsGroupshopModule {}
