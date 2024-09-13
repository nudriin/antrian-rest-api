import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src/common/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TestService {
    constructor(private prismaService: PrismaService) {}

    async deleteUser() {
        const user = await this.prismaService.user.findFirst({
            where: {
                email: 'test@test.com',
            },
        });

        await this.prismaService.queue.deleteMany({
            where: {
                user_id: user.id,
            },
        });
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

    async createUser() {
        await this.prismaService.user.create({
            data: {
                email: 'test@test.com',
                password: await bcrypt.hash('test', 10),
                name: 'test',
            },
        });
    }

    async createSuperAdmin() {
        await this.prismaService.user.create({
            data: {
                email: 'test@superadmin.com',
                password: await bcrypt.hash('test', 10),
                name: 'test',
                role: 'SUPER_ADMIN',
            },
        });
    }

    async createLocket() {
        await this.prismaService.locket.create({
            data: {
                name: 'test',
            },
        });
    }

    async deleteLocket() {
        await this.prismaService.locket.deleteMany({
            where: {
                name: 'test',
            },
        });
    }
}
