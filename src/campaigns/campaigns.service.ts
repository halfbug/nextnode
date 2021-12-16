import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UpdateCampaignInput } from './dto/update-campaign.input';
import Campaign from './entities/campaign.model';
import { v4 as uuid } from 'uuid';
import { InventoryService } from 'src/inventory/inventory.service';
import { StoresService } from 'src/stores/stores.service';
import { ProductQueryInput } from 'src/inventory/dto/product-query.input';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private readonly inventoryService: InventoryService,
    private readonly sotresService: StoresService,
  ) {}
  async create(createCampaignInput: CreateCampaignInput) {
    let products: string[] = [];
    console.log(
      '🚀 ~ file: campaigns.service.ts ~ line 19 ~ CampaignsService ~ create ~ createCampaignInput',
      createCampaignInput,
    );
    const { storeId, criteria } = createCampaignInput;
    const { shop } = await this.sotresService.findOneById(storeId);
    console.log(
      '🚀 ~ file: campaigns.service.ts ~ line 26 ~ CampaignsService ~ create ~ shop',
      shop,
    );
    switch (criteria) {
      case 'newest':
        const npQuery = new ProductQueryInput();
        npQuery.limit = 80;
        npQuery.shop = shop;
        npQuery.sort = -1;
        const nproducts = await this.inventoryService.findStoreProducts(
          npQuery,
        );

        products = nproducts.map((prod) => prod.id);
        break;

      case 'bestseller':
        const bsproducts = await this.inventoryService.getBestSellerProducts(
          shop,
        );
        products = bsproducts.map((prod) => prod.id);
        break;

      default:
        products = createCampaignInput.products;
        break;
    }

    const id = uuid();

    const campaign = this.campaignRepository.create({
      id,
      ...createCampaignInput,
      products,
    });

    return this.campaignRepository.save(campaign);
  }

  findAll() {
    return this.campaignRepository.find();
  }

  findOne(id: string) {
    return this.campaignRepository.findOne({ id });
  }

  async findOneById(id: string) {
    return await this.campaignRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async update(id: string, updateCampaignInput: UpdateCampaignInput) {
    await this.campaignRepository.update({ id }, updateCampaignInput);
    return await this.findOneById(id);
  }

  remove(id: string) {
    return this.campaignRepository.delete(id);
  }

  async removeShop(storeId: string) {
    return await this.campaignRepository.delete({ storeId });
  }
}
