import { Module } from '@nestjs/common';
import { FinnhubModule } from '../finnhub/finnhub.module';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

@Module({
  imports: [FinnhubModule],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
