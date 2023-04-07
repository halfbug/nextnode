import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AppLoggerService } from './applogger.service';
import { AppLogger } from './entities/applogger.entity';
import { CreateAppLoggerInput } from './dto/create-applogger.input';
import { UpdateAppLoggerInput } from './dto/update-applogger.input';

@Resolver(() => AppLogger)
export class AppLoggerResolver {
  constructor(private readonly apploggerService: AppLoggerService) {}

  @Mutation(() => AppLogger)
  createAppLogger(
    @Args('createAppLoggerInput') createAppLoggerInput: CreateAppLoggerInput,
  ) {
    return this.apploggerService.create(createAppLoggerInput);
  }

  @Query(() => [AppLogger], { name: 'apploggers' })
  findAll() {
    return this.apploggerService.findAll();
  }

  @Query(() => AppLogger, { name: 'applogger' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.apploggerService.findOne(id);
  }

  @Mutation(() => AppLogger)
  updateAppLogger(
    @Args('updateAppLoggerInput') updateAppLoggerInput: UpdateAppLoggerInput,
  ) {
    return this.apploggerService.update(
      updateAppLoggerInput.id,
      updateAppLoggerInput,
    );
  }

  @Mutation(() => AppLogger)
  removeAppLogger(@Args('id', { type: () => String }) id: string) {
    return this.apploggerService.remove(id);
  }

  @Query(() => AppLogger)
  async findLatestLog(
    @Args('storeId', { type: () => String }) storeId: string,
    @Args('context', { type: () => String }) context: string,
  ) {
    return await this.apploggerService.findLatestLog(context, storeId);
  }
}
