import { Controller, forwardRef, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { map } from 'rxjs/operators';
import { InventoryService } from 'src/inventory/inventory.service';
import { GroupshopSavedEvent } from 'src/groupshops/events/groupshop-saved.event';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as getSymbolFromCurrency from 'currency-symbol-map';

@Controller('connect')
export class CatController {
  [x: string]: any;
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private httpService: HttpService,
    private inventoryService: InventoryService,
  ) {}
  @Get('/')
  async test() {
    const groupshopSavedEvent = new GroupshopSavedEvent();
    groupshopSavedEvent.data = 'newGroupshop';
    this.eventEmitter.emit('groupshop.saved', groupshopSavedEvent);
    return 'running server on port 5000';
  }

  @Get('klaviyo-email')
  async klaviyoemailURL() {
    const PUBLIC_KEY = this.configService.get('KLAVIYO_PUBLIC_KEY');
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');
    const url = `https://a.klaviyo.com/api/track`;

    const currencySymbol = getSymbolFromCurrency('USD');
    console.log('currencySymbol : ' + currencySymbol);

    const singleProduct =
      await this.inventoryService.getCollectionNameByProductId(
        'native-roots-dev.myshopify.com',
        'gid://shopify/Product/7291069497510',
      );
    console.log(singleProduct[0].title);

    // //return this.configService.get('KLAVIYO_PUBLIC_KEY');
  }
}
