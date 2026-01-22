import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class BatchQuotesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  symbols!: string[];
}
