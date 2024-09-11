import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ValidationService } from './validation.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error.filter';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            format: winston.format.json(),
            transports: new winston.transports.Console(),
        }),
    ],
    providers: [
        PrismaService,
        ValidationService,
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        },
    ],
    exports: [PrismaService, ValidationService],
})
export class CommonModule {}
