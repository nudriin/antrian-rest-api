import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ValidationService } from '../common/validation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../common/prisma.service';
import { UserRegisterRequest, UserResponse } from '../model/user.model';
import { UserValidation } from './user.validation';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ) {}

    async register(request: UserRegisterRequest): Promise<UserResponse> {
        this.logger.info(`Register new user ${JSON.stringify(request)}`);

        const validRequest: UserRegisterRequest =
            this.validationService.validate(
                UserValidation.REGISTER,
                request,
            ) as UserRegisterRequest;

        const totalUser = await this.prismaService.user.count({
            where: {
                email: validRequest.email,
            },
        });

        if (totalUser != 0) {
            throw new HttpException('user is exist', 400);
        }

        validRequest.password = await bcrypt.hash(validRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: validRequest,
        });

        return {
            email: user.email,
            name: user.name,
        };
    }
}
