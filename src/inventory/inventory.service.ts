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

  async create(createInventoryInput: CreateInventoryInput): Promise<Inventory> {
    // console.log(
    //   '🚀 ~ file: inventory.service.ts ~ line 21 ~ InventoryService ~ create ~ CreateInventoryInput',
    //   createInventoryInput,
    // );
    const inventory = this.inventoryRepository.create(createInventoryInput);
    if (createInventoryInput.recordType === 'ProductVariant') {
      inventory.selectedOptions = [...createInventoryInput.selectedOptions];
      inventory.image = createInventoryInput.image ?? null;
    }

    // console.log(
    //   '🚀 ~ file: inventory.service.ts ~ line 21 ~ InventoryService ~ create ~ inventory',
    //   inventory,
    // );

    return await this.inventoryRepository.save(inventory);
  }

  async update(updateInvenotryInput: UpdateInventoryInput) {
    const { id } = updateInvenotryInput;
    // return await this.inventoryRepository.update({ id }, updateInvenotryInput);
    // return await this.inventoryRepository.save(updateInvenotryInput);
    const manager = getMongoManager();
    try {
      return await manager.updateOne(
        Inventory,
        { id },
        { $set: { ...updateInvenotryInput } },
        {
          upsert: true,
        },
      );
    } catch (err) {
      console.log(err);
    }
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
    console.log(
      '%c ',
      'font-size: 1px; padding: 240px 123.5px; background-size: 247px 480px; background: no-repeat url(https://i2.wp.com/i.giphy.com/media/11ZSwQNWba4YF2/giphy-downsized.gif?w=770&amp;ssl=1);',
      id,
    );
    return await this.inventoryManager.deleteMany(Inventory, {
      $or: [{ id: { $regex: id } }, { parentId: { $regex: id } }],
    });
  }

  async removeChildren(id: string) {
    console.log(id, 'remove children');
    return await this.inventoryManager.deleteMany(Inventory, { parentId: id });
  }
  async removeVariants(id: string) {
    console.log(id, 'removevariants');
    return await this.inventoryManager.deleteMany(Inventory, {
      $and: [
        { parentId: id },
        {
          $or: [
            { recordType: 'ProductVariant' },
            { recordType: 'ProductImage' },
          ],
        },
      ],
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
            {
              outofstock: false,
            },
            {
              publishedAt: { $ne: null },
            },
          ],
        },
      },
      {
        $count: 'count',
      },
    ];
    const tp = await this.inventoryManager.aggregate(Inventory, agg).toArray();
    // console.log(
    //   '🚀 ~ file: inventory.service.ts ~ line 55 ~ InventoryService ~ findTotalProducts ~ tp',
    //   tp,
    // );
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
                  shop,
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
              productslist: {
                $addToSet: '$parentId',
              },
            },
          },
          {
            $lookup: {
              from: 'inventory',
              localField: 'productslist',
              foreignField: 'id',
              as: 'products',
            },
          },
          {
            $addFields: {
              products: {
                $filter: {
                  input: '$products',
                  as: 'j',
                  cond: {
                    $and: [
                      {
                        $ne: ['$publishedAt', null],
                      },
                      {
                        $ne: ['$outofstock', true],
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            $project: {
              id: 1,
              title: 1,
              products: 1,
              productsCount: {
                $size: '$products',
              },
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
            {
              outofstock: false,
            },
            {
              publishedAt: { $ne: null },
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
            {
              outofstock: false,
            },
            {
              publishedAt: { $ne: null },
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

  async getCollectionNameByProductId(shop: string, productId: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          $and: [
            {
              shop,
            },
            {
              recordType: 'Collection',
            },
            {
              parentId: productId,
            },
          ],
        },
      },
    ];
    return await manager.aggregate(Inventory, agg).toArray();
  }

  async findProductById(id: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          id,
        },
      },
      {
        $lookup: {
          from: 'inventory',
          let: {
            pid: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$$pid', '$parentId'],
                    },
                    {
                      $eq: ['$recordType', 'ProductVariant'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'variants',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          let: {
            pid: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$$pid', '$parentId'],
                    },
                    {
                      $eq: ['$recordType', 'ProductImage'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'images',
        },
      },
    ];
    const res = await manager.aggregate(Inventory, agg).toArray();
    // console.log(
    //   '🚀 ~ file: inventory.service.ts ~ line 329 ~ InventoryService ~ findProductById ~ res',
    //   res,
    // );
    return res[0];
    // return await manager.aggregate(Inventory, agg).toArray();
  }

  // it find all products, variants, collection, images
  async findAllProducts(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          shop,
          recordType: 'Product',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          let: {
            product_id: '$id',
          },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ['$parentId', '$$product_id'],
                    },
                  },
                  {
                    recordType: 'ProductVariant',
                  },
                ],
              },
            },
          ],
          as: 'variants',
        },
      },
      // {
      //   $lookup: {
      //     from: 'inventory',
      //     let: {
      //       product_id: '$id',
      //     },
      //     pipeline: [
      //       {
      //         $match: {
      //           $and: [
      //             {
      //               $expr: {
      //                 $eq: ['$parentId', '$$product_id'],
      //               },
      //             },
      //             {
      //               recordType: 'ProductImage',
      //             },
      //           ],
      //         },
      //       },
      //     ],
      //     as: 'imagesObj',
      //   },
      // },
      {
        $lookup: {
          from: 'inventory',
          let: {
            product_id: '$id',
          },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ['$parentId', '$$product_id'],
                    },
                  },
                  {
                    recordType: 'Collection',
                  },
                ],
              },
            },
          ],
          as: 'collections',
        },
      },
    ];
    // console.log(
    //   '🚀 ~ file: inventory.service.ts ~ line 446 ~ InventoryService ~ findAllProducts ~ agg',
    //   JSON.stringify(agg),
    // );
    const res = await manager.aggregate(Inventory, agg).toArray();
    // console.log('🚀 ~ file: InventoryService ~ findAllProducts ~ res', res);
    return res;
    // return await manager.aggregate(Inventory, agg).toArray();
  }

  // it find all products, variants, collection, images
  async findAllProductsOnly(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          shop,
          recordType: 'Product',
        },
      },
    ];
    const res = await manager.aggregate(Inventory, agg).toArray();
    // console.log('🚀 ~ file: InventoryService ~ findAllProducts ~ res', res);
    return res;
    // return await manager.aggregate(Inventory, agg).toArray();
  }
}
