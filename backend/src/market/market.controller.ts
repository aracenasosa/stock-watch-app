import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { BatchQuotesDto } from './dto/batch-quotes.dto';

@ApiTags('Market')
@ApiBearerAuth('bearer')
@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post('quotes')
  batchQuotes(@Body() dto: BatchQuotesDto) {
    return this.market.getBatchQuotes(dto.symbols);
  }
}
