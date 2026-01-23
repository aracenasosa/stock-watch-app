import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAlertDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  targetPrice?: number;
}
