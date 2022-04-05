import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { ConfigService } from '@nestjs/config';
import { StoresService } from 'src/stores/stores.service';

@Controller('ext')
export class ThemeAppExtensionController {
  constructor(
    private configService: ConfigService,
    private campaignSrv: CampaignsService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
  ) {}
  @Get('store')
  async getStoreWithActiveCampaign(@Req() req, @Res() res) {
    const { shop } = req.query;
    const {
      id,
      activeCampaign: {
        id: campaignId,
        salesTarget: {
          rewards: [, , { discount }],
        },
      },
      status,
      logoImage,
    } = await this.storesService.findOneWithActiveCampaing(shop);
    console.log(await this.storesService.findOneWithActiveCampaing(shop));
    res.send(JSON.stringify({ id, campaignId, status, discount, logoImage }));
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
    }
  }
}
