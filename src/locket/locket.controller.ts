import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { LocketService } from './locket.service';
import { LocketSaveRequest, LocketResponse } from '../model/locket.model';
import { WebResponse } from '../model/web.model';

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
}
