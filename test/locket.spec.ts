import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';
describe('LocketController', () => {
    let app: INestApplication;
    let logger: Logger;
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

    describe('POST /api/locket', () => {
        beforeEach(async () => {
            await testService.deleteLocket();
        });

        it('should success create locket', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/locket')
                .send({
                    name: 'test',
                });

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.name).toBe('test');
            expect(response.body.data.createdAt).toBeDefined();
        });

        it('should reject locket name is duplicate', async () => {
            await testService.createLocket();
            const response = await request(app.getHttpServer())
                .post('/api/locket')
                .send({
                    name: 'test',
                });

            logger.info(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/locket', () => {
        it('should success get all locket', async () => {
            const response = await request(app.getHttpServer()).get(
                '/api/locket',
            );

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data[0].id).toBeDefined();
            expect(response.body.data[0].name).toBeDefined();
            expect(response.body.data[0].createdAt).toBeDefined();
        });
    });

    describe('GET /api/locket/:lokcetName', () => {
        beforeEach(async () => {
            await testService.deleteLocket();
            await testService.createLocket();
        });
        it('should success get locket by name', async () => {
            const response = await request(app.getHttpServer()).get(
                '/api/locket/test',
            );

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.name).toBe('test');
            expect(response.body.data.createdAt).toBeDefined();
        });

        it('should success reject get locket by name if name not exist', async () => {
            const response = await request(app.getHttpServer()).get(
                '/api/locket/tidak-ada',
            );

            logger.info(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBe('locket not found');
        });
    });
});
