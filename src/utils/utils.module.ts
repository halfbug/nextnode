import { Global, Module } from '@nestjs/common';
import { AnyScalar } from './any.scalarType';
import { DefaultColumnsService } from './default-columns/default-columns.service';
import { EncryptDecryptService } from './encrypt-decrypt/encrypt-decrypt.service';
import { PaginationService } from './pagination.service';

@Global()
@Module({
  providers: [DefaultColumnsService, EncryptDecryptService, PaginationService],
  exports: [DefaultColumnsService, EncryptDecryptService, PaginationService],
})
export class UtilsModule {}
