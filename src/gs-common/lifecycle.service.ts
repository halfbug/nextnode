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
  create(groupshopId: string, event: EventType, dateTime?: Date) {
    const eventLifecycle = {
      groupshopId,
      event,
      deteTime: dateTime || new Date(),
    };
    return this.lifecycleRepository.save(eventLifecycle);
  }

  findAll(groupshopId: string) {
    return this.lifecycleRepository.find({
      where: { groupshopId },
      order: { dataTime: -1 },
    });
  }
}
