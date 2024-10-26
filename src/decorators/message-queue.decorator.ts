import { SetMetadata } from '@nestjs/common';
import { QUEUE_EXECUTION_METHOD } from '../constants/message-queue.constants';
import { MessageQueueExecutionMethodProps } from '../types/message-queue.types';

export const OnQueueMessage = (props: MessageQueueExecutionMethodProps) => {
  return SetMetadata(QUEUE_EXECUTION_METHOD, props);
};
