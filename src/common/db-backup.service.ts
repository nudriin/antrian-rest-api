import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as compress from 'compressing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class DatabaseBackupService {
    private readonly logger = new Logger(DatabaseBackupService.name);
    private readonly execPromise = promisify(exec);

    constructor(
        private configService: ConfigService,
        private emailService: EmailService,
        private prismaService: PrismaService,
    ) {}

    // @Cron('*/1 * * * *') // every 1 minutes
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleDatabaseBackup() {
        try {
            // Dapatkan tanggal untuk nama file
            const date = new Date().toISOString().split('T')[0];

            // Buat direktori backup jika belum ada
            const backupDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }

            // Nama file backup
            const fileName = `backup-${date}.sql`;
            const filePath = path.join(backupDir, fileName);
            const compressedFilePath = `${filePath}.gz`;

            // Dapatkan konfigurasi database dari environment variables
            const dbHost = this.configService.get<string>(
                'DATABASE_HOST',
                'localhost',
            );
            const dbPort = this.configService.get<string>(
                'DATABASE_PORT',
                '3306',
            );
            const dbUser = this.configService.get<string>('DATABASE_USER');
            const dbPassword =
                this.configService.get<string>('DATABASE_PASSWORD');
            const dbName = this.configService.get<string>('DATABASE_NAME');

            if (!dbUser || !dbPassword || !dbName) {
                throw new Error('Database configuration is missing');
            }

            // Command untuk backup menggunakan mysqldump
            const command = `mysqldump \
            --host=${dbHost} \
            --port=${dbPort} \
            --user=${dbUser} \
            --password=${dbPassword} \
            --databases ${dbName} \
            --result-file=${filePath} \
            --skip-comments \
            --single-transaction \
            --quick`;

            // Eksekusi command backup
            await this.execPromise(command);

            // Kompres file backup
            await this.compressBackup(filePath, compressedFilePath);

            // Hapus file SQL yang tidak terkompres
            fs.unlinkSync(filePath);

            this.logger.log(`Database backup berhasil dibuat: ${fileName}.gz`);

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
                await this.emailService.sendBackupEmail(
                    adminEmails,
                    compressedFilePath,
                    date,
                );
            }

            // Hapus backup yang lebih lama dari 30 hari
            this.cleanOldBackups(backupDir, 30);
        } catch (error) {
            this.logger.error('Backup database gagal:', error);
            throw error;
        }
    }

    private async compressBackup(
        inputFile: string,
        outputFile: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            compress.gzip
                .compressFile(inputFile, outputFile)
                .then(() => {
                    this.logger.log('File backup berhasil dikompres');
                    resolve();
                })
                .catch((error) => {
                    this.logger.error('Gagal mengkompres file backup:', error);
                    reject(error);
                });
        });
    }

    private async cleanOldBackups(backupDir: string, daysToKeep: number) {
        const files = fs.readdirSync(backupDir);
        const now = new Date().getTime();

        for (const file of files) {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const fileAge =
                (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

            if (fileAge > daysToKeep) {
                fs.unlinkSync(filePath);
                this.logger.log(`Menghapus backup lama: ${file}`);
            }
        }
    }

    // Method untuk restore database (opsional)
    async restoreDatabase(backupFile: string) {
        try {
            const dbHost = this.configService.get<string>(
                'DATABASE_HOST',
                'localhost',
            );
            const dbPort = this.configService.get<string>(
                'DATABASE_PORT',
                '3306',
            );
            const dbUser = this.configService.get<string>('DATABASE_USER');
            const dbPassword =
                this.configService.get<string>('DATABASE_PASSWORD');
            const dbName = this.configService.get<string>('DATABASE_NAME');

            if (!dbUser || !dbPassword || !dbName) {
                throw new Error('Database configuration is missing');
            }

            // Jika file dalam format .gz, decompress terlebih dahulu
            let fileToRestore = backupFile;
            if (backupFile.endsWith('.gz')) {
                fileToRestore = backupFile.replace('.gz', '');
                await compress.gzip.uncompress(backupFile, fileToRestore);
            }

            const command = `mysql \
                            --host=${dbHost} \
                            --port=${dbPort} \
                            --user=${dbUser} \
                            --password=${dbPassword} \
                            ${dbName} < ${fileToRestore}`;

            await this.execPromise(command);
            this.logger.log('Database berhasil direstore');

            // Hapus file temporary jika ada dekompresi
            if (backupFile.endsWith('.gz')) {
                fs.unlinkSync(fileToRestore);
            }
        } catch (error) {
            this.logger.error('Restore database gagal:', error);
            throw error;
        }
    }
}
