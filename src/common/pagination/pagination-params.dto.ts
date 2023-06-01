import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ParsedOrderByField } from './pagination.types';

// TODO: move these to config or some shit?
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_OFFSET = 0;

export class PaginationParamsDto {
  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ minimum: 1 })
  @Transform(({ value }) => value && Number(value))
  @IsNumber()
  @Min(1)
  limit: number = DEFAULT_PAGE_SIZE;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ minimum: 0 })
  @Transform(({ value }) => value && Number(value))
  @IsNumber()
  @Min(0)
  offset: number = DEFAULT_PAGE_OFFSET; // aka `skip`

  @Expose()
  @IsOptional()
  @ApiPropertyOptional()
  orderBy?: ParsedOrderByField[];
}
