import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from '../shopify/shopify.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { oldThemeFoundEvent } from '../events/old-theme-found.event';
import { AddResourceEvent } from 'src/stores/events/add-resource.event';

@Injectable()
export class oldThemeFoundListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configService: ConfigService,
    private addResourceEvent: AddResourceEvent,
  ) {}
  async addResource(resource: string) {
    const scriptTag = await this.shopifyapi.scriptTagRegister(resource);
    if (scriptTag) {
      this.addResourceEvent.id = scriptTag.id;
      this.addResourceEvent.type = 'scriptTage';
      this.addResourceEvent.detail = JSON.stringify(scriptTag);
      this.addResourceEvent.emit();
    }
  }
  @OnEvent('old.theme.found')
  async registerScriptTag(event: oldThemeFoundEvent) {
    const { shop, accessToken } = event;
    console.log(
      '🚀 ~ file: old-theme-found.listener.ts ~ line 18 ~ InvenotrySavedListener ~ registerScriptTag ~ event',
      event,
    );
    const client = await this.shopifyapi.client(shop, accessToken);
    const scriptTagDel = await client.query({
      data: {
        query: `mutation scriptTagDelete($id: ID!) {
          scriptTagDelete(id: $id) {
            deletedScriptTagId
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          input: {
            id: 'gid://shopify/ScriptTag/190660116646',
          },
        },
      },
    });
    console.log(
      '🚀 ~ file: old-theme-found.listener.ts ~ line 42 ~ oldThemeFoundListener ~ registerScriptTag ~ scriptTagDel',
      scriptTagDel,
    );
    // const scriptTag = await client.query({
    //   data: {
    //     query: `mutation scriptTagCreate($input: ScriptTagInput!) {
    //         scriptTagCreate(input: $input) {
    //           scriptTag {
    //             cache
    //             createdAt
    //             displayScope
    //             id
    //             src
    //           }
    //           userErrors {
    //             field
    //             message
    //           }
    //         }
    //       }`,
    //     variables: {
    //       input: {
    //         cache: false,
    //         displayScope: 'ONLINE_STORE',
    //         src: `${this.configService.get('HOST')}/public/gropshop-pdp.js`,
    //       },
    //     },
    //   },
    // });
    // console.log('-------------Register scriptTag');
    // console.log(JSON.stringify(scriptTag));
    this.shopifyapi.accessToken = accessToken;
    this.shopifyapi.shop = shop;
    // this.addResource('gsbootstrap.css');
    this.addResource('gsbootstrap.js');
    this.addResource('groupshop-pdp.js');
  }
}
