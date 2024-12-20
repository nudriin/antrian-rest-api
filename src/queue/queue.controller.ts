import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { WebResponse } from '../model/web.model';
import {
    QueueAggregateResponse,
    QueueDistributionByLocket,
    QueueResponse,
    QueueSaveRequest,
    QueueStatsByLocketLastMonth,
    QueueTotalStats,
} from '../model/queue.model';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from '@prisma/client';
import { LocketAdmin } from '../common/locket-admin.decorator';

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

    @Get('/locket/:locketId')
    @HttpCode(200)
    async findAllQueueByLocket(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueResponse[]>> {
        const result = await this.queueService.findAllQueue(locketId);

        return {
            data: result,
        };
    }

    @Get('/locket/:locketId/total')
    @HttpCode(200)
    async getTotalTodayQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result =
            await this.queueService.countTotalQueueByDateAndLocket(locketId);

        return {
            data: result,
        };
    }

    @Get('/locket/:locketId/current')
    @HttpCode(200)
    async getCurrentQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result = await this.queueService.findCurrentQueue(locketId);

        return {
            data: result,
        };
    }

    @Get('/locket/:locketId/next')
    @HttpCode(200)
    async getNextQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result = await this.queueService.findNextQueue(locketId);

        return {
            data: result,
        };
    }

    @Get('/locket/:locketId/remain')
    @HttpCode(200)
    async getRemainQueue(
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<QueueAggregateResponse>> {
        const result = await this.queueService.findRemainderQueue(locketId);

        return {
            data: result,
        };
    }

    @Patch('/:queueId')
    @HttpCode(200)
    async updateQueue(
        @LocketAdmin() locketAdmin: User,
        @Param('queueId', ParseIntPipe) queueId: number,
    ): Promise<WebResponse<QueueResponse>> {
        const result = await this.queueService.updateQueue(queueId);

        return {
            data: result,
        };
    }

    @Get('/all/statistics')
    @HttpCode(200)
    async getAllTotalTodayQueue(): Promise<WebResponse<QueueTotalStats>> {
        const result = await this.queueService.findQueueStatistics();

        return {
            data: result,
        };
    }

    @Get('/all/daily-queue-last-mounth')
    @HttpCode(200)
    async getDailyQueueCountLastMonth(): Promise<WebResponse<any[]>> {
        const result = await this.queueService.findDailyQueueCountLastMonth();

        return {
            data: result,
        };
    }

    @Get('/all/queue-distribution-locket')
    @HttpCode(200)
    async getQueueDistributionByLocket(): Promise<
        WebResponse<QueueDistributionByLocket[]>
    > {
        const result = await this.queueService.findQueueDistributionByLocket();

        return {
            data: result,
        };
    }

    @Get('/all/queue-stats-last-month')
    @HttpCode(200)
    async getDailyQueueCountByLocketLastMonth(): Promise<
        WebResponse<QueueStatsByLocketLastMonth>
    > {
        const result =
            await this.queueService.findDailyQueueCountByLocketLastMonth();

        return {
            data: result,
        };
    }

    @Get('/all/queue-stats-last-six-month')
    @HttpCode(200)
    async getDailyQueueCountByLocketLastSixMonth(): Promise<
        WebResponse<QueueStatsByLocketLastMonth>
    > {
        const result =
            await this.queueService.findDailyQueueCountByLocketLast6Month();

        return {
            data: result,
        };
    }

    @Get('/all/queue-stats-all-time')
    @HttpCode(200)
    async getDailyQueueCountByLocketAllTime(): Promise<
        WebResponse<QueueStatsByLocketLastMonth>
    > {
        const result =
            await this.queueService.findDailyQueueCountByLocketAllTime();

        return {
            data: result,
        };
    }

    @Get('/locket/:locketId/reset')
    @HttpCode(200)
    async resetQueueByLocketId(
        @LocketAdmin() locketAdmin: User,
        @Param('locketId', ParseIntPipe) locketId: number,
    ): Promise<WebResponse<string>> {
        await this.queueService.resetQueueByLocketId(locketId, locketAdmin);

        return {
            data: 'OK',
        };
    }

    @Patch('/:queueId/pending')
    @HttpCode(200)
    async pendingQueue(
        @LocketAdmin() locketAdmin: User,
        @Param('queueId', ParseIntPipe) queueId: number,
    ): Promise<WebResponse<QueueResponse>> {
        const result = await this.queueService.pendingQueue(queueId);

        return {
            data: result,
        };
    }
}
