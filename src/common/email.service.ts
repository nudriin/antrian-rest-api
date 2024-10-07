import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as path from 'path';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: true,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASSWORD'),
            },
        });
    }

    async sendBackupEmail(
        toEmails: string[],
        backupFilePath: string,
        date: string,
    ): Promise<void> {
        try {
            const emailContent = {
                from: this.configService.get<string>('SMTP_FROM_EMAIL'),
                to: toEmails.join(', '),
                subject: `Database Backup - ${date}`,
                text: `Database backup untuk ${date} sudah di lampirkan.`,
                html: `
                    <h2>Database Backup</h2>
                    <p>Halo Admin,</p>
                    <p>Database backup untuk tanggal ${date} telah selesai dibuat.</p>
                    <p>File backup terlampir pada email ini.</p>
                    <p>Terimakasih,<br>Backup System</p>
                    `,
                attachments: [
                    {
                        filename: path.basename(backupFilePath),
                        path: backupFilePath,
                    },
                ],
            };

            await this.transporter.sendMail(emailContent);
            this.logger.log('Backup email sent successfully');
        } catch (error) {
            this.logger.error('Failed to send backup email:', error);
            throw error;
        }
    }

    // Method umum untuk mengirim email
    async sendEmail({
        to,
        subject,
        text,
        html,
        attachments = [],
    }: {
        to: string | string[];
        subject: string;
        text: string;
        html: string;
        attachments?: any[];
    }): Promise<void> {
        try {
            const toEmails = Array.isArray(to) ? to.join(', ') : to;

            const emailContent = {
                from: this.configService.get<string>('SMTP_FROM_EMAIL'),
                to: toEmails,
                subject,
                text,
                html,
                attachments,
            };

            await this.transporter.sendMail(emailContent);
            this.logger.log(`Email sent successfully to ${toEmails}`);
        } catch (error) {
            this.logger.error('Failed to send email:', error);
            throw error;
        }
    }

    async sendReportEmail(toEmails: string[], filePath: string) {
        const date = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        await this.sendEmail({
            to: toEmails,
            subject: `Laporan Antrian - ${date}`,
            text: `Laporan antrian untuk tanggal ${date} terlampir.`,
            html: `
            <h2>Laporan Antrian</h2>
            <p>Halo,</p>
            <p>Berikut terlampir laporan antrian untuk tanggal ${date}.</p>
            <p>Best regards,<br>Sistem Laporan</p>
            `,
            attachments: [
                {
                    filename: path.basename(filePath),
                    path: filePath,
                },
            ],
        });
    }
}
