import { Module } from '@nestjs/common';
import { FinnhubModule } from '../finnhub/finnhub.module';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [FinnhubModule, HttpModule],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
