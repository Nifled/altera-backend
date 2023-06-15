import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { PaginationMetaEntity } from './pagination-meta.entity';

export class PaginationPageEntity<T> {
  constructor(partial: Partial<PaginationPageEntity<T>>) {
    Object.assign(this, partial);
  }

  @IsArray() // Should only be run on endpoints with array(list) responses
  data: T[];

  @ApiProperty({ type: PaginationMetaEntity })
  meta: PaginationMetaEntity;
}
