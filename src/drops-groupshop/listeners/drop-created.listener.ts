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
  DropCustomerInput,
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
  async addDrop(event: DropCreatedEvent | { webhook: any; shop: string }) {
    try {
      console.log('drop.created  ', JSON.stringify(event));
      const webdata = event.webhook;
      const shop = event.shop;
      const klaviyoId = webdata.id;
      const profilesExit = await this.dropsGroupshopService.findOneByKlaviyoId(
        klaviyoId,
      );
      if (typeof profilesExit?.id === 'undefined') {
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
        const ownerUrl = `/${shop.split('.')[0]}/drops/${this.crypt.encrypt(
          discountTitle,
        )}/owner&${this.crypt.encrypt(new Date().toDateString())}`;
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
        dgroupshop.obSettings = {
          step: 0,
          ownerUrl,
        };
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

        const dropCustomer = new DropCustomerInput();
        dropCustomer.klaviyoId = webdata.id;
        dropCustomer.firstName = webdata.first_name;
        dropCustomer.lastName = webdata.last_name;
        dropCustomer.email = webdata.email;
        dropCustomer.phone = webdata.phone_number;

        dgroupshop.customerDetail = dropCustomer;
        dgroupshop.status = 'pending';
        dgroupshop.expiredAt = null;
        await this.dropsGroupshopService.create(dgroupshop);
        let today = '';
        const d = new Date();
        const year = d.getFullYear();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        today = `${year}${'-'}${month}${'-'}${day}`;

        const obj = {
          groupshop_status: 'pending',
          sms_consent: true,
          groupshop_created_at: today,
          groupshop_url: shortLink,
          reactivate_groupshop: expiredShortLink,
        };
        const data = Object.keys(obj)
          .map((key) => {
            return `${key}=${encodeURIComponent(obj[key])}`;
          })
          .join('&');
        await this.kalavioService.klaviyoProfileUpdate(webdata.id, data);
      }
    } catch (err) {
      Logger.error(err, DropCreatedListener.name);
    }
  }
}
