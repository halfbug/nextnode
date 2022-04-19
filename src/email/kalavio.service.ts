import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { getMongoManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';

@Injectable()
export class KalavioService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  sendKlaviyoEmail(body) {
    const urlKlaviyo = this.configService.get('KLAVIYO_TRACK_URL');
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    this.httpService.post(urlKlaviyo, body, options).subscribe(async (res) => {
      //console.log(res);
    });
  }

  async getGroupdealByDate(date: string) {
    console.log('mdate : ' + date);
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          expiredAt: {
            $gte: new Date(date + 'T00:00:01.654Z'),
            $lt: new Date(date + 'T23:59:59.654Z'),
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
