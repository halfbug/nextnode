import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UpdateCampaignInput } from './dto/update-campaign.input';
import Campaign from './entities/campaign.model';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}
  create(createCampaignInput: CreateCampaignInput) {
    const id = uuid();
    const campaign = this.campaignRepository.create({
      id,
      ...createCampaignInput,
    });
    return this.campaignRepository.save(campaign);
  }

  findAll() {
    return `This action returns all campaigns`;
  }

  findOne(id: string) {
    return `This action returns a #${id} campaign`;
  }

  update(id: string, updateCampaignInput: UpdateCampaignInput) {
    return `This action updates a #${id} campaign`;
  }

  remove(id: string) {
    return `This action removes a #${id} campaign`;
  }
}
