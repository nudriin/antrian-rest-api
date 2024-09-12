import { Module } from '@nestjs/common';
import { LocketService } from './locket.service';
import { LocketController } from './locket.controller';

@Module({
  providers: [LocketService],
  controllers: [LocketController]
})
export class LocketModule {}
