import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Product from './entities/product.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), DefaultColumnsService],
  providers: [ProductsResolver, ProductsService],
})
export class ProductsModule {}
