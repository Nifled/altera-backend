import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ParsedOrderByField } from './pagination.types';

// TODO: move these to config or some shit?
const DEFAULT_PAGE_SIZE = 10;

export class PaginationParamsDto {
  @Expose()
  @IsOptional()
  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = DEFAULT_PAGE_SIZE;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional()
  // The response returns the cursor (`next_cursor`) as part
  // of the payload to be sent in a subsequent request
  cursor?: string;

  @Expose()
  @IsOptional()
  @ApiPropertyOptional()
  orderBy?: ParsedOrderByField[];
}
