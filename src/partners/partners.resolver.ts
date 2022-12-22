import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { PartnerService } from './partners.service';
import { PMemberService } from './pmember.service';
import { Partnergroupshop as Partners } from './entities/partner.entity';
import { CreatePartnersInput } from './dto/create-partners.input';
import { UpdatePartnersInput } from './dto/update-partners.input';
import { Metrics } from 'src/campaigns/entities/campaign.entity';
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
import {
  GraphRevenue,
  MonthlyBillingInput,
  TotalRevenue,
} from 'src/billing/dto/monthly-billing.input';
import {
  GSP_FEES1,
  GSP_SWITCH_NUM,
  GS_TIER1_START_COUNT,
  GS_TIER2_START_COUNT,
  GS_TIER3_START_COUNT,
  GS_TIER4_START_COUNT,
  GS_TIER5_START_COUNT,
  GS_TIER6_START_COUNT,
} from 'src/utils/constant';
import { TotalPGS } from './dto/partner-types.input';
import { Public } from 'src/auth/public.decorator';
import {
  MostPartnerViralCustomers,
  uniqueClicks,
} from 'src/groupshops/entities/groupshop.entity';
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

  @Query(() => [Metrics], { name: 'overviewPartnerMetric' })
  async overviewPartnerMetric(
    @Args('storeId') storeId: string,
    @Args('startFrom') startFrom: string,
    @Args('toDate') toDate: string,
  ) {
    const result = await this.PartnerService.overviewPartnerMetric(
      storeId,
      startFrom,
      toDate,
    );
    return result;
  }

  @Query(() => [MostPartnerViralCustomers], { name: 'partnerViralCustomers' })
  async partnerViralCustomers(
    @Args('storeId') storeId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ) {
    if (storeId !== '') {
      const data = await this.PartnerService.partnerMostViralCustomers(
        storeId,
        startDate,
        endDate,
      );
      return data;
    }
  }

  @Query(() => [MonthlyBillingInput], { name: 'graphPartnerRevenue' })
  getGraphRevenue(@Args('storeId') storeId: string) {
    return this.PartnerService.findGraphpartnerRevenue(storeId);
  }

  @Query(() => [GraphRevenue], { name: 'getGraphPartnerRevenueByDate' })
  getGraphPartnerRevenueByDate(
    @Args('storeId') storeId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ) {
    return this.PartnerService.findGraphPartnerRevenueByDate(
      storeId,
      startDate,
      endDate,
    );
  }

  @Query(() => uniqueClicks, { name: 'getPartnerUniqueClicks' })
  async getPartnerUniqueClicks(
    @Args('storeId') storeId: string,
    @Args('startFrom') startFrom: string,
    @Args('toDate') toDate: string,
  ) {
    const result = await this.PartnerService.partnerUniqueClicks(
      storeId,
      startFrom,
      toDate,
    );
    return result;
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
  @Query(() => TotalPGS, { name: 'getAllPartnerTiersInfo' })
  async getAllPartnerTiersInfo(@Args('storeId') storeId: string) {
    const { count } = await this.PartnerService.getActivePartnersCount(storeId);
    const { tier } = await this.storesService.findById(storeId);
    // console.log(
    //   '🚀 partners.resolver:125 ~ getAllPartnerTiersInfo ~ tier',
    //   tier,
    // );
    // find tier Info Object of current tier. if tier field not exist then bring first free tier info
    // if not tier in store show first
    const tierInfo = tier ? { ...GSP_FEES1[tier] } : { ...GSP_FEES1[0] };
    const nextTierIndex = tierInfo.index + 1;
    const nexttierInfo = { ...GSP_FEES1[nextTierIndex] };
    return {
      count: count ?? 0,
      tierName: nexttierInfo.name,
      tierCharges: nexttierInfo.fee,
      tierLimit: nexttierInfo.limit,
      currentTierName: tierInfo.name,
      currentTierCharges: tierInfo.fee,
      currentTierLimit: tierInfo.limit,
      switchCount: [...GSP_SWITCH_NUM],
      allTiersInfo: GSP_FEES1,
    };
  }
}
