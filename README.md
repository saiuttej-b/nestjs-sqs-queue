<div align="center" style="margin-top: 1rem">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS SQS Queue</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

### Installation

Install via NPM:

```bash
npm install @saiuttej/nestjs-sqs-queue
```

Install via Yarn:

```bash
yarn add @saiuttej/nestjs-sqs-queue
```

Install via PNPM:

```bash
pnpm add @saiuttej/nestjs-sqs-queue
```

## Quick Start

### Register Module

```ts
@Module({
  imports: [
    SQSQueueModule.forRoot({
      queues: [],
    }),
  ],
})
class AppModule {}
```

Quite often you might want to asynchronously pass module options instead of passing them beforehand. In such case, use forRootAsync() method like many other Nest.js libraries.

```ts
@Module({
  imports: [
    SQSQueueModule.forRootAsync({
      useFactory: (...deps) => {
        return {
          clients: [],
        };
      },
      inject: [...dependencies],
    }),
  ],
})
class AppModule {}
```

### Module Configuration

```ts
import { Module } from '@nestjs/common';
import { QueueExecutionType, SQSQueueModule } from '@saiuttej/nestjs-sqs-queue';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    SQSQueueModule.forRoot({
      queues: [
        {
          key: 'unique-key-for-queue',
          queue: {
            accountId: 'aws-account-id',
            queueName: 'queue-name',
            region: 'aws-region',
          },
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- `key`\* - Unique key for the queue, used to identify the queue, should be unique across all queues in the application.
- `queue`\* - Queue configuration object
  - `accountId`\* - AWS Account ID
  - `queueName`\* - SQS Queue Name
  - `region`\* - AWS Region
  - `useQueueUrlAsEndpoint` - Use Queue URL as endpoint for producer and consumer
- `sqsConfig` - AWS SQSClient constructor options,
- `autoCreateQueue` - Auto create queue if not exists (default: false)
- `consumerOptions` - AWS SQSConsumer options
- `producerOptions` - AWS SQSProducer options
- `executionTypes` - Execution types (default: [QueueExecutionType.RECEIVE, QueueExecutionType.SEND])

### Producer

```ts
import { Injectable } from '@nestjs/common';
import { SQSQueueService } from '@saiuttej/nestjs-sqs-queue';

@Injectable()
export class AppService {
  constructor(private readonly sqsQueueService: SQSQueueService) {}

  async sendMessage() {
    await this.sqsQueueService.send('unique-key-for-queue', {
      id: '123',
      body: 'message-body',
    });
  }
}
```

SQSQueueService provides the send method to send messages to the queue.
`send` method takes two arguments:

- `key`\* - Unique key for the queue
- `message`\* - It can be a String, Message Object, or Array of Message Objects or Strings

### Consumer

#### Processing a single message

```ts
import { Injectable } from '@nestjs/common';
import { OnQueueMessage } from '@saiuttej/nestjs-sqs-queue';

@Injectable()
export class AppService {
  @OnQueueMessage({ key: 'my-sqs-queue' })
  async queueHandler(message: Message) {
    console.log(message);
  }
}
```

#### Processing multiple messages

```ts
import { Injectable } from '@nestjs/common';
import { OnQueueMessage } from '@saiuttej/nestjs-sqs-queue';

@Injectable()
export class AppService {
  @OnQueueMessage({ key: 'my-sqs-queue', batch: true })
  async queueHandler(messages: Message[]) {
    console.log(messages);
  }
}
```

OnQueueMessage decorator is used to listen to messages from the queue.
`OnQueueMessage` decorator takes an object with the following properties:

- `key`\* - Unique key for the queue
- `batch` - Boolean value to indicate whether to process messages in batch or not (default: false)

Note:
Only one handler can be registered for a queue key.

## Contributing

Contributions welcome! See [Contributing](https://github.com/saiuttej-b/nestjs-sqs-queue/blob/main/CONTRIBUTING.md).

## Author

**B Sai Uttej**

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
