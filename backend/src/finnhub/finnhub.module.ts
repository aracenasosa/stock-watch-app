import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinnhubService } from './finnhub.service';
import { FinnhubController } from './finnhub.controller';
import { FinnhubGateway } from './finnhub.gateway';
import { AlertsModule } from 'src/alerts/alerts.module';
import { MarketService } from 'src/market/market.service';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 0,
    }),
    AlertsModule,
  ],
  controllers: [FinnhubController],
  providers: [FinnhubService, FinnhubGateway, MarketService, WsJwtGuard],
  exports: [FinnhubService],
})
export class FinnhubModule {}
