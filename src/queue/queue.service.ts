import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
    QueueAggregateResponse,
    QueueDistributionByLocket,
    QueueResponse,
    QueueSaveRequest,
    QueueStatsByLocketLastMonth,
    QueueTotalStats,
} from '../model/queue.model';
import { ValidationService } from '../common/validation.service';
import { QueueValidation } from './queue.validation';
import { User } from '@prisma/client';
import { DatesService } from '../common/dates.service';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
    subDays,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { EmailService } from '../common/email.service';

@Injectable()
export class QueueService {
    private timeZone = 'Asia/Jakarta'; // Sesuaikan dengan zona waktu Anda
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
        private datesService: DatesService,
        private emailService: EmailService,
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
        const today = this.datesService.getToday();
        const query = `%${today}%`;
        // * Destructuring array
        const field = await this.prismaService.$queryRaw<
            { total: number | undefined }[]
        >`SELECT count(id) as total FROM queue WHERE createdAt LIKE ${query}`; // * Get total queue by date and locket id
        // * access total in array'

        console.log(field);

        if (field.length === 0) {
            return 0;
        }

        return Number(field[0].total);
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

    // Mendapatkan jumlah antrian per hari untuk 30 hari terakhir
    async findDailyQueueCountLastMonth(): Promise<any[]> {
        const endDate = new Date();
        const startDate = subDays(endDate, 30);
        // Menggunakan raw SQL query untuk mengambil data per hari
        const data = await this.prismaService.$queryRaw<
            { date: Date | undefined; count: bigint | null }[]
        >`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM queue
        WHERE createdAt >= ${startDate} AND createdAt <= ${endDate} AND status = "DONE"
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
        `;

        const mappedData = data.map((value) => {
            return {
                date: value.date,
                count: Number(value.count),
            };
        });

        return mappedData;
    }

    async findQueueDistributionByLocket(): Promise<
        QueueDistributionByLocket[]
    > {
        const data = await this.prismaService.$queryRaw<
            { locket: string | undefined; count: bigint | null }[]
        >`
        SELECT lk.name as locket, COUNT(que.queue_number) as count
        FROM queue as que
        JOIN lockets as lk ON (lk.id = que.locket_id)
        GROUP by locket
        `;

        const mappedData = data.map((value) => {
            return {
                locket: value.locket,
                count: Number(value.count),
            };
        });

        return mappedData;
    }

    async findDailyQueueCountByLocketLastMonth(): Promise<QueueStatsByLocketLastMonth> {
        const endDate = new Date();
        const startDate = subMonths(endDate, 1);

        const data = await this.prismaService.$queryRaw<
            {
                locket: string | undefined;
                date: Date | undefined;
                count: bigint | null;
            }[]
        >`
            SELECT lk.name AS locket, DATE(que.createdAt) AS date, COUNT(*) AS count
            FROM queue AS que
            JOIN lockets AS lk ON (lk.id = que.locket_id)
            WHERE que.createdAt >= ${startDate} AND que.createdAt <= ${endDate} AND status = "DONE"
            GROUP BY locket, DATE(que.createdAt)
            ORDER BY locket, date ASC
        `;

        const mappedData = data.reduce((acc, curr) => {
            const locketName = curr.locket || 'Unknown Locket'; // Handle missing locket names
            acc[locketName] = acc[locketName] || {};
            acc[locketName][curr.date.toISOString()] = Number(curr.count); // Use 'id-ID' locale for consistent date formatting
            return acc;
        }, {});

        return mappedData;
    }

    async findDailyQueueCountByLocketLast6Month(): Promise<QueueStatsByLocketLastMonth> {
        const endDate = new Date();
        const startDate = subMonths(endDate, 6);

        const data = await this.prismaService.$queryRaw<
            {
                locket: string | undefined;
                date: Date | undefined;
                count: bigint | null;
            }[]
        >`
            SELECT lk.name AS locket, DATE(que.createdAt) AS date, COUNT(*) AS count
            FROM queue AS que
            JOIN lockets AS lk ON (lk.id = que.locket_id)
            WHERE que.createdAt >= ${startDate} AND que.createdAt <= ${endDate} AND status = "DONE"
            GROUP BY locket, DATE(que.createdAt)
            ORDER BY locket, date ASC
        `;

        const mappedData = data.reduce((acc, curr) => {
            const locketName = curr.locket || 'Unknown Locket'; // Handle missing locket names
            acc[locketName] = acc[locketName] || {};
            acc[locketName][curr.date.toISOString()] = Number(curr.count); // Use 'id-ID' locale for consistent date formatting
            return acc;
        }, {});

        return mappedData;
    }

    async findDailyQueueCountByLocketAllTime(): Promise<QueueStatsByLocketLastMonth> {
        const data = await this.prismaService.$queryRaw<
            {
                locket: string | undefined;
                date: Date | undefined;
                count: bigint | null;
            }[]
        >`
            SELECT lk.name AS locket, DATE(que.createdAt) AS date, COUNT(*) AS count
            FROM queue AS que
            JOIN lockets AS lk ON (lk.id = que.locket_id)
            WHERE status = "DONE"
            GROUP BY locket, DATE(que.createdAt)
            ORDER BY locket, date ASC
        `;

        const mappedData = data.reduce((acc, curr) => {
            const locketName = curr.locket || 'Unknown Locket'; // Handle missing locket names
            acc[locketName] = acc[locketName] || {};
            acc[locketName][curr.date.toISOString()] = Number(curr.count); // Use 'id-ID' locale for consistent date formatting
            return acc;
        }, {});

        return mappedData;
    }

    // @Cron('*/1 * * * *') // every 1 minutes
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async autoExportDailyQueueCountByLocketLastMonth() {
        const data: QueueStatsByLocketLastMonth =
            await this.findDailyQueueCountByLocketLastMonth();
        try {
            const allDates = new Set<string>();
            Object.values(data).forEach((departmentData) => {
                Object.keys(departmentData).forEach((date) =>
                    allDates.add(date),
                );
            });

            const sortedDates = Array.from(allDates).sort();

            const worksheetData = [];

            const departments = Object.keys(data);
            worksheetData.push(['Tanggal', ...departments]);

            sortedDates.forEach((date) => {
                const row = [this.formatDate(date)];
                departments.forEach((dept) => {
                    row.push((data[dept][date] || 0).toString());
                });
                worksheetData.push(row);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            const colWidths = [15]; // Lebar untuk kolom tanggal
            departments.forEach(() => colWidths.push(10)); // Lebar untuk setiap departemen
            ws['!cols'] = colWidths.map((width) => ({ width }));

            XLSX.utils.book_append_sheet(wb, ws, 'Queue Report');

            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const fileName = `queue-report-${new Date().toISOString().split('T')[0]}.xlsx`;
            const filePath = path.join(tempDir, fileName);
            XLSX.writeFile(wb, filePath);

            const admins = await this.prismaService.user.findMany({
                where: {
                    role: 'SUPER_ADMIN',
                },
                select: {
                    email: true,
                },
            });

            if (admins.length !== 0) {
                // throw new Error('No super admin found in the system');
                const adminEmails = admins.map((admin) => admin.email);

                // Send the email
                //!  Send email
                await this.emailService.sendReportEmail(adminEmails, filePath);
            }

            fs.unlinkSync(filePath);

            this.logger.info('Report generated and sent successfully');
        } catch (error) {
            this.logger.error('Failed to generate and send report:', error);
        }
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    async resetQueueByLocketId(locketId: number, user: User): Promise<string> {
        this.logger.info(`Find current queue of locket ${locketId}`);

        const foundUser = await this.prismaService.user.findUnique({
            where: {
                id: user.id,
            },
        });

        if (!foundUser) {
            throw new HttpException('Forbidden', 403);
        }

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
        await this.prismaService
            .$queryRaw`DELETE FROM queue WHERE createdAt LIKE ${query} AND locket_id = ${validLocketId}`;
        return;
    }

    async pendingQueue(queueId: number): Promise<QueueResponse> {
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

        const response = await this.prismaService.queue.update({
            where: {
                id: validQueueId,
            },
            data: {
                updatedAt: updatedDate,
                status: 'PENDING',
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
}
