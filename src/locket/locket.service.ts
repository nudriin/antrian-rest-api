import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LocketResponse, LocketSaveRequest } from '../model/locket.model';
import { LocketValidation } from './locket.validation';
import { ValidationService } from '../common/validation.service';

@Injectable()
export class LocketService {
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
    ) {}

    async save(request: LocketSaveRequest): Promise<LocketResponse> {
        this.logger.info(`Create locket with name ${request.name}`);

        const validRequest: LocketSaveRequest = this.validationService.validate(
            LocketValidation.SAVE,
            request,
        ) as LocketSaveRequest;

        const totalLocket = await this.prismaService.locket.count({
            where: {
                name: validRequest.name,
            },
        });

        if (totalLocket != 0) {
            throw new HttpException('duplicate locket name', 400);
        }

        const locket = await this.prismaService.locket.create({
            data: validRequest,
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
        });

        return locket;
    }

    async findAll(): Promise<LocketResponse[]> {
        const lockets = await this.prismaService.locket.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
        });

        if (!lockets) {
            throw new HttpException('locket not found', 404);
        }

        return lockets;
    }

    async findByName(locketName: string): Promise<LocketResponse> {
        const validRequest: string = this.validationService.validate(
            LocketValidation.FIND_NAME,
            locketName,
        ) as string;

        const locket = await this.prismaService.locket.findFirst({
            where: {
                name: validRequest,
            },
        });

        if (!locket) {
            throw new HttpException('locket not found', 404);
        }

        return locket;
    }

    async delete(locketId: number) {
        const validId: number = this.validationService.validate(
            LocketValidation.FIND_ID,
            locketId,
        ) as number;

        const locket = await this.prismaService.locket.findUnique({
            where: {
                id: validId,
            },
        });

        if (!locket) {
            throw new HttpException('locket not found', 404);
        }

        await this.prismaService.queue.deleteMany({
            where: {
                locket_id: validId,
            },
        });

        await this.prismaService.locket.delete({
            where: {
                id: validId,
            },
        });

        return;
    }

    async update(
        locketId: number,
        request: LocketSaveRequest,
    ): Promise<LocketResponse> {
        const validId: number = this.validationService.validate(
            LocketValidation.FIND_ID,
            locketId,
        ) as number;

        const validRequest: LocketSaveRequest = this.validationService.validate(
            LocketValidation.SAVE,
            request,
        ) as LocketSaveRequest;

        const locket = await this.prismaService.locket.findUnique({
            where: {
                id: validId,
            },
        });

        if (!locket) {
            throw new HttpException('locket not found', 404);
        }

        const updatedLocket = await this.prismaService.locket.update({
            where: {
                id: locket.id,
            },
            data: {
                name: validRequest.name,
            },
        });

        return updatedLocket;
    }
}
