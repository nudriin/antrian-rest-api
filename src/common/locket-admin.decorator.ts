import {
    createParamDecorator,
    ExecutionContext,
    HttpException,
} from '@nestjs/common';

export const LocketAdmin = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new HttpException('Unauthorized', 401);
        }

        if (user.role == 'LOCKET_ADMIN' || user.role == 'SUPER_ADMIN') {
            return user;
        } else {
            throw new HttpException('Forbidden', 403);
        }
    },
);
