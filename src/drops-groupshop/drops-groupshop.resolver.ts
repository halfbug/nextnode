import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DropsGroupshopService } from './drops-groupshop.service';
import { DropsGroupshop } from './entities/drops-groupshop.entity';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { Public } from 'src/auth/public.decorator';
import { NotFoundException, UseInterceptors } from '@nestjs/common';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { ViewedInterceptor } from 'src/gs-common/viewed.inceptor';
import { addDays, getDateDifference } from 'src/utils/functions';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { StoresService } from 'src/stores/stores.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';

@Resolver(() => DropsGroupshop)
export class DropsGroupshopResolver {
  constructor(
    private readonly dropsGroupshopService: DropsGroupshopService,
    private readonly crypt: EncryptDecryptService,
    private readonly lifecyclesrv: LifecycleService,
    private storesService: StoresService,
    private shopifyapi: ShopifyService,
  ) {}

  @Public()
  @Mutation(() => DropsGroupshop)
  createDropsGroupshop(
    @Args('createDropsGroupshopInput')
    createDropsGroupshopInput: CreateDropsGroupshopInput,
  ) {
    return this.dropsGroupshopService.create(createDropsGroupshopInput);
  }

  @Query(() => [DropsGroupshop], { name: 'dropsGroupshop' })
  findAll() {
    return this.dropsGroupshopService.findAll();
  }

  @Query(() => DropsGroupshop, { name: 'dropsGroupshop' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.dropsGroupshopService.findOne(id);
  }

  @Public()
  @UseInterceptors(ViewedInterceptor)
  @Query(() => DropsGroupshop, { name: 'DropGroupshop' })
  async findDropsGroupshopByCode(
    @Args('code') code: string,
    @Args('status') status: string,
  ) {
    const Dcode = await this.crypt.decrypt(code);
    const groupshop = await this.dropsGroupshopService.findDropsGS(Dcode);
    const res = await this.lifecyclesrv.findAllEvents(
      groupshop.id,
      EventType.revised,
    );
    if (status === 'activated') {
      const isExpired = !(getDateDifference(groupshop.expiredAt).time > -1);
      if (isExpired && res?.length < 1) {
        const newExpiredate = addDays(new Date(), 1);
        const updateGS = await this.dropsGroupshopService.updateExpireDate(
          {
            expiredAt: newExpiredate,
            id: groupshop.id,
          },
          Dcode,
        );

        // add lifcycle event for revised groupshop
        this.lifecyclesrv.create({
          groupshopId: groupshop.id,
          event: EventType.revised,
          dateTime: new Date(),
        });
        this.lifecyclesrv.create({
          groupshopId: groupshop.id,
          event: EventType.expired,
          dateTime: newExpiredate,
        });

        const { shop, accessToken } = await this.storesService.findById(
          updateGS?.storeId,
        );

        await this.shopifyapi.setDiscountCode(
          shop,
          'Update',
          accessToken,
          updateGS.discountCode.title,
          null,
          null,
          updateGS.createdAt,
          newExpiredate,
          updateGS.discountCode.priceRuleId,
        );
        return updateGS;
      }
    }
    const gs = await this.dropsGroupshopService.findDropGroupshopByCode(
      // code,
      await this.crypt.decrypt(code),
    );
    if (gs) {
      return { ...gs, revisedCount: res.length };
    } else {
      throw new NotFoundException(`Not Found drops groupshop`);
    }
  }

  @Public()
  @Mutation(() => DropsGroupshop)
  updateDropsGroupshop(
    @Args('updateDropsGroupshopInput')
    updateDropsGroupshopInput: UpdateDropsGroupshopInput,
  ) {
    return this.dropsGroupshopService.update(
      updateDropsGroupshopInput.id,
      updateDropsGroupshopInput,
    );
  }

  @Mutation(() => DropsGroupshop)
  removeDropsGroupshop(@Args('id', { type: () => String }) id: string) {
    return this.dropsGroupshopService.remove(id);
  }
}
