import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ChannelService } from './channel.service';
import { Channel } from './entities/channel.entity';
import {
  CreateChannelInput,
  GetChannelByName,
} from './dto/create-channel.input';
import { UpdateChannelInput } from './dto/update-channel.input';
import { NotFoundException } from '@nestjs/common';
import { ChannelGroupshopService } from './channelgroupshop.service';
import { CreateChannelGroupshopInput } from './dto/create-channel-groupshop.input';
import {
  ChannelGroupShop,
  SignUpUsers,
} from './entities/channelgroupshop.entity';
import { StoresService } from 'src/stores/stores.service';
import { UpdateChannelGroupshopInput } from './dto/update-channel-groupshop.input';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { Public } from 'src/auth/public.decorator';
import { addDays, getDateDifference } from 'src/utils/functions';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { activeGroupshop } from 'src/groupshops/entities/groupshop.entity';

@Resolver(() => Channel)
export class ChannelResolver {
  constructor(
    private readonly channelService: ChannelService,
    private readonly channelGroupshopService: ChannelGroupshopService,
    private storesService: StoresService,
    private crypt: EncryptDecryptService,
    private shopifyapi: ShopifyService,
    private readonly lifecyclesrv: LifecycleService,
  ) {}

  @Mutation(() => Channel)
  createChannel(
    @Args('createChannelInput') createChannelInput: CreateChannelInput,
  ) {
    return this.channelService.create(createChannelInput);
  }

  @Query(() => [Channel], { name: 'getChannels' })
  async findAll(@Args('storeId') storeId: string) {
    return this.channelService.findAll(storeId);
  }

  @Query(() => Channel, { name: 'getChannel' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.channelService.findOne(id);
  }

  @Public()
  @Query(() => Channel, { name: 'getChannelByName' })
  async findOneByName(
    @Args('getChannelByName')
    getChannelByName: GetChannelByName,
  ) {
    const channel = await this.channelService.findOneByName(
      getChannelByName.name,
      getChannelByName.storeId,
    );
    if (channel) {
      return channel;
    } else {
      throw new NotFoundException(`Not Found ${getChannelByName.name} channel`);
    }
  }

  @Public()
  @Mutation(() => Channel)
  updateChannel(
    @Args('updateChannelInput') updateChannelInput: UpdateChannelInput,
  ) {
    return this.channelService.update(
      updateChannelInput.id,
      updateChannelInput,
    );
  }

  @Mutation(() => Channel)
  removeChannel(@Args('id', { type: () => String }) id: string) {
    return this.channelService.remove(id);
  }

  @Public()
  @Mutation(() => ChannelGroupShop)
  async createChannelGroupshop(
    @Args('createChannelGroupshopInput')
    createChannelGroupshopInput: CreateChannelGroupshopInput,
  ) {
    const { shop } = await this.storesService.findById(
      createChannelGroupshopInput.storeId,
    );
    const campaign = await this.storesService.findOneWithActiveCampaing(shop);
    const {
      activeCampaign: { products },
    } = campaign;
    // const gs = await this.channelGroupshopService.findByOwnerEmail(
    //   createChannelGroupshopInput?.customerDetail?.email,
    // );
    if (products.length > 0) {
      // if (!gs) {
      //   return this.channelGroupshopService.create(createChannelGroupshopInput);
      // }
      // throw new Error('Groupshop with this email already exist');
      return this.channelGroupshopService.create(createChannelGroupshopInput); // commented code is for check duplicate email
    } else {
      throw new NotFoundException('Products not found in active campaign');
    }
  }

  @Public()
  @Query(() => [SignUpUsers], { name: 'getRecentSignup' })
  async findAllSignup(@Args('storeId') storeId: string) {
    return this.channelGroupshopService.findAllSignup(storeId);
  }

  @Public()
  @Mutation(() => ChannelGroupShop)
  async updateChannelGroupshop(
    @Args('updateChannelGroupshopInput')
    updateChannelGroupshopInput: UpdateChannelGroupshopInput,
  ) {
    const gs = await this.channelGroupshopService.findOne(
      updateChannelGroupshopInput.id,
    );
    if (gs) {
      return this.channelGroupshopService.update(
        updateChannelGroupshopInput.id,
        updateChannelGroupshopInput,
      );
    } else {
      throw new NotFoundException('channel groupshop not found');
    }
  }

  @Public()
  @Query(() => ChannelGroupShop, { name: 'getChannelGroupshopByCode' })
  async findChannelGroupshopByCode(
    @Args('code') code: string,
    @Args('status') status: string,
  ) {
    if (status === 'activated') {
      const Dcode = await this.crypt.decrypt(code);
      const groupshop = await this.channelGroupshopService.findChannelGS(Dcode);
      const isExpired = !(getDateDifference(groupshop.expiredAt).time > -1);
      if (isExpired) {
        //update groupshop expire date
        const newExpiredate = addDays(new Date(), 7);
        const updateGS = await this.channelGroupshopService.updateExpireDate(
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
    const gs = await this.channelGroupshopService.findChannelGroupshopByCode(
      await this.crypt.decrypt(code),
    );
    if (gs) {
      return gs;
    } else {
      throw new NotFoundException(`Not Found channel groupshop`);
    }
  }

  @Public()
  @Query(() => activeGroupshop, { name: 'getActiveChannelGroupshopURL' })
  async getActiveChannelGroupshopURL(@Args('storeId') storeId: string) {
    const result =
      await this.channelGroupshopService.getActiveChannelGroupshopURL(storeId);
    return result;
  }
}
