import {
    createParamDecorator,
    ExecutionContext,
    HttpException,
} from '@nestjs/common';

export const SuperAdmin = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new HttpException('Unauthorized', 401);
        }

        if (user.role != 'SUPER_ADMIN') {
            throw new HttpException('Forbidden', 403);
        }
        return user;
    },
);
