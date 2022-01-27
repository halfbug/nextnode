/* eslint-disable prettier/prettier */
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
import {
  Reward,
} from 'src/appsettings/entities/sales-target.model';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private readonly inventoryService: InventoryService,
    private readonly sotresService: StoresService,
  ) {}

  async setProducts(shop, criteria, prevProducts) {
    let newProducts: string[] = [];
    switch (criteria) {
      case 'newest':
        const npQuery = new ProductQueryInput();
        npQuery.limit = 80;
        npQuery.shop = shop;
        npQuery.sort = -1;
        const nproducts = await this.inventoryService.findStoreProducts(
          npQuery,
        );

        newProducts = nproducts.map((prod) => prod.id);
        break;

      case 'bestseller':
        const bsproducts = await this.inventoryService.getBestSellerProducts(
          shop,
        );
        newProducts = bsproducts.map((prod) => prod.id);
        break;

      default:
        newProducts = prevProducts;
        break;
    }
    return newProducts;
  }

  async create(createCampaignInput: CreateCampaignInput) {
    // console.log(
    //   '🚀 ~ file: campaigns.service.ts ~ line 19 ~ CampaignsService ~ create ~ createCampaignInput',
    //   createCampaignInput,
    // );
    const { storeId, criteria } = createCampaignInput;
    const { shop } = await this.sotresService.findOneById(storeId);
   
    const prevProducts = createCampaignInput.products;
    const products: string[] = await this.setProducts(
      shop,
      criteria,
      prevProducts,
    );

    /// update all campaign
    this.campaignRepository.update({ isActive: true }, { isActive: false });
    const {
      salesTarget: { rewards },
    } = createCampaignInput;
    
    delete createCampaignInput.salesTarget.rewards;
    createCampaignInput.products = products;
    // const campaign = this.campaignRepository.create(createCampaignInput);

    const id = uuid();
    const campaign = await this.campaignRepository.create({
      id,
      ...createCampaignInput,
      products,
    });
    
    const savedCampaign = await this.campaignRepository.save(campaign);
    console.log("🚀 ~ savedCampaign", savedCampaign)

    const { id: campaign_id } = savedCampaign;
    // console.log("🚀 ~ file: campaigns.service.ts ~ line 87 ~ CampaignsService ~ create ~ campaign_id", campaign_id)
    // const {id} = savedCampaign;
    const nrewards = rewards.map((rew) => {
        
            const { id:rid, discount, customerCount } = rew;
           
            return new Reward(rid, discount, customerCount);
          });

          await this.campaignRepository.update({id: campaign_id}, { ...savedCampaign, salesTarget: { ...savedCampaign.salesTarget, rewards:nrewards}})
              // console.log(await this.campaignRepository.findOne(campaign_id))
          return await this.findOneById(campaign_id);
   
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
    console.log(
      '🚀 ~ file:CampaignsService updateCampaignInput',
      updateCampaignInput,
    );
    const {
      criteria,
      products,
      storeId,
      settings,
      socialLinks,
      salesTarget,
      isActive,
    } = updateCampaignInput;

    const { shop } = await this.sotresService.findOneById(storeId);

    const prevCampaign = await this.findOneById(id);
    const prevProducts = prevCampaign.products;

    if (products && criteria === 'custom') {
      updateCampaignInput.products = products;
    } else {
      const updatedProducts: string[] = await this.setProducts(
        shop,
        criteria,
        prevProducts,
      );
      updateCampaignInput.products = updatedProducts;
    }
    if (isActive === true) {
      await this.campaignRepository.update(
        { isActive: true },
        { isActive: false },
      );
    }

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
