import { CreateQueueCommand, Message, SQSClient } from '@aws-sdk/client-sqs';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer } from 'sqs-consumer';
import { Producer } from 'sqs-producer';
import { QUEUE_EXECUTION_METHOD, QUEUE_MODULE_OPTIONS } from '../constants/message-queue.constants';
import {
  MessageQueueExecutionMethodProps,
  PMessage,
  QueueExecutionType,
  QueueOptions,
  SQSModuleOptions,
} from '../types/message-queue.types';

type QueueProps = {
  options: QueueOptions;
  client: SQSClient;
  queueUrl: string;
  consumer?: Consumer;
  producer?: Producer;
};

@Injectable()
export class SQSQueueHandler implements OnModuleInit, OnModuleDestroy {
  private readonly queueMap: Map<string, QueueProps>;

  constructor(
    @Inject(QUEUE_MODULE_OPTIONS) private readonly options: SQSModuleOptions,
    private readonly discoveryService: DiscoveryService,
  ) {
    this.queueMap = new Map();
  }

  async onModuleInit() {
    await this.init();
  }

  async onModuleDestroy() {
    for (const queue of this.queueMap.values()) {
      if (queue.consumer) {
        queue.consumer.stop({ abort: this.options.abortPollingWhenStopping });
      }
    }
  }

  private async init() {
    /**
     * Check for duplicate queue keys
     */
    const keys = this.options.queues.map((queue) => queue.key);
    const duplicateKeys = keys.filter((v, i, list) => list.indexOf(v) !== i);
    if (duplicateKeys.length) {
      throw new Error(`Duplicate queue keys found: ${duplicateKeys.join(', ')}`);
    }

    /**
     * Checking for duplicate message handlers
     */
    const messageHandlers =
      await this.discoveryService.providerMethodsWithMetaAtKey<MessageQueueExecutionMethodProps>(
        QUEUE_EXECUTION_METHOD,
      );
    const handlers = messageHandlers.map((handler) => ({
      key: handler.meta.key,
      fn: handler.discoveredMethod.handler.bind(handler.discoveredMethod.parentClass.instance),
      props: handler.meta,
    }));
    const duplicateHandlers = handlers.filter(
      (v, i, list) => list.findIndex((h) => h.key === v.key) !== i,
    );
    if (duplicateHandlers.length) {
      throw new Error(
        `Duplicate message handlers found: ${duplicateHandlers.map((h) => h.key).join(', ')}`,
      );
    }

    /**
     * Check if all consumer queues have message handlers
     */
    const consumerQueues = this.options.queues.filter((queue) => {
      if (!queue.executionTypes) return true;
      return queue.executionTypes.includes(QueueExecutionType.RECEIVE);
    });
    const missing = consumerQueues.filter(
      (queue) => !handlers.find((handler) => handler.key === queue.key),
    );
    if (missing.length) {
      throw new Error(
        `Missing message handlers for queue keys: ${missing.map((h) => h.key).join(', ')}`,
      );
    }

    for (const queueOptions of this.options.queues) {
      const { queue } = queueOptions;

      const queueUrl = `https://sqs.${queue.region}.amazonaws.com/${queue.accountId}/${queue.queueName}`;

      const clientConfig = queueOptions.sqsConfig ?? this.options.sqsConfig;
      const client = clientConfig
        ? new SQSClient(clientConfig)
        : new SQSClient({
            region: queue.region,
            useQueueUrlAsEndpoint: queue.useQueueUrlAsEndpoint ?? true,
          });

      const queueProps: QueueProps = {
        options: queueOptions,
        client: client,
        queueUrl: queueUrl,
      };

      const autoCreateQueue = queueOptions.autoCreateQueue ?? this.options.autoCreateQueue ?? false;
      if (autoCreateQueue) {
        const createCommand = new CreateQueueCommand({
          QueueName: queue.queueName,
          Attributes: {
            ...(queue.queueName.endsWith('.fifo') && {
              FifoQueue: 'true',
            }),
          },
        });
        await client.send(createCommand);
      }

      if (
        !queueOptions.executionTypes ||
        queueOptions.executionTypes.includes(QueueExecutionType.SEND)
      ) {
        const producer = Producer.create({
          ...queueOptions.producerOptions,
          queueUrl: queueUrl,
          region: queue.region,
          sqs: client,
        });
        queueProps.producer = producer;
      }

      if (
        !queueOptions.executionTypes ||
        queueOptions.executionTypes.includes(QueueExecutionType.RECEIVE)
      ) {
        const consumerOptions = queueOptions.consumerOptions;

        const handler = handlers.find((h) => h.key === queueOptions.key);
        if (!handler) {
          throw new Error(`Missing message handler for queue key: ${queueOptions.key}`);
        }

        const handlerFn = async (message: Message | Message[]) => {
          const fn = async () => {
            return handler.fn(message);
          };

          if (!consumerOptions?.processMessageWrapperCallback) {
            return fn();
          }

          return consumerOptions.processMessageWrapperCallback(message, fn);
        };

        const consumer = Consumer.create({
          ...consumerOptions,
          queueUrl: queueUrl,
          region: queue.region,
          sqs: client,
          handleMessage: !handler.props.batch ? (message) => handlerFn(message) : undefined,
          handleMessageBatch: handler.props.batch ? (messages) => handlerFn(messages) : undefined,
        });
        queueProps.consumer = consumer;
      }

      this.queueMap.set(queueOptions.key, queueProps);
    }

    for (const queue of this.queueMap.values()) {
      if (queue.consumer) {
        queue.consumer.start();
      }
    }
  }

  async send(key: string, message: string | PMessage | (string | PMessage)[]) {
    const queue = this.queueMap.get(key);
    if (!queue) {
      throw new Error(`Queue with key ${key} not found`);
    }

    if (!queue.producer) {
      throw new Error(`Queue "${key}" is not configured to send messages`);
    }

    return queue.producer.send(message);
  }
}
