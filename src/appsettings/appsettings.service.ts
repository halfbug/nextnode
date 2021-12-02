import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppsettingInput } from './dto/create-appsetting.input';
import { Appsetting } from './entities/appsetting.model';
import { v4 as uuid } from 'uuid';
import { Reward, SalesTarget } from './entities/sales-target.model';

@Injectable()
export class AppsettingsService {
  constructor(
    @InjectRepository(Appsetting) private appRepository: Repository<Appsetting>,
  ) {}

  create(createAppsettingInput: CreateAppsettingInput) {
    console.log(
      '🚀 ~ file: appsettings.service.ts ~ line 15 ~ AppsettingsService ~ create ~ createAppsettingInput',
      JSON.stringify(createAppsettingInput),
    );
    if (createAppsettingInput.salestargets) {
      const { salestargets } = createAppsettingInput;
      const apsettings: Appsetting = new Appsetting();

      apsettings.id = uuid();
      apsettings.salestargets = [
        ...salestargets.map((target) => {
          target.id = uuid();
          const nrewards = target.rewards.map((rew) => {
            rew.id = uuid();
            const { id, discount, customerCount } = rew;
            return new Reward(id, discount, customerCount);
          });
          target.rewards = [...nrewards];
          const { id, name, rogsMin, rogsMax, status, rewards } = target;
          return new SalesTarget(id, name, rogsMin, rogsMax, status, rewards);
        }),
      ];

      console.log(
        '🚀 ~ file: appsettings.service.ts ~ line 23 ~ AppsettingsService ~ create ~ apsettings',
        apsettings,
      );
      return this.appRepository.save(apsettings);
      // createAppsettingInput.salestargets = { ...nsalestarget };
    } else {
      const appsetting = this.appRepository.create({
        id: uuid(),
        ...createAppsettingInput,
      });
      return this.appRepository.save(appsetting);
    }
  }

  findAll() {
    return this.appRepository.find();
  }

  async findSalesTargetAll() {
    const qurer = await this.appRepository.findOne({
      where: { salestargets: { $ne: null } },
    });
    console.log(
      '🚀 ~ file: appsettings.service.ts ~ line 62 ~ AppsettingsService ~ findSalesTargetAll ~ qurer',
      qurer,
    );
    return qurer.salestargets;
  }
  // findOne(id: string) {
  //   return `This action returns a #${id} appsetting`;
  // }

  // update(id: string, updateAppsettingInput: UpdateAppsettingInput) {
  //   return `This action updates a #${id} appsetting`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} appsetting`;
  // }
}
