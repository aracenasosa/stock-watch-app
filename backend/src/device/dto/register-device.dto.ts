import { IsIn, IsString, Length } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @Length(10, 4096)
  token: string;

  @IsIn(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';
}
