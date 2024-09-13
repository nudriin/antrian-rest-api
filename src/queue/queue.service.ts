import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as moment from 'moment';
import { QueueResponse, QueueSaveRequest } from '../model/queue.model';
import { ValidationService } from '../common/validation.service';
import { QueueValidation } from './queue.validation';
import { User } from '@prisma/client';

@Injectable()
export class QueueService {
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
    ) {}

    async countTotalQueueByDateAndLocket(locketId: number): Promise<number> {
        const today = moment().format().slice(0, 10);
        const query = `%${today}%`;
        // * Destructuring array
        const [field] = await this.prismaService.$queryRaw<
            { total: number }[]
        >`SELECT count(id) as total FROM queue WHERE createdAt LIKE ${query} AND locket_id = ${locketId}`; // * Get total queue by date and locket id
        // * access total in array
        return Number(field.total);
    }

    async findLastQueueByDateAndLocket(locketId: number): Promise<number> {
        const today = moment().format().slice(0, 10);
        const query = `%${today}%`;
        const [field] = await this.prismaService.$queryRaw<
            { max: number }[]
        >`SELECT max(queue_number) as max FROM queue WHERE createdAt LIKE ${query} AND locket_id = ${locketId}`; // * Get last added queue_number23

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
}
