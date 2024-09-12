import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { LocketModule } from './locket/locket.module';

@Module({
    imports: [CommonModule, UserModule, LocketModule],
})
export class AppModule {}
