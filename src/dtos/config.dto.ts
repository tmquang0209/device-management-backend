import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationRequestDto, PaginationResponseDto } from './pagination.dto';

export class ConfigInfoDto {
  @IsUUID()
  readonly id: string;

  @IsString()
  readonly key: string;

  @IsString()
  readonly value: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  readonly isActive?: boolean;

  @IsOptional()
  @IsString()
  readonly valueType?: string;

  @IsDate()
  readonly createdAt: Date;

  @IsDate()
  readonly updatedAt: Date;
}

export class CreateConfigDto {
  @IsString()
  readonly key: string;

  @Transform(({ value }) => String(value))
  @IsString()
  readonly value: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  readonly isActive?: boolean;

  @IsOptional()
  @IsString()
  readonly valueType?: string;
}

export class UpdateConfigDto extends CreateConfigDto {
  @IsOptional()
  @IsUUID()
  readonly id: string;
}

export class UpdateBatchConfigStatusDto {
  @IsUUID('4', { each: true })
  readonly ids: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  readonly isActive: boolean;
}

export class DeleteBatchConfigsDto {
  @IsUUID('4', { each: true })
  readonly ids: string[];
}

export class ConfigListRequestDto extends PaginationRequestDto {
  @IsOptional()
  @IsString()
  readonly key: string;

  @IsOptional()
  @IsString()
  readonly value: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  readonly isActive: boolean;

  @IsOptional()
  @IsString()
  readonly valueType: string;
}

export class ConfigListResponseDto extends PaginationResponseDto<ConfigInfoDto> {}
