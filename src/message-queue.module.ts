import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { QUEUE_MODULE_OPTIONS } from './constants/message-queue.constants';
import { SQSQueueHandler } from './services/message-queue.handler';
import { SQSQueueService } from './services/message-queue.service';
import { SQSModuleAsyncOptions, SQSModuleOptions } from './types/message-queue.types';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [SQSQueueHandler, SQSQueueService],
  exports: [SQSQueueService],
})
export class SQSQueueModule {
  static forRoot(options: SQSModuleOptions): DynamicModule {
    return {
      module: SQSQueueModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: QUEUE_MODULE_OPTIONS,
          useValue: options,
        },
        SQSQueueHandler,
        SQSQueueService,
      ],
      exports: [SQSQueueService],
      global: true,
    };
  }

  static forRootAsync(options: SQSModuleAsyncOptions): DynamicModule {
    return {
      module: SQSQueueModule,
      imports: [DiscoveryModule, ...(options.imports || [])],
      providers: [
        {
          provide: QUEUE_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        SQSQueueHandler,
        SQSQueueService,
      ],
      exports: [SQSQueueService],
      global: true,
    };
  }
}
