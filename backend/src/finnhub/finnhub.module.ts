import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinnhubService } from './finnhub.service';
import { FinnhubController } from './finnhub.controller';
import { FinnhubGateway } from './finnhub.gateway';
@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 0,
    }),
  ],
  controllers: [FinnhubController],
  providers: [FinnhubService, FinnhubGateway],
  exports: [FinnhubService],
})
export class FinnhubModule {}
