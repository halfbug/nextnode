import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductsReceivedEvent } from '../../shopify-store/events/products-received.event';
import { HttpService } from '@nestjs/axios';
import readJsonLines from 'read-json-lines-sync';
import { InventoryService } from '../inventory.service';

@Injectable()
export class InventoryReceivedListener {
  constructor(
    private httpService: HttpService,
    private inventoryService: InventoryService,
  ) {}

  private handleFile(err, data) {
    if (err) throw err;
    const obj = JSON.parse(data);
    // You can now play with your datas
    console.log(obj);
  }

  private reshapeInventory(inventoryArray, shop) {
    return inventoryArray.map((inventory) => {
      //
      // if (typeof inventory.featuredImage === 'object')
      inventory.featuredImage = inventory?.featuredImage?.src;

      //rename inventory __parentId
      if (inventory.__parentId) {
        inventory.parentId = inventory.__parentId;
        delete inventory.__parentId;
      }
      // add shop to inventory
      inventory.shop = shop;

      // add record type
      inventory.recordType = inventory.id.split('/')[3];

      return inventory;
    });
  }

  @OnEvent('inventory.received')
  async storeInventoryReceived(event: ProductsReceivedEvent) {
    console.log('inventory Received ----->>>> ', event.shop);
    console.log(event);
    // const productBulkFile = createReadStream(event.bulkOperationResponse.url);
    this.httpService
      .get(event.bulkOperationResponse.url)
      .subscribe(async (res) => {
        const inventoryObj = this.reshapeInventory(
          readJsonLines(res.data),
          event.shop,
        );
        // console.log(inventoryObj);
        // const savedInventory =
        await this.inventoryService.insertMany(inventoryObj);
        console.log('saved inventory for ', event.shop);
      });

    // readFile(
    //   this.httpService.get(event.bulkOperationResponse.url),
    //   this.handleFile,
    // );
  }
}
