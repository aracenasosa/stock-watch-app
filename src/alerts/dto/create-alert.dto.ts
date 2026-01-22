import { IsNumber, IsString, Min } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  symbol: string;

  @IsNumber()
  @Min(0)
  targetPrice: number;
}
