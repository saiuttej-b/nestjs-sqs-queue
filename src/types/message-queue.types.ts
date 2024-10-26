import type { Message, SQSClientConfigType } from '@aws-sdk/client-sqs';
import type { ConsumerOptions } from 'sqs-consumer';
import type { Message as ProducerMessage, ProducerOptions } from 'sqs-producer';

export type MessageQueueExecutionMethodProps = {
  key: string;
  batch?: boolean;
};

export enum QueueExecutionType {
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
}

export type PMessage = ProducerMessage;

/**
 * Sqs consumer options
 */
export type ProcessMessageWrapperFn = (
  messages: Message | Message[],
  exec: () => Promise<Message | Message[] | void>,
) => Promise<Message | Message[] | void>;

type SQSConsumerConfig = Omit<
  ConsumerOptions,
  'queueUrl' | 'sqs' | 'region' | 'useQueueUrlAsEndpoint' | 'handleMessage' | 'handleMessageBatch'
>;

type CustomConsumerConfig = {
  /**
   * It is custom function that wraps the message handler function.
   * It receives the message(s) and a function to execute the message handler.
   * It generally acts as a Interceptor for the message handler.
   *
   * @param {Message | Message[]} messages - The message or messages received from the sqs queue
   * @param {() => Promise<Message | Message[] | void>} exec - The function to execute the message handler
   * @returns {Promise<Message | Message[] | void>} The result of the message handler
   */
  processMessageWrapperCallback?: ProcessMessageWrapperFn;
};

/**
 * Sqs producer options
 */
type SQSProducerConfig = Omit<
  ProducerOptions,
  'queueUrl' | 'sqs' | 'region' | 'useQueueUrlAsEndpoint'
>;

export type QueueOptions = {
  key: string;
  queue: {
    region: string;
    accountId: string;
    queueName: string;
    useQueueUrlAsEndpoint?: boolean;
  };
  sqsConfig?: SQSClientConfigType;
  autoCreateQueue?: boolean;
  executionTypes?: QueueExecutionType[];
  consumerOptions?: SQSConsumerConfig & CustomConsumerConfig;
  producerOptions?: SQSProducerConfig;
};

export type SQSModuleOptions = {
  queues: QueueOptions[];
  sqsConfig?: SQSClientConfigType;
  autoCreateQueue?: boolean;
  abortPollingWhenStopping?: boolean;
};

export type SQSModuleAsyncOptions = {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<SQSModuleOptions>;
  inject?: any[];
};
