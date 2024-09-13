import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';
describe('UserController', () => {
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

    describe('POST /api/users', () => {
        beforeEach(async () => {
            await testService.deleteUser();
        });
        it('should be rejected if request invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    email: '',
                    password: '',
                    name: '',
                });

            logger.info(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should be success register user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    email: 'test@test.com',
                    password: 'test',
                    name: 'test',
                });

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.email).toBe('test@test.com');
            expect(response.body.data.name).toBe('test');
        });

        it('should be reject if email is exist', async () => {
            await testService.createUser();
            const response = await request(app.getHttpServer())
                .post('/api/users')
                .send({
                    email: 'test@test.com',
                    password: 'test',
                    name: 'test',
                });

            logger.info(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBe('user is exist');
        });
    });

    describe('POST /api/users/login', () => {
        beforeEach(async () => {
            await testService.deleteSuperAdmin();
            await testService.createSuperAdmin();
        });

        it('should reject if request invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: '',
                    password: '',
                });

            logger.info(response.body);
            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject if user not exist', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@false.com',
                    password: 'test',
                });

            logger.info(response.body);
            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject if password is wrong', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@superadmin.com',
                    password: 'salah',
                });

            logger.info(response.body);
            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should success login user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@superadmin.com',
                    password: 'test',
                });

            logger.info(response.body);
            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.email).toBe('test@superadmin.com');
            expect(response.body.data.name).toBe('test');
            expect(response.body.data.token).toBeDefined();
            logger.info(response.body.data.token);
        });
    });

    describe('GET /api/users/current', () => {
        beforeEach(async () => {
            await testService.deleteUser();
            await testService.createUser();
        });

        it('should success get current user', async () => {
            let response = await request(app.getHttpServer())
                .post('/api/users/login')
                .send({
                    email: 'test@test.com',
                    password: 'test',
                });

            const token = response.body.data.token;

            response = await request(app.getHttpServer())
                .get('/api/users/current')
                .set('Authorization', `Bearer ${token}`);

            logger.info(response.body);
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.email).toBe('test@test.com');
            expect(response.body.data.name).toBe('test');
            expect(response.body.data.role).toBe('USER');
        });
        it('should failed if Authorization not set', async () => {
            const response = await request(app.getHttpServer()).get(
                '/api/users/current',
            );
            logger.info(response.body);

            expect(response.status).toBe(401);
            expect(response.body.errors).toBe('Unauthorized');
        });
        it('should failed if Authorization wrong', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/current')
                .set('Authorization', 'Bearer salah');
            logger.info(response.body);
            expect(response.status).toBe(401);
            expect(response.body.errors).toBe('Unauthorized');
        });
        it('should failed if Authorization blank', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/current')
                .set('Authorization', '');
            logger.info(response.body);
            expect(response.status).toBe(401);
            expect(response.body.errors).toBe('Unauthorized');
        });
    });
});
