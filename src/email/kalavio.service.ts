import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { getMongoManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';
import { lastValueFrom, map } from 'rxjs';
import { CreateSignUpInput } from './dto/create-signup.input';
import * as qrcode from 'qrcode';

@Injectable()
export class KalavioService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  sendKlaviyoEmail(body) {
    const urlKlaviyo = this.configService.get('KLAVIYO_TRACK_URL');
    const token = this.configService.get('KLAVIYO_PUBLIC_KEY');
    const newbody = JSON.stringify({ token, ...body });
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    this.httpService
      .post(urlKlaviyo, newbody, options)
      .subscribe(async (res) => {
        //console.log(res);
      });
  }

  createKlaviyoSubscribes(body: any) {
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');
    const urlKlaviyo = `${this.configService.get(
      'KLAVIYO_BASE_URL',
    )}${'/v2/list/'}${'UHgKGu'}${'/subscribe?api_key='}${PRIVATE_KEY}`;
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    this.httpService.post(urlKlaviyo, body, options).subscribe(async (res) => {
      // console.log(res);
    });
  }

  async klaviyoSignUp(createSignUpInput) {
    const listId = this.configService.get('KLAVIYO_LIST_ID');
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');
    const urlKlaviyo = `${this.configService.get(
      'KLAVIYO_BASE_URL',
    )}${'/v2/list/'}${listId}${'/subscribe?api_key='}${PRIVATE_KEY}`;
    console.log(urlKlaviyo);
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const body = JSON.stringify({
      profiles: [
        {
          email: createSignUpInput.email,
        },
      ],
    });
    try {
      const res = await lastValueFrom(
        this.httpService
          .post(urlKlaviyo, body, options)
          .pipe(map((res) => res.data)),
      );
      const status = res.length > 0 ? true : false;

      const result = {
        email: status === true ? res[0]?.id : '',
      };
      return result;
    } catch (err) {
      console.log({ err });
      console.log(JSON.stringify(err));
      Logger.error(err, KalavioService.name);
      return false;
    }
  }

  async klaviyoProfileSmsUpdate(input) {
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');
    const customerEmail = input.email;
    const urlKlaviyo = `${this.configService.get(
      'KLAVIYO_BASE_URL',
    )}${'/v2/people/search?email='}${customerEmail}${'&api_key='}${PRIVATE_KEY}`;
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const getProfile = await lastValueFrom(
      this.httpService.get(urlKlaviyo).pipe(map((res) => res.data)),
    );
    const ProfileId = getProfile?.id || null;
    if (ProfileId !== null) {
      const profileUrlKlaviyo = `${this.configService.get(
        'KLAVIYO_BASE_URL',
      )}${'/v1/person/'}${ProfileId}${'?sms_marketing_consent='}${
        input.sms_marketing
      }${'&api_key='}${PRIVATE_KEY}`;
      console.log(profileUrlKlaviyo);
      await lastValueFrom(
        this.httpService
          .put(profileUrlKlaviyo, options)
          .pipe(map((res) => res.data)),
      );
    }
  }

  async klaviyoProfileUpdate(ProfileId, shortLink) {
    const PRIVATE_KEY = this.configService.get('KLAVIYO_PRIVATE_KEY');
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    const profileUrlKlaviyo = `${this.configService.get(
      'KLAVIYO_BASE_URL',
    )}${'/v1/person/'}${ProfileId}${'?groupshop_url='}${shortLink}${'&api_key='}${PRIVATE_KEY}`;
    try {
      await lastValueFrom(
        this.httpService
          .put(profileUrlKlaviyo, options)
          .pipe(map((res) => res.data)),
      );
    } catch (err) {
      console.error(err);
      Logger.error(err, 'klaviyoProfileUpdate');
    }
  }

  async generateShortLink(link: string) {
    const URL = '/links/public';
    const apiUrl = `${this.configService.get('SHORT_LINK_BASE_URL')}${URL}`;
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.configService.get('SHORT_LINK_PUBLIC_KEY'),
      },
    };
    const body = JSON.stringify({
      allowDuplicates: true,
      domain: 'group.shop',
      originalURL: link,
      title: 'GroupShop',
    });
    try {
      const res = await lastValueFrom(
        this.httpService
          .post(apiUrl, body, options)
          .pipe(map((res) => res.data)),
      );
      return res?.shortURL;
    } catch (err) {
      console.error(err);
      Logger.error(err, KalavioService.name);
      return link;
    }
  }

  async generateQrCode(text: string) {
    try {
      return await qrcode.toDataURL(text);
    } catch (err) {
      console.error(err);
      Logger.error(err, KalavioService.name);
      return false;
    }
  }

  async getGroupdealByDate(date: string) {
    console.log('mdate : ' + date);
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          expiredAt: {
            $gte: new Date(`${date}${'T00:00:01'}`),
            $lte: new Date(`${date}${'T23:59:59'}`),
          },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'members.orderId',
          foreignField: 'id',
          as: 'orders',
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'campaignId',
          foreignField: 'id',
          as: 'campaigns',
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'storeId',
          foreignField: 'id',
          as: 'stores',
        },
      },
    ];
    const result = await manager.aggregate(Groupshops, agg).toArray();
    return result;
  }
}
