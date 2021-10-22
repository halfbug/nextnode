import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from '../events/token-received.event';

@Injectable()
export class TokenReceivedListener {
  @OnEvent('token.received')
  handleOrderCreatedEvent(event: TokenReceivedEvent) {
    // handle and process "AppValidatedListener " event
    console.log(event);
  }
}
