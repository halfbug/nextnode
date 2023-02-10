import { Injectable, Logger, Req, Res } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { KalavioService } from 'src/email/kalavio.service';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { DropCreatedListener } from 'src/drops-groupshop/listeners/drop-created.listener';
@Injectable()
export class DropKlaviyoCron {
  constructor(
    private kalavioService: KalavioService,
    private dropsGroupshopService: DropsGroupshopService,
    private configService: ConfigService,
    private dropCreatedListener: DropCreatedListener,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES) // CronExpression.EVERY_10_MINUTES)
  async klaviyoGroupshopStatus() {
    const groupshops =
      await this.dropsGroupshopService.findExpiredDropGroupshhop();
    groupshops?.map(async (groupshop) => {
      const klaviyoId = groupshop?.customerDetail.klaviyoId;
      const shortURL = groupshop?.shortUrl;

      // Update status in database
      groupshop.status = 'expired';
      await this.dropsGroupshopService.update(groupshop.id, groupshop);

      // Update status on Klaviyo profile
      if (typeof klaviyoId !== 'undefined') {
        const currentProfile = await this.kalavioService.getProfilesById(
          klaviyoId,
        );
        const latestShortUrl =
          currentProfile.data.attributes.properties?.groupshop_url;
        if (shortURL === latestShortUrl) {
          const params = new URLSearchParams({
            groupshop_status: 'expired',
          });
          const data = params.toString();
          await this.kalavioService.klaviyoProfileUpdate(klaviyoId, data);
        }
      }
    });
  }

  @Cron('0 05 * * FRI') // CronExpression.EVERY_WEEK)
  async WeeklyDropCreation(@Req() req, @Res() res) {
    if (this.configService.get('ENV') === 'production') {
      const listId = this.configService.get('DROPLISTID');
      const shop = this.configService.get('DROPSHOP');
      let lastWeek: any = '';
      let counter = 0;
      let updatedCounter = 0;
      const d = new Date(new Date().setDate(new Date().getDate() - 7));
      const year = d.getFullYear();
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      lastWeek = Date.parse(`${year}${'-'}${month}${'-'}${day}`);
      let nextPage = '';
      Logger.log(
        `Weekly Drop Cron start for the listId : ${listId} at ${new Date()}`,
        'WeeklyDropCron',
        true,
      );
      do {
        const profiles = await this.kalavioService.getProfilesByListId(
          listId,
          nextPage,
        );
        const nextPageLink = profiles?.links?.next ? profiles?.links?.next : '';
        if (nextPageLink !== '') {
          nextPage = nextPageLink.split('profiles/?')[1];
        } else {
          nextPage = '';
        }
        // console.log('profiles', JSON.stringify(profiles));
        profiles?.data.map(async (profile, index) => {
          const arrayLength = profiles.data.length;
          counter = counter + 1;
          const klaviyoId = profile?.id;
          const createdAt = profile.attributes.properties?.groupshop_created_at;
          const drop_source = profile.attributes.properties?.groupshop_source
            ? profile.attributes.properties?.groupshop_source
            : '';

          if (drop_source === 'API' && createdAt > lastWeek) {
            console.log('Drop recently created ', klaviyoId);
          } else {
            updatedCounter = updatedCounter + 1;
            const webdata = {
              id: klaviyoId,
              first_name: profile?.attributes?.first_name,
              last_name: profile?.attributes?.last_name,
              email: profile?.attributes?.email,
              phone_number: profile?.attributes?.phone_number,
            };
            const inputListener: any = {};
            inputListener.webhook = webdata;
            inputListener.shop = shop;
            await this.dropCreatedListener.addCronDrop(inputListener);
          }
          // eslint-disable-next-line prettier/prettier
         if (nextPage === '' && arrayLength === (index + 1)) {
            console.log(
              `Weekly Drop Cron completed ${updatedCounter}/${counter} at ${new Date()} `,
            );
            Logger.log(
              `Weekly Drop Cron completed ${updatedCounter}/${counter} at ${new Date()} `,
              'WeeklyDropCron',
              true,
            );
          }
        });
      } while (nextPage !== '');
      res.status(200).send('Success');
    }
  }
}
