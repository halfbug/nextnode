import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import { CreateChannelInput } from './dto/create-channel.input';
import { UpdateChannelInput } from './dto/update-channel.input';
import Channel from './entities/channel.model';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}
  create(createChannelInput: CreateChannelInput) {
    const id = uuid();
    // name validation required, shouldn't exist
    const channel = this.channelRepository.create({
      id,
      ...createChannelInput,
    });
    return this.channelRepository.save(channel);
  }

  async findAll(storeId) {
    const agg = [
      {
        $match: {
          storeId: storeId,
          isActive: true,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Channel, agg).toArray();
    return gs;
  }

  findOne(id: string) {
    return this.channelRepository.findOne({
      where: {
        id,
      },
    });
  }

  findOneByName(name: string, storeId: string) {
    return this.channelRepository.findOne({
      where: {
        storeId,
        slugName: { $regex: `^${name}$` },
      },
    });
  }

  async findOneById(id: string) {
    return await this.channelRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async update(id: string, updateChannelInput: UpdateChannelInput) {
    await this.channelRepository.update({ id }, updateChannelInput);
    return await this.findOneById(id);
  }

  remove(id: string) {
    return `This action removes a #${id} channel`;
  }
}
