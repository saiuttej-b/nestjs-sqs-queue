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
) => void | Promise<void>;

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

  /**
   * It a function which is used to format or convert the sqs message into the desired format.
   */
  messageFormatter?: (message: Message | Message[]) => unknown | Promise<unknown>;
};

/**
 * Sqs producer options
 */
type SQSProducerConfig = Omit<
  ProducerOptions,
  'queueUrl' | 'sqs' | 'region' | 'useQueueUrlAsEndpoint'
>;

type CustomProducerConfig = {
  /**
   * It a function which is used to format or convert the message into the desired format.
   */
  messageFormatter?: (
    message: string | PMessage | (string | PMessage)[],
  ) =>
    | string
    | PMessage
    | (string | PMessage)[]
    | Promise<string | PMessage | (string | PMessage)[]>;
};

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
  producerOptions?: SQSProducerConfig & CustomProducerConfig;
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
