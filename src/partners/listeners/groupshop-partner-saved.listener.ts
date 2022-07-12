import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GSPCreatedEvent } from '../events/create-partner-groupshop.event';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { ConfigService } from '@nestjs/config';
import { KalavioService } from 'src/email/kalavio.service';
import { UpdatePartnersInput } from '../dto/update-partners.input';
import { PartnerService } from '../partners.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class GSPSavedListener {
  constructor(
    private eventEmitter: EventEmitter2,
    private crypt: EncryptDecryptService,
    private configSevice: ConfigService,
    private kalavioService: KalavioService,
    private partnerService: PartnerService,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
  ) {}
  static formatTitle(name: string) {
    return `GSP${name}`;
  }

  @OnEvent('groupshop-partner.saved')
  async setPriceRule(event: GSPCreatedEvent) {
    const _id = event.groupshop._id;
    const id = event.groupshop.id;
    const baselineDiscount = event.groupshop.partnerRewards.baseline;
    const shop = event.shop;
    const accessToken = event.accessToken;

    const title = GSPSavedListener.formatTitle(_id);

    const cryptURL = `/${shop.split('.')[0]}/partner-deal/${this.crypt.encrypt(
      title,
    )}`;
    const fulllink = `${this.configSevice.get('FRONT')}${cryptURL}`;
    const shortLink = await this.kalavioService.generateShortLink(fulllink);

    let ugsp = null;
    ugsp = new UpdatePartnersInput();
    ugsp.url = cryptURL;
    ugsp.shortUrl = shortLink;
    ugsp.shortUrl = shortLink;
    // bought product + campaign products will go to setDiscount below
    // also add in db
    const campaign = await this.storesService.findOneWithActiveCampaing(shop);
    const {
      activeCampaign: { products },
    } = campaign;
    console.log(
      '🚀 ~ file: groupshop-partner-saved.listener.ts ~ products',
      products,
    );
    ugsp.discountCode = await this.shopifyapi.setDiscountCode(
      shop,
      'Create',
      accessToken,
      title,
      parseInt(baselineDiscount),
      products,
      new Date(),
      null,
    );

    await this.partnerService.update(id, ugsp);
  }
}
