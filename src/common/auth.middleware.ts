import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}
    async use(req: any, res: any, next: (error?: Error | any) => void) {
        const authorization = req.headers['authorization'] as string;

        if (authorization) {
            try {
                const token = authorization.split(' ')[1];

                const payload = this.jwtService.verify(token, {
                    secret: this.configService.get<string>('JWT_SECRET'),
                });

                const user = await this.prismaService.user.findUnique({
                    where: {
                        id: payload.id,
                    },
                });

                if (user) {
                    req.user = user;
                }
            } catch (error) {
                console.log('Catch Error', error);
            }
        }

        next();
    }
}
