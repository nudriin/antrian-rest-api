import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';

@Module({
    providers: [QueueService, QueueGateway],
    controllers: [QueueController],
    exports: [QueueGateway],
})
export class QueueModule {}
