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
            throw new HttpException('duplicate locket', 400);
        }

        const locket = await this.prismaService.locket.create({
            data: validRequest,
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
        });

        return {
            id: locket.id,
            name: locket.name,
            created_at: locket.createdAt,
        };
    }
}
