import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src/common/prisma.service';
import * as bcrypt from 'bcrypt';
import { Locket, User } from '@prisma/client';

@Injectable()
export class TestService {
    constructor(private prismaService: PrismaService) {}

    async deleteUser() {
        const user = await this.prismaService.user.findFirst({
            where: {
                email: 'test@test.com',
            },
        });

        if (user) {
            await this.prismaService.queue.deleteMany({
                where: {
                    user_id: user.id,
                },
            });
        }

        await this.prismaService.user.deleteMany({
            where: {
                email: 'test@test.com',
            },
        });
    }

    async deleteSuperAdmin() {
        await this.prismaService.user.deleteMany({
            where: {
                email: 'test@superadmin.com',
            },
        });
    }

    async createUser(): Promise<User> {
        const user = await this.prismaService.user.create({
            data: {
                email: 'test@test.com',
                password: await bcrypt.hash('test', 10),
                name: 'test',
            },
        });

        return user;
    }

    async createSuperAdmin(): Promise<User> {
        const user = await this.prismaService.user.create({
            data: {
                email: 'test@superadmin.com',
                password: await bcrypt.hash('test', 10),
                name: 'test',
                role: 'SUPER_ADMIN',
            },
        });

        return user;
    }

    async createLocket(): Promise<Locket> {
        const locket = await this.prismaService.locket.create({
            data: {
                name: 'test',
            },
        });

        return locket;
    }

    async deleteLocket() {
        await this.prismaService.locket.deleteMany({
            where: {
                name: 'test',
            },
        });
    }
}
