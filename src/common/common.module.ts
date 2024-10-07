import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ValidationService } from './validation.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error.filter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './auth.middleware';
import { DatesService } from './dates.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseBackupService } from './db-backup.service';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            format: winston.format.json(),
            transports: new winston.transports.Console(),
        }),
        JwtModule.register({
            global: true,
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
    ],
    providers: [
        PrismaService,
        ValidationService,
        DatesService,
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        },
        DatabaseBackupService,
    ],
    exports: [
        PrismaService,
        ValidationService,
        DatesService,
        DatabaseBackupService,
    ],
})
export class CommonModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes('/api/*');
    }
}
