import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';
import { io, Socket } from 'socket.io-client';
describe('QueueController', () => {
    let app: INestApplication;
    let logger: Logger;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let testService: TestService;
    let socket: Socket;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TestModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        logger = app.get(WINSTON_MODULE_PROVIDER);
        testService = app.get(TestService);
        // Create a socket.io client instance and connect to the WebSocket server
        socket = io('http://localhost:5000', {
            transports: ['websocket'], // Ensure you are using the websocket transport
        });

        return new Promise<void>((resolve) => {
            socket.on('connect', () => {
                console.log('Socket connected');
                resolve(); // Resolve when the socket is connected
            });
        });
    });

    afterEach(() => {
        socket.disconnect();
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

        it('should reject get current queue in locket if locket_id not exist', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/999999/current`,
            );

            logger.info(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBeDefined();
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

        it('should reject get next queue in locket if locket_id not exist', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/999999/next`,
            );

            logger.info(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBeDefined();
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

        it('should reject get remains queue in locket if locket_id not exist', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/99999/remains`,
            );

            logger.info(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('PATCH /api/queue/:queueId', () => {
        const queueId = 9;
        it('should success update queue', async () => {
            let response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@superadmin.com',
                    password: 'test',
                });

            logger.info(response.body);

            const token = response.body.data.token;
            response = await request(app.getHttpServer())
                .patch(`/api/queue/${queueId}`)
                .set('Authorization', `Bearer ${token}`);

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.createdAt).toBeDefined();
            expect(response.body.data.queue_number).toBeDefined();
            expect(response.body.data.status).toBe('DONE');
            expect(response.body.data.locket_id).toBeDefined();
            expect(response.body.data.user_id).toBeDefined();
        });

        it('should reject update queue if user not locket admin or super admin', async () => {
            let response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@test.com',
                    password: 'test',
                });

            logger.info(response.body);

            const token = response.body.data.token;
            response = await request(app.getHttpServer())
                .patch(`/api/queue/${queueId}`)
                .set('Authorization', `Bearer ${token}`);

            logger.info(response.body);
            console.log(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBe('Forbidden');
        });

        it('should reject update queue if adminNotLogin', async () => {
            const response = await request(app.getHttpServer()).patch(
                `/api/queue/${queueId}`,
            );

            logger.info(response.body);

            expect(response.status).toBe(401);
            expect(response.body.errors).toBe('Unauthorized');
        });

        it('should reject update queue if queue_id is not exist', async () => {
            let response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@superadmin.com',
                    password: 'test',
                });

            logger.info(response.body);

            const token = response.body.data.token;
            response = await request(app.getHttpServer())
                .patch(`/api/queue/999999`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBe('queue not found');
        });
    });

    describe('SOCKET getTotalQueueToday', () => {
        it('should get total queue in locket', (done) => {
            socket.emit('getTotalQueue', 4);

            socket.on('total', (data) => {
                console.log(data);
                done(); // Signal that the test is complete
            });
        });
    });

    describe('SOCKET getCurrentQueueToday', () => {
        it('should get current queue in locket', (done) => {
            socket.emit('getCurrentQueue', 3);

            socket.on('currentQueue', (data) => {
                console.log(data);
                done(); // Signal that the test is complete
            });
        }, 10_000);
    });

    describe('SOCKET getRemain', () => {
        it('should get remain queue in locket', (done) => {
            socket.emit('getRemainQueue', 3);

            socket.on('remainQueue', (data) => {
                console.log(data);
                done(); // Signal that the test is complete
            });
        }, 10_000);
    });

    describe('SOCKET getNext', () => {
        it('should get next queue in locket', (done) => {
            socket.emit('getNextQueue', 3);

            socket.on('nextQueue', (data) => {
                console.log(data);
                done(); // Signal that the test is complete
            });
        }, 10_000);
    });

    describe('GET /api/queue/:locketId getAll', () => {
        const lockeId = 3;
        it('return all today queues', async () => {
            const response = await request(app.getHttpServer()).get(
                `/api/queue/${lockeId}`,
            );

            console.log(response.body);
        });
    });
});
