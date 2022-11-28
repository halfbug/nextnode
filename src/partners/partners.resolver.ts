import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { PartnerService } from './partners.service';
import { Partnergroupshop as Partners } from './entities/partner.entity';
import { CreatePartnersInput } from './dto/create-partners.input';
import { UpdatePartnersInput } from './dto/update-partners.input';
import { StoresService } from 'src/stores/stores.service';
import {
  createParamDecorator,
  ExecutionContext,
  Ip,
  NotFoundException,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { ViewedInterceptor } from 'src/gs-common/viewed.inceptor';
import { TotalRevenue } from 'src/billing/dto/monthly-billing.input';
import { GSP_FEES1 } from 'src/utils/constant';
import { TotalPGS } from './dto/partner-types.input';
import { Public } from 'src/auth/public.decorator';
export const ReqDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().req,
);

@Resolver(() => Partners)
export class PartnersResolver {
  constructor(
    private readonly PartnerService: PartnerService,
    private readonly crypt: EncryptDecryptService,
    private storesService: StoresService,
  ) {}

  @Mutation(() => Partners || undefined)
  async createPartner(
    @Args('createPartnersInput') createPartnersInput: CreatePartnersInput,
  ) {
    // console.log(
    //   '🚀 ~ file: Partners.resolver.ts ~ line 38 ~ PartnersResolver ~ createPartnersInput',
    //   createPartnersInput,
    // );
    const { shop } = await this.storesService.findById(
      createPartnersInput.storeId,
    );
    const campaign = await this.storesService.findOneWithActiveCampaing(shop);
    const {
      activeCampaign: { products },
    } = campaign;
    if (products.length > 0) {
      return this.PartnerService.create(createPartnersInput);
    } else {
      throw new NotFoundException('Products not found in active campaign');
    }
  }

  @Query(() => [Partners], { name: 'partnerGroupshops' })
  async findAll(@Args('storeId') storeId: string) {
    // console.log('🚀 ~ file: Partners.resolver.ts ~ findAll ');
    return await this.PartnerService.findAll(storeId);
  }
  @Public()
  @Mutation(() => Partners)
  updatePartnerGroupshop(
    @Args('updatePartnersInput') updatePartnersInput: UpdatePartnersInput,
  ) {
    return this.PartnerService.update(
      updatePartnersInput.id,
      updatePartnersInput,
    );
  }

  @Query(() => Partners, { name: 'existPartnerGroupshop' })
  findPartnerGroupshop(
    @Args('email') email: string,
    @Args('storeId') storeId: string,
  ) {
    return this.PartnerService.existPartnerGroupshop(email, storeId);
  }

  @Query(() => Partners, { name: 'getPartnerDetail' })
  findPartnerDetail(@Args('id') id: string) {
    return this.PartnerService.getpartnerDetail(id);
  }
  @Public()
  @UseInterceptors(ViewedInterceptor)
  @Query(() => Partners, { name: 'partnerGroupshop' })
  async findOne(@Args('code') code: string) {
    console.log('🚀 ~ file: Partners.resolver.ts ~ findOne', code);
    return this.PartnerService.findOne(await this.crypt.decrypt(code));
  }
  @Query(() => TotalRevenue, { name: 'getPartnerRevenue' })
  async getPartnerRevenue(@Args('storeId') storeId: string) {
    return this.PartnerService.getPartnerRevenue(storeId);
  }
  @Public()
  @Mutation(() => Partners, { name: 'addDealProductPartner' })
  addDealProductPartner(
    @Args('updatePartnersInput') updatePartnersInput: UpdatePartnersInput,
  ) {
    return this.PartnerService.update(
      updatePartnersInput.id,
      updatePartnersInput,
    );
  }
  @Query(() => TotalPGS, { name: 'getActivePartnersCount' })
  async getActivePartnersCount(@Args('storeId') storeId: string) {
    const { count } = await this.PartnerService.getActivePartnersCount(storeId);
    const { tier } = await this.storesService.findById(storeId);
    // find tier Info Object of current tier. if tier field not exist then bring first free tier info
    // eslint-disable-next-line prettier/prettier
    const tierInfo = GSP_FEES1.find(
      (itm, ind) => itm.index === tier,
    );
    console.log(
      '🚀 tierInfo = ',
      tierInfo,
      '🚀 tier = ',
      tier,
      '🚀 count = ',
      count,
    );
    const nextTierIndex = count === 0 ? tierInfo.index + 1 : tierInfo.index + 1;
    tierInfo.name = GSP_FEES1[nextTierIndex].name;
    tierInfo.fee = GSP_FEES1[nextTierIndex].fee;
    tierInfo.limit = GSP_FEES1[nextTierIndex].limit;
    // }
    return {
      count: count ?? 0,
      tierName: tierInfo.name,
      tierCharges: tierInfo.fee,
      tierLimit: tierInfo.limit,
    };
  }
}
