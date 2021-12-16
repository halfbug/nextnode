import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateInventoryInput } from './dto/create-inventory.input';
import { ProductQueryInput } from './dto/product-query.input';
import { UpdateInventoryInput } from './dto/update-inventory.input';
import Inventory from './entities/inventory.modal';

@Injectable()
export class InventoryService {
  private inventoryManager: any;
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>, // private inventoryManager: EntityManager,
  ) {
    this.inventoryManager = getMongoManager();
    // this.inventoryManager = getMongoManager();
  }

  create(createInventoryInput: CreateInventoryInput): Promise<Inventory> {
    const inventory = this.inventoryRepository.create(createInventoryInput);
    console.log(
      '🚀 ~ file: inventory.service.ts ~ line 21 ~ InventoryService ~ create ~ inventory',
      inventory,
    );

    return this.inventoryRepository.save(inventory);
  }

  async update(updateInvenotryInput: UpdateInventoryInput) {
    const { id } = updateInvenotryInput;
    return await this.inventoryRepository.update({ id }, updateInvenotryInput);
  }

  async updateInventory(id: string, dif: number) {
    const manager = getMongoManager();

    try {
      return await manager.findOneAndUpdate(
        Inventory,
        { id },
        { $inc: { totalInventory: dif } },
      );
    } catch (err) {
      console.log(err);
    }
  }

  async remove(id: string) {
    return await this.inventoryManager.deleteMany(Inventory, {
      $or: [{ id: { $regex: id } }, { parentId: { $regex: id } }],
    });
  }

  async removeShop(shop: string) {
    return await this.inventoryRepository.delete({ shop });
  }

  async findTotalProducts(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          $and: [
            {
              shop,
            },
            {
              recordType: 'Product',
            },
            {
              status: 'ACTIVE',
            },
          ],
        },
      },
      {
        $count: 'count',
      },
    ];
    const tp = await this.inventoryManager.aggregate(Inventory, agg).toArray();
    console.log(
      '🚀 ~ file: inventory.service.ts ~ line 55 ~ InventoryService ~ findTotalProducts ~ tp',
      tp,
    );
    return tp[0];
  }

  async findOne(shop: string, recordType: string) {
    return await this.inventoryRepository.findOne({
      where: {
        shop,
        recordType,
      },
    });
  }

  async findId(id: string): Promise<Inventory> {
    return await this.inventoryRepository.findOne({
      where: {
        id,
      },
    });
  }
  async findStoreCollections(shop: string, withproducts: boolean) {
    const manager = getMongoManager();

    // const collections = await manager.distinct(Inventory, 'title', {
    //   shop,
    //   recordType: 'Collection',
    // });
    const query = withproducts
      ? [
          {
            $match: {
              $and: [
                {
                  shop: 'native-roots-dev.myshopify.com',
                },
                {
                  recordType: 'Collection',
                },
              ],
            },
          },
          {
            $group: {
              _id: {
                id: '$id',
              },
              id: {
                $first: '$id',
              },
              title: {
                $first: '$title',
              },
              productsCount: {
                $first: '$productsCount',
              },
            },
          },
          {
            $lookup: {
              from: 'inventory',
              localField: 'id',
              foreignField: 'id',
              as: 'products',
            },
          },
          {
            $lookup: {
              from: 'inventory',
              localField: 'products.parentId',
              foreignField: 'id',
              as: 'products',
            },
          },
          {
            $project: {
              'products.id': 1,
              'products.title': 1,
              'products.totalVariants': 1,
              'products.createdAtShopify': 1,
              'products.publishedAt': 1,
              'products.featuredImage': 1,
              id: 1,
              title: 1,
              productsCount: 1,
            },
          },
        ]
      : [
          { $match: { $and: [{ shop }, { recordType: 'Collection' }] } },
          {
            $group: {
              _id: { id: '$id' },
              id: { $first: '$id' },
              title: { $first: '$title' },
              productsCount: { $first: '$productsCount' },
              // storefrontId: { $first: '$storefrontId' },
            },
          },
        ];

    const collections = await manager.aggregate(Inventory, query).toArray();

    return collections;
  }
  async findStoreProducts(productQueryInput: ProductQueryInput) {
    const { shop, sort, limit } = productQueryInput;
    const manager = getMongoManager();
    console.log(
      '🚀 ~ file: inventory.service.ts ~ line 55 ~ InventoryService ~ findStoreProducts ~ shop',
      shop,
    );

    const agg = [
      {
        $match: {
          $and: [
            {
              shop,
            },
            {
              recordType: 'Product',
            },
            {
              status: 'ACTIVE',
            },
          ],
        },
      },
      {
        $sort: {
          publishedAt: sort,
        },
      },
      {
        $limit: limit,
      },
    ];
    return await manager.aggregate(Inventory, agg).toArray();
  }

  async insertMany(inventory: []) {
    const manager = getMongoManager();

    return await manager.insertMany(Inventory, inventory);
  }

  async setPurchaseCount(inventory: any) {
    const manager = getMongoManager();

    return await manager.bulkWrite(Inventory, inventory);
  }

  async getBestSellerProducts(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          $and: [
            {
              purchaseCount: {
                $gt: 0,
              },
            },
            {
              shop,
            },
            {
              status: 'ACTIVE',
            },
          ],
        },
      },
      {
        $sort: {
          purchaseCount: -1,
        },
      },
      {
        $limit: 80,
      },
    ];
    return await manager.aggregate(Inventory, agg).toArray();
  }
}
