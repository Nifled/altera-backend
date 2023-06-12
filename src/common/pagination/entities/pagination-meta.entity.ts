import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

interface PaginationResponseMetadata {
  nextCursor: string | null; // Next cursor id for subsequent requests
}

export class PaginationMetaEntity implements PaginationResponseMetadata {
  constructor(partial: Partial<PaginationMetaEntity>) {
    Object.assign(this, partial);
  }

  @Expose({ name: 'next_cursor' })
  @ApiProperty({ nullable: true, type: String })
  nextCursor: string | null;
}
