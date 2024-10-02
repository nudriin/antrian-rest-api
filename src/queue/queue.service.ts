import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
    QueueAggregateResponse,
    QueueResponse,
    QueueSaveRequest,
    QueueTotalStats,
} from '../model/queue.model';
import { ValidationService } from '../common/validation.service';
import { QueueValidation } from './queue.validation';
import { User } from '@prisma/client';
import { DatesService } from '../common/dates.service';
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class QueueService {
    private timeZone = 'Asia/Jakarta'; // Sesuaikan dengan zona waktu Anda
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
        private datesService: DatesService,
    ) {}

    private getZonedDate(): Date {
        return toZonedTime(new Date(), this.timeZone);
    }

    // * User View
    async countTotalQueueByDateAndLocket(
        locketId: number,
    ): Promise<QueueAggregateResponse> {
        const validLocketId: number = this.validationService.validate(
            QueueValidation.GET,
            locketId,
        );

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validLocketId,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const today = this.datesService.getToday();
        const query = `%${today}%`;
        // * Destructuring array
        const field = await this.prismaService.$queryRaw<
            { total: number | undefined; locket_id: number | null }[]
        >`SELECT count(id) as total, locket_id FROM queue WHERE createdAt LIKE ${query} AND locket_id = ${validLocketId} GROUP BY locket_id`; // * Get total queue by date and locket id
        // * access total in array'

        console.log(field);

        if (field.length === 0) {
            return {
                total: 0,
                locket_id: 0,
            };
        }

        return {
            total: Number(field[0].total),
            locket_id: field[0].locket_id,
        };
    }

    // * for save queue
    async findLastQueueByDateAndLocket(locketId: number): Promise<number> {
        const validLocketId: number = this.validationService.validate(
            QueueValidation.GET,
            locketId,
        );

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validLocketId,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const today = this.datesService.getToday();
        const query = `%${today}%`;
        const [field] = await this.prismaService.$queryRaw<
            { max: number }[]
        >`SELECT max(queue_number) as max FROM queue WHERE createdAt LIKE ${query} AND locket_id = ${validLocketId}`; // * Get last added queue_number23

        return Number(field.max);
    }

    async save(request: QueueSaveRequest, user: User): Promise<QueueResponse> {
        this.logger.info(`save queue ${request}`);

        const validRequest: QueueSaveRequest = this.validationService.validate(
            QueueValidation.SAVE,
            request,
        ) as QueueSaveRequest;

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validRequest.locket_id,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const lastQueueNumber = await this.findLastQueueByDateAndLocket(
            validRequest.locket_id,
        );

        const queue = await this.prismaService.queue.create({
            data: {
                queue_number: lastQueueNumber + 1,
                locket_id: validRequest.locket_id,
                user_id: user.id,
            },
        });

        const parseId: number =
            typeof queue.id === 'bigint' ? Number(queue.id) : queue.id;

        return {
            id: parseId,
            createdAt: queue.createdAt,
            queue_number: queue.queue_number,
            status: queue.status,
            updatedAt: queue.updatedAt,
            locket_id: queue.locket_id,
            user_id: queue.user_id,
        };
    }

    // * Locket View
    async findCurrentQueue(locketId: number): Promise<QueueAggregateResponse> {
        this.logger.info(`Find current queue of locket ${locketId}`);
        const validLocketId: number = this.validationService.validate(
            QueueValidation.GET,
            locketId,
        );

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validLocketId,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const today = this.datesService.getToday();
        const query = `%${today}%`;
        const currentQueue = await this.prismaService.$queryRaw<
            { queue_number: number }[] | []
        >`SELECT queue_number FROM queue WHERE createdAt LIKE ${query} AND status = "DONE" AND locket_id = ${validLocketId} ORDER BY updatedAt DESC LIMIT 1`;

        console.log(currentQueue);
        return {
            currentQueue:
                currentQueue.length > 0 ? currentQueue[0].queue_number : 0,
            locket_id: validLocketId,
        };
    }

    async findNextQueue(locketId: number): Promise<QueueAggregateResponse> {
        this.logger.info(`Find next queue on locket ${locketId}`);

        const validLocketId: number = this.validationService.validate(
            QueueValidation.GET,
            locketId,
        );

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validLocketId,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const today = this.datesService.getToday();
        const query = `%${today}%`;
        const nextQueue = await this.prismaService.$queryRaw<
            { queue_number: number }[] | []
        >`SELECT queue_number FROM queue WHERE createdAt LIKE ${query} AND status = "UNDONE" AND locket_id = ${validLocketId} ORDER BY queue_number ASC LIMIT 1`;

        return {
            nextQueue: nextQueue.length > 0 ? nextQueue[0].queue_number : 0,
            locket_id: validLocketId,
        };
    }

    async findRemainderQueue(
        locketId: number,
    ): Promise<QueueAggregateResponse> {
        this.logger.info(`Find remainder queue on locket ${locketId}`);

        const validLocketId: number = this.validationService.validate(
            QueueValidation.GET,
            locketId,
        );

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validLocketId,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const today = this.datesService.getToday();
        const query = `%${today}%`;
        const [field] = await this.prismaService.$queryRaw<
            { remain: number }[]
        >`SELECT COUNT(id) as remain FROM queue WHERE createdAt LIKE ${query} AND status = "UNDONE" AND locket_id = ${validLocketId}`;

        return {
            queueRemainder: Number(field.remain),
            locket_id: validLocketId,
        };
    }

    async updateQueue(queueId: number): Promise<QueueResponse> {
        this.logger.info(`Update queue id : ${queueId}`);

        const validQueueId: number = this.validationService.validate(
            QueueValidation.GET,
            queueId,
        ) as number;

        const queue = await this.prismaService.queue.findFirst({
            where: {
                id: BigInt(validQueueId),
            },
        });

        if (!queue) {
            throw new HttpException('queue not found', 404);
        }

        const updatedDate = this.datesService.getTodayWithTime();
        const status = 'DONE';

        const response = await this.prismaService.queue.update({
            where: {
                id: validQueueId,
            },
            data: {
                updatedAt: updatedDate,
                status: status,
            },
        });

        const parseId: number =
            typeof response.id === 'bigint' ? Number(response.id) : response.id;

        return {
            id: parseId,
            createdAt: response.createdAt,
            queue_number: response.queue_number,
            status: response.status,
            updatedAt: response.updatedAt,
            locket_id: response.locket_id,
            user_id: response.user_id,
        };
    }

    async findAllQueue(locketId: number): Promise<QueueResponse[]> {
        this.logger.info(`Find remainder queue on locket ${locketId}`);

        const validLocketId: number = this.validationService.validate(
            QueueValidation.GET,
            locketId,
        );

        const locketCount = await this.prismaService.locket.count({
            where: {
                id: validLocketId,
            },
        });

        if (locketCount == 0) {
            throw new HttpException('locket not found', 404);
        }

        const today = this.datesService.getToday();
        const query = `%${today}%`;
        const queues = await this.prismaService.$queryRaw<
            QueueResponse[]
        >`SELECT * FROM queue WHERE createdAt LIKE ${query} AND locket_id = ${validLocketId} ORDER BY id DESC`;

        if (!queues) {
            throw new HttpException('locket not found', 404);
        }

        const filteredQueue = queues.filter((value) => {
            if (typeof value.id === 'bigint') {
                value.id = Number(value.id);
            }

            return value;
        });

        return filteredQueue;
    }

    async findAllQueueToday(): Promise<number> {
        const now = this.getZonedDate();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        return this.prismaService.queue.count({
            where: {
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });
    }

    async findAllQueueThisWeek(): Promise<number> {
        const now = this.getZonedDate();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mulai dari Senin
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        return this.prismaService.queue.count({
            where: {
                createdAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
        });
    }

    async findAllQueueThisMonth(): Promise<number> {
        const now = this.getZonedDate();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        return this.prismaService.queue.count({
            where: {
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });
    }

    async findAllQueueThisSemester(): Promise<number> {
        const now = this.getZonedDate();
        const semesterEnd = now;
        const semesterStart = subMonths(semesterEnd, 6);

        return this.prismaService.queue.count({
            where: {
                createdAt: {
                    gte: semesterStart,
                    lte: semesterEnd,
                },
            },
        });
    }

    async findQueueStatistics(): Promise<QueueTotalStats> {
        const [totalToday, totalWeek, totalMonth, totalSemester] =
            await Promise.all([
                this.findAllQueueToday(),
                this.findAllQueueThisWeek(),
                this.findAllQueueThisMonth(),
                this.findAllQueueThisSemester(),
            ]);

        return {
            totalToday,
            totalWeek,
            totalMonth,
            totalSemester,
        };
    }
}
