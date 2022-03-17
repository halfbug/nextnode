import Store from 'src/stores/entities/store.model';
import { Groupshops } from '../entities/groupshop.modal';

export class GroupShopCreated {
  groupshop: Groupshops;
  store: Store;
  // take storeId and update the store totalgroupshop+1
}
