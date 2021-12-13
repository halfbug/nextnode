import Orders from 'src/inventory/entities/orders.modal';
import Store from 'src/stores/entities/store.model';

export class OrderPlacedEvent {
  order: Orders;
  store: Store;
  lineItems: any[];
}
