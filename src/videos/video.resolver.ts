import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VideoService } from './video.service';
import { Video } from './entities/video.entity';
import { CreateVideoInput } from './dto/create-video.input';
import { UpdateVideoInput } from './dto/update-video.input';

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly videoService: VideoService) {}

  @Mutation(() => Video)
  createVideo(@Args('CreateVideoInput') createVideoInput: CreateVideoInput) {
    return this.videoService.create(createVideoInput);
  }

  @Query(() => [Video], { name: 'videos' })
  findAll(@Args('storeId', { type: () => String }) storeId: string) {
    return this.videoService.findAll(storeId);
  }

  @Query(() => Video, { name: 'video' })
  findOne(@Args('id', { type: () => Int }) id: string) {
    return this.videoService.findOne(id);
  }

  @Mutation(() => [Video])
  updateVideo(@Args('UpdateVideoInput') updateVideoInput: UpdateVideoInput) {
    return this.videoService.update(updateVideoInput);
  }

  @Mutation(() => Video)
  removeVideo(@Args('id', { type: () => String }) id: string) {
    return this.videoService.remove(id);
  }
}
