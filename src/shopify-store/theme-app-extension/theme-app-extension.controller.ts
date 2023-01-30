import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { ConfigService } from '@nestjs/config';
import { StoresService } from 'src/stores/stores.service';
import { PartnerService } from 'src/partners/partners.service';
import { Public } from 'src/auth/public.decorator';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelGroupshopService } from 'src/channel/channelgroupshop.service';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { OrdersService } from 'src/inventory/orders.service';
import { InventoryService } from 'src/inventory/inventory.service';
@Public()
@Controller('ext')
export class ThemeAppExtensionController {
  constructor(
    private configService: ConfigService,
    private campaignSrv: CampaignsService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
    private partnerSrv: PartnerService,
    private channelService: ChannelService,
    private channelGroupshopService: ChannelGroupshopService,
    private dropsGroupshopService: DropsGroupshopService,
    private orderService: OrdersService,
    private inventoryService: InventoryService,
  ) {}
  @Get('store')
  async getStoreWithActiveCampaign(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const {
        id,
        currencyCode,
        activeCampaign: {
          id: campaignId,
          salesTarget: {
            rewards: [, , { discount }],
          },
        },
        settings,
        status,
        logoImage,
        brandName,
        drops: { bestSellerCollectionId, rewards: { maximum } } = {
          bestSellerCollectionId: '',
          rewards: { maximum: 0 },
        },
      } = await this.storesService.findOneWithActiveCampaing(shop);
      // console.log(await this.storesService.findOneWithActiveCampaing(shop));
      res.send(
        JSON.stringify({
          id,
          currencyCode,
          campaignId,
          status,
          discount,
          logoImage: `${this.configService.get('IMAGE_PATH')}${
            logoImage?.split('/')[4]
          }`,
          settings,
          brandName,
          bestSellerCollectionId,
          dropsLastMilestone: maximum,
        }),
      );
    } catch (err) {
      Logger.error(err, ThemeAppExtensionController.name);
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('gslink')
  async getGroupshopURL(@Req() req, @Res() res) {
    try {
      const { storeid, campaignid, productid } = req.body;
      console.log({ productid });
      console.log({ campaignid });
      console.log('🚀 ~  ~ storeid', storeid);
      // console.log('🚀 ~  ~ shop', shop);

      const { id, url } = await this.groupshopSrv.getRunningGroupshop(
        campaignid,
        productid,
      );
      res.send(
        JSON.stringify({ id, url: `${this.configService.get('FRONT')}${url}` }),
      );
    } catch (err) {
      res.send(JSON.stringify({ id: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('member')
  async getMemberDetails(@Req() req, @Res() res) {
    try {
      const { orderId, wurl } = req.body;
      console.log('🚀  ~ wurl', wurl);
      console.log({ orderId });

      const {
        members,
        members: [owner],
        url,
        obSettings: { ownerUrl },
        discountCode: { percentage },
      } = await this.groupshopSrv.findByOrderId(orderId);
      console.log(
        '🚀 ~ file: theme-app-extension.controller.ts ~ line 65 ~ ThemeAppExtensionController ~ getMemberDetails ~ members',
        members,
      );
      const newURL =
        owner.orderId === `gid://shopify/Order/${orderId}` ? ownerUrl : url;
      console.log(
        '🚀 ~ file: theme-app-extension.controller.ts ~ line 101 ~ ThemeAppExtensionController ~ getMemberDetails ~ newURL',
        newURL,
      );
      // console.log(await /this.groupshopSrv.findByOrderId(orderId));
      const activeMember = members.find((member) =>
        member.orderId.includes(orderId),
      );
      console.log(
        '🚀 ~ file: theme-app-extension.controller.ts ~ line 69 ~ ThemeAppExtensionController ~ getMemberDetails ~ activeMember',
        activeMember,
      );
      res.send(
        JSON.stringify({
          activeMember,
          url: newURL,
          // url,
          percentage,
          members: members.length,
        }),
      );
    } catch (err) {
      res.send(JSON.stringify({ activeMember: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('products')
  async getCampainProducts(@Req() req, @Res() res) {
    try {
      const { campaignId } = req.body;
      console.log({ campaignId });

      const { products } = await this.campaignSrv.findOneWithProducts(
        campaignId,
      );

      res.send(JSON.stringify(products));
    } catch (err) {
      res.send(JSON.stringify({ products: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('partner')
  async getPartnerDetails(@Req() req, @Res() res) {
    try {
      const { discountCode } = req.body;
      console.log({ discountCode });

      const {
        url,
        partnerRewards: { baseline },
        partnerDetails: { fname },
      } = await this.partnerSrv.findOne(discountCode);
      const formatName = `${fname[0].toUpperCase()}${fname.slice(1)}`;

      res.send(
        JSON.stringify({
          url,
          baseline,
          fname: formatName,
        }),
      );
    } catch (err) {
      res.send(JSON.stringify({ activeMember: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('channel')
  async getChannelDetails(@Req() req, @Res() res) {
    try {
      const { discountCode } = req.body;
      console.log({ discountCode });

      const {
        url,
        channelId,
        customerDetail: { firstName: fname },
      } = await this.channelGroupshopService.findChannelGS(discountCode);
      const {
        rewards: { baseline },
      } = await this.channelService.findOne(channelId);
      const formatName = `${fname[0].toUpperCase()}${fname.slice(1)}`;

      res.send(
        JSON.stringify({
          url,
          baseline,
          fname: formatName,
        }),
      );
    } catch (err) {
      res.send(JSON.stringify({ baseline: null, url: null, fname: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('dropsMember')
  async getDropsMemberDetails(@Req() req, @Res() res) {
    try {
      const { orderId } = req.body;

      const {
        members,
        url,
        discountCode: { percentage },
      } = await this.dropsGroupshopService.findByOrderId(orderId);

      const activeMember = members.find((member) =>
        member.orderId.includes(orderId),
      );

      const orderDetails = await this.orderService.getMembersOrderDetail(
        members,
      );

      const uniqueMembers = [];

      orderDetails.forEach((o: any) => {
        console.log('phone', o.customer);
        if (
          !uniqueMembers
            .filter(({ email }) => ![undefined, null].includes(email))
            .map((u) => u.email)
            .includes(o.customer?.email) &&
          !uniqueMembers
            .filter(({ phone }) => ![undefined, null].includes(phone))
            .map((u) => u.phone)
            .includes(o.customer?.phone)
        ) {
          uniqueMembers.push({
            email: o.customer?.email,
            phone: o.customer?.phone,
          });
        }
      });

      res.send(
        JSON.stringify({
          activeMember,
          url,
          percentage,
          members: uniqueMembers.length,
        }),
      );
    } catch (err) {
      console.log(err);
      res.send(JSON.stringify({ activeMember: null, url: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }

  @Post('dropsProducts')
  async getDropsProducts(@Req() req, @Res() res) {
    try {
      const { shop, bestsellerCollectionId } = req.body;

      const bestSellerProducts =
        await this.inventoryService.getProductsByCollectionIDs(shop, [
          bestsellerCollectionId,
        ]);

      res.send(JSON.stringify({ products: bestSellerProducts }));
    } catch (err) {
      res.send(JSON.stringify({ products: null }));
    } finally {
      // res.status(HttpStatus.OK).send();
    }
  }
}
