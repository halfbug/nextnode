import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import {
  CreatePartnersInput,
  PartnerDetailsInput,
  PartnerRewardsInput,
} from './dto/create-partners.input';
import { UpdatePartnersInput } from './dto/update-partners.input';
import {
  partnerDetails,
  Partnergroupshop,
  Partnermember,
} from './entities/partner.modal';
import { v4 as uuid } from 'uuid';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  DealProductsInput,
  DiscountCodeInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';
import { GSPCreatedEvent } from './events/create-partner-groupshop.event';
import { PartnerMember } from './entities/partner.entity';
import { CreateOrderInput as LineItem } from 'src/inventory/dto/create-order.input';

@Injectable()
export class PMemberService {
  constructor(
    @InjectRepository(Partnermember)
    private pmemberRepository: Repository<Partnermember>,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
    private gspEvent: GSPCreatedEvent,
  ) {}

  async create(partnerMemberInput: PartnerMember) {
    console.log(
      '🚀 ~ file: pmember.service.ts ~ line 36 ~ PartnerService ~ create ~ partnerMemberInput',
      partnerMemberInput,
    );
    // partnerMemberInput.lineItems =
    const partnerMem = this.pmemberRepository.create(partnerMemberInput);
    partnerMem.lineItems = [new LineItem()];
    partnerMem.lineItems = [...partnerMemberInput.lineItems];
    return this.pmemberRepository.save(partnerMem);
  }

  findAll(groupshopId: string) {
    return this.pmemberRepository.find({ groupshopId });
  }

  async removeShop(storeId: string) {
    return await this.pmemberRepository.delete({ storeId });
  }

  async update(id: string, partnerMemberInput: PartnerMember) {
    const res = await this.pmemberRepository.update({ id }, partnerMemberInput);
    return res;
  }
}
