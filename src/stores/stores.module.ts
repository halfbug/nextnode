import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresResolver } from './stores.resolver';
// import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Module({
  // imports: [DefaultColumnsService],
  providers: [StoresResolver, StoresService],
})
export class StoresModule {}
