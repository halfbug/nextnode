import { Controller, Post, Req, Res } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  @Post('products')
  bulkProducts(@Req() req, @Res() res) {
    console.log('webhook calledddddddddddddddddddddddddddddddd');
    console.log(JSON.stringify(req.body));
    res.send(req.body);
  }
}
