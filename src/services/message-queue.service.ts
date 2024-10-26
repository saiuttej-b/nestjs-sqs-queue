import { Injectable } from '@nestjs/common';
import { PMessage } from '../types/message-queue.types';
import { SQSQueueHandler } from './message-queue.handler';

@Injectable()
export class SQSQueueService {
  constructor(private readonly handler: SQSQueueHandler) {}

  async send(key: string, message: string | PMessage | (string | PMessage)[]) {
    return this.handler.send(key, message);
  }
}
