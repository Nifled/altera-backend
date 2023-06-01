import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ParsedOrderByField } from './pagination.types';

export class PaginationParamsDto {
  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ minimum: 1 })
  @Transform(({ value }) => value && Number(value))
  @IsNumber()
  @Min(1)
  limit?: number;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ minimum: 0 })
  @Transform(({ value }) => value && Number(value))
  @IsNumber()
  @Min(0)
  offset?: number; // aka `skip`

  @Expose()
  @IsOptional()
  @ApiPropertyOptional()
  orderBy?: ParsedOrderByField[];
}
