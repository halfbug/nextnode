import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import { EventType, Lifecycle } from './entities/lifecycle.modal';

@Injectable()
export class LifecycleService {
  constructor(
    @InjectRepository(Lifecycle)
    private lifecycleRepository: MongoRepository<Lifecycle>, // private shopifyapi: ShopifyService,
  ) {}
  create(eventLifecycle: {
    event: EventType;
    dateTime?: Date;
    groupshopId?: string;
    storeId?: string;
    plan?: number;
  }) {
    if (eventLifecycle.dateTime === null) eventLifecycle.dateTime = new Date();
    return this.lifecycleRepository.save(eventLifecycle);
  }

  findAll(groupshopId: string) {
    return this.lifecycleRepository.find({
      where: { groupshopId },
      order: { dataTime: -1 },
    });
  }
}
