import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateVideoInput } from './dto/create-video.input';
import { UpdateVideoInput } from './dto/update-video.input';
import { Video } from './entities/video.modal';
import { ObjectId } from 'mongodb';

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
    const allvideoData = await this.VideoRepository.find({ storeId });
    return allvideoData;
  }

  findOne(id: string) {
    return `This action returns a #${id} video`;
  }

  async update(updateVideoInput: UpdateVideoInput) {
    const { selectedIds, storeId } = updateVideoInput;
    try {
      const manager = getMongoManager();
      await manager.updateMany(
        Video,
        { storeId: storeId },
        {
          $set: {
            status: 'InActive',
            orderId: 0,
          },
        },
      );

      for (let i = 0; i < selectedIds.length; i++) {
        await manager.updateOne(
          Video,
          { _id: ObjectId(selectedIds[i]) },
          { $set: { status: 'Active', orderId: i + 1 } },
        );
      }
    } catch (er) {
      console.log(er);
    }
    const allvideoData = await this.VideoRepository.find({ storeId });

    return allvideoData;
  }

  remove(id: string) {
    return `This action removes a #${id} video`;
  }
}
