import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import {
  CreatePartnersInput,
  PartnerDetailsInput,
  PartnerRewardsInput,
} from './dto/create-partners.input';
import { UpdatePartnersInput } from './dto/update-partners.input';
import { partnerDetails, Partnergroupshop } from './entities/partner.modal';
import { v4 as uuid } from 'uuid';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  DealProductsInput,
  DiscountCodeInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partnergroupshop)
    private partnerRepository: Repository<Partnergroupshop>,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
  ) {}
  async create(createPartnersInput: CreatePartnersInput) {
    // console.log(
    //   'createGroupshopInput : ' + JSON.stringify(createPartnersInput),
    // );
    const partner = this.partnerRepository.create(createPartnersInput);

    const { shop, accessToken } = await this.storesService.findById(
      createPartnersInput.storeId,
    );
    // console.log(shop);
    // console.log(accessToken);
    const customerDetails = await this.shopifyapi.getCustomerByEmail(
      shop,
      accessToken,
      createPartnersInput.partnerDetails['email'],
    );

    const parDetail: partnerDetails = {
      fname:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'firstName'
            ]
          : null,
      lname:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'lastName'
            ]
          : null,
      email: createPartnersInput.partnerDetails['email'],
      shopifyCustomerId:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'id'
            ]
          : null,
    };
    partner.dealProducts = [new DealProductsInput()];
    partner.partnerDetails = new PartnerDetailsInput();
    partner.partnerRewards = new PartnerRewardsInput();
    partner.discountCode = new DiscountCodeInput();
    partner.id = uuid();
    partner.campaignId = createPartnersInput.campaignId;
    partner.storeId = createPartnersInput.storeId;
    partner.url = createPartnersInput.url;
    partner.shortUrl = createPartnersInput.shortUrl;
    partner.dealProducts = createPartnersInput?.dealProducts || [];
    partner.discountCode = createPartnersInput.discountCode;
    partner.partnerDetails = parDetail;
    partner.partnerRewards = createPartnersInput.partnerRewards;
    partner.partnerCommission = createPartnersInput.partnerCommission;
    partner.isActive = true;
    partner.createdAt = createPartnersInput.createdAt;
    return this.partnerRepository.save(partner);
  }

  findAll(storeId: string) {
    return this.partnerRepository.find({ storeId });
  }

  async update(id: string, updatePartnersInput: UpdatePartnersInput) {
    console.log(
      '🚀 ~ file:PartnerService updatePartnersInput',
      updatePartnersInput,
    );
    // const { storeId, partnerCommission, isActive } = updatePartnersInput;
    await this.partnerRepository.update({ id }, updatePartnersInput);
    return updatePartnersInput;
  }

  async existPartnerGroupshop(email: string, storeId: string) {
    const response = await this.partnerRepository.find({
      where: { storeId: storeId, 'partnerDetails.email': email },
    });
    const res = {
      isActive: response[0]?.isActive ? true : false,
    };
    return res;
  }

  async getpartnerDetail(pid: string) {
    return await this.partnerRepository.findOne(pid);
  }

  async removeShop(storeId: string) {
    return await this.partnerRepository.delete({ storeId });
  }
}
