import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Visitors } from './entities/visitors.modal';

@Injectable()
export class VistorsService {
  constructor(
    @InjectRepository(Visitors)
    private visitorsRepository: MongoRepository<Visitors>, // private shopifyapi: ShopifyService,
  ) {}
  create(groupshopId: string, ip: string) {
    const eventVisitors = {
      groupshopId,
      ip,
      deteTime: new Date(),
    };
    return this.visitorsRepository.save(eventVisitors);
  }

  findAll(groupshopId: string) {
    return this.visitorsRepository.find({
      where: { groupshopId },
      order: { dataTime: -1 },
    });
  }

  findOne(ip: string) {
    return this.visitorsRepository.findOne({
      where: {
        ip,
      },
    });
  }
}
