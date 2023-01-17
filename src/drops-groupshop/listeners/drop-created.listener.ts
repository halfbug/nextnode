import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { KalavioService } from 'src/email/kalavio.service';
import {
  CreateDropsGroupshopInput,
  DropCustomer,
} from 'src/drops-groupshop/dto/create-drops-groupshop.input';
import { InventoryService } from 'src/inventory/inventory.service';
import { DropCreatedEvent } from '../events/drop-created.event';
import { Product } from 'src/inventory/entities/product.entity';

@Injectable()
export class DropCreatedListener {
  constructor(
    private shopifyService: ShopifyService,
    private eventEmitter: EventEmitter2,
    private configSevice: ConfigService,
    private crypt: EncryptDecryptService,
    private dropsGroupshopService: DropsGroupshopService,
    private kalavioService: KalavioService,
    private storesService: StoresService,
    private inventryService: InventoryService,
  ) {}

  @OnEvent('drop.created')
  async addOrder(event: DropCreatedEvent) {
    try {
      console.log('drop.created  ', JSON.stringify(event));
      const webdata = event.webhook;
      const shop = event.shop;
      const {
        id,
        accessToken,
        drops: {
          rewards: { baseline },
          bestSellerCollectionId,
          latestCollectionId,
          allProductsCollectionId,
        },
      } = await this.storesService.findOne(shop);

      const dropsProducts =
        await this.inventryService.getProductsByCollectionIDs(shop, [
          bestSellerCollectionId,
          latestCollectionId,
          allProductsCollectionId,
        ]);

      const discountTitle = `GSD${Date.now()}`;
      const cryptURL = `/${shop.split('.')[0]}/drops/${this.crypt.encrypt(
        discountTitle,
      )}`;
      const expiredFulllink = `${this.configSevice.get(
        'FRONT',
      )}${cryptURL}/status&activated`;
      const fulllink = `${this.configSevice.get('FRONT')}${cryptURL}`;
      const shortLink = await this.kalavioService.generateShortLink(fulllink);
      const expiredShortLink = await this.kalavioService.generateShortLink(
        expiredFulllink,
      );
      const dgroupshop = new CreateDropsGroupshopInput();
      dgroupshop.storeId = id;
      dgroupshop.url = cryptURL;
      dgroupshop.shortUrl = shortLink;
      dgroupshop.expiredUrl = expiredFulllink;
      dgroupshop.expiredShortUrl = expiredShortLink;

      const discountCode = await this.shopifyService.setDiscountCode(
        shop,
        'Create',
        accessToken,
        discountTitle,
        parseInt(baseline, 10),
        dropsProducts?.length > 100
          ? dropsProducts.slice(0, 100).map((p: Product) => p.id)
          : dropsProducts?.map((p: Product) => p.id) ?? [],
        new Date(),
        null,
      );
      dgroupshop.discountCode = discountCode;

      const dropCustomer = new DropCustomer();
      dropCustomer.klaviyoId = webdata.id;
      dropCustomer.firstName = webdata.first_name;
      dropCustomer.lastName = webdata.last_name;
      dropCustomer.email = webdata.email;
      dropCustomer.phone = webdata.phone_number;

      dgroupshop.customerDetail = dropCustomer;
      dgroupshop.status = 'pending';
      dgroupshop.expiredAt = null;
      await this.dropsGroupshopService.create(dgroupshop);
      const params = new URLSearchParams({
        groupshop_status: 'pending',
        groupshop_url: shortLink,
        reactivate_groupshop: expiredShortLink,
      });
      const data = params.toString();
      await this.kalavioService.klaviyoProfileUpdate(webdata.id, data);
    } catch (err) {
      Logger.error(err, DropCreatedListener.name);
    }
  }
}
