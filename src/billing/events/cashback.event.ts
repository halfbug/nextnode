import { Groupshops } from 'src/groupshops/entities/groupshop.modal';
import Store from 'src/stores/entities/store.model';

export class CashBackEvent {
  groupshop: Groupshops;
  cashbackAmount: number;
  cashbackCharge: number;
  store: Store;
  revenue: number;
}
