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
import {
  createParamDecorator,
  ExecutionContext,
  Ip,
  Req,
} from '@nestjs/common';
export const ReqDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().req,
);

@Resolver(() => Partners)
export class PartnersResolver {
  constructor(private readonly PartnerService: PartnerService) {}

  @Mutation(() => Partners)
  createPartner(
    @Args('createPartnersInput') createPartnersInput: CreatePartnersInput,
  ) {
    // console.log(
    //   '🚀 ~ file: Partners.resolver.ts ~ line 38 ~ PartnersResolver ~ createPartnersInput',
    //   createPartnersInput,
    // );

    return this.PartnerService.create(createPartnersInput);
  }

  @Query(() => [Partners], { name: 'partnerGroupshops' })
  async findAll(@Args('storeId') storeId: string) {
    console.log('🚀 ~ file: Partners.resolver.ts ~ findAll');
    return this.PartnerService.findAll(storeId);
  }

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
}
