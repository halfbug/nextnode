import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyStoreController } from './shopify-store.controller';

describe('ShopifyStoreController', () => {
  let controller: ShopifyStoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopifyStoreController],
    }).compile();

    controller = module.get<ShopifyStoreController>(ShopifyStoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
