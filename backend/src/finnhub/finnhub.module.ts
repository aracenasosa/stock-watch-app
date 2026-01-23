import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinnhubService } from './finnhub.service';
import { FinnhubController } from './finnhub.controller';
import { FinnhubGateway } from './finnhub.gateway';
import { AlertsModule } from 'src/alerts/alerts.module';
import { MarketService } from 'src/market/market.service';
@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 0,
    }),
    AlertsModule,
  ],
  controllers: [FinnhubController],
  providers: [FinnhubService, FinnhubGateway, MarketService],
  exports: [FinnhubService],
})
export class FinnhubModule {}
