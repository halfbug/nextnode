import { Module, forwardRef } from '@nestjs/common';
import { DropsCategoryService } from './drops-category.service';
import { DropsCategoryResolver } from './drops-category.resolver';
import DropsCategory from './entities/drops-category.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresModule } from 'src/stores/stores.module';
import { DropsGroupshopModule } from 'src/drops-groupshop/drops-groupshop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DropsCategory]),
    forwardRef(() => StoresModule),
    forwardRef(() => DropsGroupshopModule),
  ],
  providers: [DropsCategoryResolver, DropsCategoryService],
  exports: [DropsCategoryResolver, DropsCategoryService],
})
export class DropsCategoryModule {}
