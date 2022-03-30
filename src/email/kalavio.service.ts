import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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
      console.log(res);
    });
  }
}
