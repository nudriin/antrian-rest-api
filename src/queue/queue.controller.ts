import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { WebResponse } from '../model/web.model';
import {
    QueueAggregateResponse,
    QueueResponse,
    QueueSaveRequest,
} from '../model/queue.model';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from '@prisma/client';

@Controller('/api/queue')
export class QueueController {
    constructor(private queueService: QueueService) {}

    @Post()
    @HttpCode(200)
    async saveQueue(
        @Body() request: QueueSaveRequest,
        @AuthUser() user: User,
    ): Promise<WebResponse<QueueResponse>> {
        const result = await this.queueService.save(request, user);

        return {
            data: result,
        };
    }

    @Get('/:locketId/total')
    @HttpCode(200)
    async getTotalTodayQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result =
            await this.queueService.countTotalQueueByDateAndLocket(locketId);

        return {
            data: {
                total: Number(result),
            },
        };
    }

    @Get('/:locketId/current')
    @HttpCode(200)
    async getCurrentQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result = await this.queueService.findCurrentQueue(locketId);

        return {
            data: {
                currentQueue: result,
            },
        };
    }

    @Get('/:locketId/next')
    @HttpCode(200)
    async getNextQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result = await this.queueService.findNextQueue(locketId);

        return {
            data: {
                nextQueue: result,
            },
        };
    }
}
