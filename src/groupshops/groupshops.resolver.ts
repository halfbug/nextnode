import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { GroupshopsService } from './groupshops.service';
import {
  GroupShop as Groupshop,
  Member,
  uniqueClicks,
} from './entities/groupshop.entity';
import { CreateGroupshopInput } from './dto/create-groupshops.input';
import { UpdateGroupshopInput } from './dto/update-groupshops.input';
import {
  createParamDecorator,
  ExecutionContext,
  Ip,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { QRInput } from './dto/qr-code.input';
import { ViewedInterceptor } from 'src/gs-common/viewed.inceptor';
import { addDays, getDateDifference } from 'src/utils/functions';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { GSUpdatePriceRuleEvent } from './events/groupshop-update-price-rule.event';

export const ReqDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().req,
);

@Resolver(() => Groupshop)
export class GroupshopsResolver {
  constructor(
    private readonly GroupshopsService: GroupshopsService,
    private readonly crypt: EncryptDecryptService,
    private readonly lifecyclesrv: LifecycleService,
    private readonly gsUpdatePriceRuleEvt: GSUpdatePriceRuleEvent,
  ) {}

  @Mutation(() => Groupshop)
  createGroupshop(
    @Args('createGroupshopInput') createGroupshopInput: CreateGroupshopInput,
  ) {
    // console.log(
    //   '🚀 ~ file: groupshops.resolver.ts ~ line 15 ~ GroupshopsResolver ~ createGroupshopInput',
    //   createGroupshopInput,
    // );

    return this.GroupshopsService.create(createGroupshopInput);
  }

  @Query(() => [Groupshop], { name: 'groupshops' })
  findAll() {
    return this.GroupshopsService.findAll();
  }

  @Query(() => [Groupshop], { name: 'totalGroupshops' })
  totalGs(@Args('storeId') storeId: string) {
    return this.GroupshopsService.totalGs(storeId);
  }

  @Query(() => QRInput, { name: 'getQrDealLink' })
  findQrDealLink(
    @Args('email') email: string,
    @Args('ordernumber') ordernumber: string,
  ) {
    return this.GroupshopsService.findfindQrDealLinkAll(email, ordernumber);
  }

  @Query(() => uniqueClicks, { name: 'getUniqueClicks' })
  getuniqueClicks(@Args('shop') shop: string) {
    return this.GroupshopsService.getuniqueClicks(shop);
  }

  @Query(() => [Member], { name: 'getGsOrders' })
  findGsOrders(@Args('groupshopUrl') groupshopUrl: string) {
    console.log(groupshopUrl);
    return this.GroupshopsService.findGsOrders(groupshopUrl);
  }

  @UseInterceptors(ViewedInterceptor)
  @Query(() => Groupshop, { name: 'groupshop' })
  async findOne(@Args('code') code: string, @Args('status') status: string) {
    console.log('code status', code, status);
    if (status === 'activated') {
      //load gs, currentdate > expiredate, update expire = currdate+7
      const Dcode = await this.crypt.decrypt(code);
      const groupshop = await this.GroupshopsService.find(Dcode);
      const isExpired = !(getDateDifference(groupshop.expiredAt).time > -1);
      if (isExpired) {
        //update groupshop expire date
        const newExpiredate = addDays(new Date(), 7);
        const updateGS = await this.GroupshopsService.updateExpireDate(
          {
            expiredAt: newExpiredate,
            id: groupshop.id,
          },
          Dcode,
        );
        // console.log(
        //   '🚀 ~ file: groupshops.resolver.ts ~ line 81 ~ GroupshopsResolver ~ findOne ~ updateGS',
        //   updateGS,
        // );

        // add lifcycle event for revised groupshop
        this.lifecyclesrv.create(groupshop.id, EventType.revised, new Date());
        this.lifecyclesrv.create(
          groupshop.id,
          EventType.expired,
          newExpiredate,
        );
        // update price rule end date.
        this.gsUpdatePriceRuleEvt.groupshop = updateGS;
        this.gsUpdatePriceRuleEvt.endDate = addDays(new Date(), 7);
        this.gsUpdatePriceRuleEvt.emit();
        return updateGS;
      }
    }
    return await this.GroupshopsService.findOne(await this.crypt.decrypt(code));
  }

  @Mutation(() => Groupshop, { name: 'addDealProduct' })
  addDealProduct(
    @Args('updateGroupshopInput') updateGroupshopInput: UpdateGroupshopInput,
  ) {
    return this.GroupshopsService.update(updateGroupshopInput);
  }

  // @Mutation(() => Groupshop)
  // removeGroupshop(@Args('id', { type: () => Int }) id: number) {
  //   return this.GroupshopsService.remove(id);
  // }
}
