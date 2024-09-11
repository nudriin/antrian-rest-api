import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ValidationService } from './validation.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            format: winston.format.json(),
            transports: new winston.transports.Console(),
        }),
    ],
    providers: [PrismaService, ValidationService],
    exports: [PrismaService, ValidationService],
})
export class CommonModule {}
