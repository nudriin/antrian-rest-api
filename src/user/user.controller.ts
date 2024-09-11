import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRegisterRequest, UserResponse } from '../model/user.model';
import { WebResponse } from '../model/web.model';

@Controller('/api/users')
export class UserController {
    constructor(private userService: UserService) {}

    @Post()
    @HttpCode(200)
    async Register(
        @Body() request: UserRegisterRequest,
    ): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(request);
        return {
            data: result,
        };
    }
}
