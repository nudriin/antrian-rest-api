/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { LocketService } from './locket.service';
import { LocketSaveRequest, LocketResponse } from '../model/locket.model';
import { WebResponse } from '../model/web.model';
import { SuperAdmin } from '../common/super-admin.decorator';
import { User } from '@prisma/client';

@Controller('/api/locket')
export class LocketController {
    constructor(private locketService: LocketService) {}

    @Post()
    @HttpCode(200)
    async saveLocket(
        @Body() request: LocketSaveRequest,
    ): Promise<WebResponse<LocketResponse>> {
        const result = await this.locketService.save(request);

        return {
            data: result,
        };
    }

    @Get()
    @HttpCode(200)
    async findAllLocket(): Promise<WebResponse<LocketResponse[]>> {
        const result = await this.locketService.findAll();

        return {
            data: result,
        };
    }

    @Get('/:locketName')
    @HttpCode(200)
    async findLocketByName(
        @Param('locketName') locketName: string,
    ): Promise<WebResponse<LocketResponse>> {
        const result = await this.locketService.findByName(locketName);

        return {
            data: result,
        };
    }

    @Delete('/:locketId')
    @HttpCode(200)
    async deleteLocketById(
        @Param('locketId', ParseIntPipe) locketId: number,
        @SuperAdmin() user: User,
    ): Promise<WebResponse<string>> {
        await this.locketService.deleteLocket(locketId);

        return {
            data: 'OK',
        };
    }
}
