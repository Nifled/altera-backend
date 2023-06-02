import { ApiProperty } from '@nestjs/swagger';

interface PaginationMeta {
  count: number; // Total number of items for query
}

export class PaginationMetaEntity implements PaginationMeta {
  constructor(partial: Partial<PaginationMetaEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty({ nullable: true })
  startCursor?: string;

  @ApiProperty({ nullable: true })
  endCursor?: string;

  @ApiProperty()
  count: number;

  // TODO: ?
  // @ApiProperty()
  // totalPages = this.count/this.pageSize;
}
