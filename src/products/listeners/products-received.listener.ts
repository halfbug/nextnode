import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductsReceivedEvent } from '../../shopify-store/events/products-received.event';
import { HttpService } from '@nestjs/axios';
import readJsonLines from 'read-json-lines-sync';
import { ProductsService } from '../products.service';


@Injectable()
export class ProductsReceivedListener {
  constructor(
    private httpService: HttpService,
    private productsService: ProductsService,
  ) {}

  handleFile(err, data) {
    if (err) throw err;
    const obj = JSON.parse(data);
    // You can now play with your datas
    console.log(obj);
  }

  @OnEvent('products.received')
  async storeProductsReceived(event: ProductsReceivedEvent) {
    console.log(event);
    // const productBulkFile = createReadStream(event.bulkOperationResponse.url);
    this.httpService.get(event.bulkOperationResponse.url).subscribe((res) => {
      const result = readJsonLines(res.data);
      // console.log(result);
      this.productsService.insertMany(result);
    });

    // readFile(
    //   this.httpService.get(event.bulkOperationResponse.url),
    //   this.handleFile,
    // );
  }
}
