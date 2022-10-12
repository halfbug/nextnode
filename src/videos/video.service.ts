import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateVideoInput } from './dto/create-video.input';
import { UpdateVideoInput } from './dto/update-video.input';
import { Video } from './entities/video.modal';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video) private VideoRepository: Repository<Video>,
  ) {}
  create(createVideoInput: CreateVideoInput): Promise<Video> {
    const store = this.VideoRepository.create({ ...createVideoInput });
    return this.VideoRepository.save(store);
  }

  async findAll(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
    ];
    const manager = getMongoManager();
    const allvideoData = await manager.aggregate(Video, agg).toArray();
    return allvideoData;
  }

  findOne(id: string) {
    return `This action returns a #${id} video`;
  }

  update(id: number, updateVideoInput: UpdateVideoInput) {
    return `This action updates a #${id} video`;
  }

  remove(id: string) {
    return `This action removes a #${id} video`;
  }
}
