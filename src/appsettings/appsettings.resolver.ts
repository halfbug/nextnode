import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AppsettingsService } from './appsettings.service';
import { Appsetting } from './entities/appsetting.entity';
import { CreateAppsettingInput } from './dto/create-appsetting.input';
// import { UpdateAppsettingInput } from './dto/update-appsetting.input';

@Resolver(() => Appsetting)
export class AppsettingsResolver {
  constructor(private readonly appsettingsService: AppsettingsService) {}

  @Mutation(() => Appsetting)
  createAppsetting(
    @Args('createAppsettingInput') createAppsettingInput: CreateAppsettingInput,
  ) {
    console.log(createAppsettingInput);
    return {
      id: 'sdfsdfs4353534',
      saleTargests: [
        {
          id: 'sdfsdfijo098098',
          rewards: [
            {
              id: 'sdfst98098',
              discount: '20%',
              customerCount: 3,
            },
          ],
        },
      ],
    };
    //return this.appsettingsService.create(createAppsettingInput);
  }

  @Query(() => [Appsetting], { name: 'appsettings' })
  findAll() {
    return this.appsettingsService.findAll();
  }

  // @Query(() => Appsetting, { name: 'appsetting' })
  // findOne(@Args('id', { type: () => Int }) id: number) {
  //   return this.appsettingsService.findOne(id);
  // }

  // @Mutation(() => Appsetting)
  // updateAppsetting(
  //   @Args('updateAppsettingInput') updateAppsettingInput: UpdateAppsettingInput,
  // ) {
  //   return this.appsettingsService.update(
  //     updateAppsettingInput.id,
  //     updateAppsettingInput,
  //   );
  // }

  // @Mutation(() => Appsetting)
  // removeAppsetting(@Args('id') id: string) {
  //   return this.appsettingsService.remove(id);
  // }
}
