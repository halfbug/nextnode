import { Controller, Get, Req, Res } from '@nestjs/common';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';

import { StoresService } from 'src/stores/stores.service';

@Controller('ext')
export class ThemeAppExtensionController {
  constructor(
    private campaignSrv: CampaignsService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
  ) {}
  @Get('store')
  async getStoreWithActiveCampaign(@Req() req, @Res() res) {
    const { shop } = req.query;
    const store = await this.storesService.findOneWithActiveCampaing(shop);
    res.send(JSON.stringify(store));
  }
}
