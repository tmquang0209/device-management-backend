import { IsOptional, IsString } from 'class-validator';

export class PubDto {
  @IsString()
  @IsOptional()
  channel: string;

  @IsString()
  msg: string;
}
export class SubDto {
  @IsString()
  channel: string;
}
