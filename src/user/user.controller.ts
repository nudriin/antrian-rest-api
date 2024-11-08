import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
    AdminRegisterRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
} from '../model/user.model';
import { WebResponse } from '../model/web.model';
import { AuthUser } from '../common/auth-user.decorator';
import { User } from '@prisma/client';
import { SuperAdmin } from '../common/super-admin.decorator';

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

    @Get()
    @HttpCode(200)
    async findAllUser(
        @SuperAdmin() superAdmin: User,
    ): Promise<WebResponse<UserResponse[]>> {
        const result = await this.userService.findAllUsers(superAdmin);

        return {
            data: result,
        };
    }

    @Post('admin/add')
    @HttpCode(200)
    async adminAddUser(
        @SuperAdmin() superAdmin: User,
        @Body() request: AdminRegisterRequest,
    ): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.adminAddUser(superAdmin, request);
        return {
            data: result,
        };
    }

    @Delete('admin/:userId')
    @HttpCode(200)
    async adminDeleteUser(
        @SuperAdmin() superAdmin: User,
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<WebResponse<string>> {
        const result = await this.userService.removeUser(superAdmin, userId);
        return {
            data: result,
        };
    }

    @Post('/verify/captcha')
    async verifyCaptcha(@Body() request: any): Promise<WebResponse<any>> {
        try {
            console.log(request);
            const response = await fetch(
                `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.APP_SECRET_KEY}&response=${request.token}`,
                {
                    method: 'POST',
                },
            );

            const data = await response.json();

            return {
                data: data,
            };
        } catch (error) {
            console.log(error);
        }
    }
}
