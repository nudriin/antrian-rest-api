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
    QueueResponse,
    QueueSaveRequest,
    QueueTotalLocketResponse,
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
    ): Promise<WebResponse<QueueTotalLocketResponse>> {
        const result =
            await this.queueService.countTotalQueueByDateAndLocket(locketId);

        console.log(`Result= ${result}`);
        return {
            data: {
                total: Number(result),
            },
        };
    }
}
