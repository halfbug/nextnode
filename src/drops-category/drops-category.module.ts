import { Module } from '@nestjs/common';
import { DropsCategoryService } from './drops-category.service';
import { DropsCategoryResolver } from './drops-category.resolver';
import DropsCategory from './entities/drops-category.model';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([DropsCategory])],
  providers: [DropsCategoryResolver, DropsCategoryService],
  exports: [DropsCategoryResolver, DropsCategoryService],
})
export class DropsCategoryModule {}
