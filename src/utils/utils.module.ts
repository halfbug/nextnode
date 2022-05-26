import { Global, Module } from '@nestjs/common';
import { AnyScalar } from './any.scalarType';
import { DefaultColumnsService } from './default-columns/default-columns.service';
import { EncryptDecryptService } from './encrypt-decrypt/encrypt-decrypt.service';

@Global()
@Module({
  providers: [DefaultColumnsService, EncryptDecryptService],
  exports: [DefaultColumnsService, EncryptDecryptService],
})
export class UtilsModule {}
