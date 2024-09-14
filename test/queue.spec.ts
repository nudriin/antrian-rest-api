import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';
describe('QueueController', () => {
    let app: INestApplication;
    let logger: Logger;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let testService: TestService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TestModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        logger = app.get(WINSTON_MODULE_PROVIDER);
        testService = app.get(TestService);
    });

    const lokcet_ids = 1;
    describe('GET /api/queue/:locketId/total', () => {
        it('should success get total queue in locket', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/${lokcet_ids}/total`,
            );

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.total).toBeDefined();
        });

        it('should reject get total queue in locket if locketId not exist', async () => {
            const response = await request(app.getHttpServer()).get(
                '/api/queue/33332/total',
            );

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBeDefined();
        });
        it('should reject get total queue in locket if locketId invalid', async () => {
            const response = await request(app.getHttpServer()).get(
                '/api/queue/salah/total',
            );

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/queue', () => {
        it('should success save queue', async () => {
            let response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@test.com',
                    password: 'test',
                });

            logger.info(response.body);

            const token = response.body.data.token;
            response = await request(app.getHttpServer())
                .post('/api/queue')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    locket_id: lokcet_ids,
                });

            logger.info(response.body);
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.createdAt).toBeDefined();
            expect(response.body.data.queue_number).toBeDefined();
            expect(response.body.data.status).toBe('UNDONE');
            expect(response.body.data.locket_id).toBe(lokcet_ids);
            expect(response.body.data.user_id).toBeDefined();
        });

        it('should reject save queue if locket invalid', async () => {
            let response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@test.com',
                    password: 'test',
                });

            logger.info(response.body);

            const token = response.body.data.token;
            response = await request(app.getHttpServer())
                .post('/api/queue')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    locket_id: 100,
                });

            logger.info(response.body);
            expect(response.status).toBe(404);
            expect(response.body.errors).toBe('locket not found');
        });

        it('should reject save queue if user not login', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/queue')
                .set('Authorization', `Bearer salah`)
                .send({
                    locket_id: 100,
                });

            logger.info(response.body);
            expect(response.status).toBe(401);
            expect(response.body.errors).toBe('Unauthorized');
        });
    });

    describe('GET /api/queue/:locketId/current', () => {
        it('should success get current queue in locket', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/${lokcet_ids}/current`,
            );

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.currentQueue).toBeDefined();
        });
    });

    describe('GET /api/queue/:locketId/next', () => {
        it('should success get next queue in locket', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/${lokcet_ids}/next`,
            );

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.nextQueue).toBeDefined();
        });
    });

    describe('GET /api/queue/:locketId/remain', () => {
        it('should success get remain queue in locket', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/${lokcet_ids}/remain`,
            );

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.queueRemainder).toBeDefined();
        });
    });
});
