import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { UserService } from './user.service';
import {
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
} from '../model/user.model';
import { WebResponse } from '../model/web.model';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from '@prisma/client';

@Controller('/api/users')
export class UserController {
    constructor(private userService: UserService) {}

    @Post()
    @HttpCode(200)
    async register(
        @Body() request: UserRegisterRequest,
    ): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(request);
        return {
            data: result,
        };
    }

    @Post('/login')
    @HttpCode(200)
    async login(
        @Body() request: UserLoginRequest,
    ): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.login(request);

        return {
            data: result,
        };
    }

    @Get('/current')
    @HttpCode(200)
    async findCurrentUser(
        @AuthUser() user: User,
    ): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.findCurrent(user);

        return {
            data: result,
        };
    }
}
