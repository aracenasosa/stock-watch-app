import { Controller, Get, Query } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('finnhub')
@ApiBearerAuth('bearer')
@ApiTags('Finnhub')
export class FinnhubController {
  constructor(private readonly finnhub: FinnhubService) {}

  @Get('symbols')
  listSymbols(@Query('exchange') exchange?: string) {
    return this.finnhub.listSymbols(exchange ?? 'US');
  }

  @Get('quote')
  quote(@Query('symbol') symbol: string) {
    return this.finnhub.getQuote(symbol);
  }
}
