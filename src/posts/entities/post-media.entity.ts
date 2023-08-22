import { ApiProperty } from '@nestjs/swagger';
import { PostMedia } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class PostMediaEntity implements PostMedia {
  constructor(partial: Partial<PostMediaEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  url: string;

  @Exclude()
  id: string;

  @Exclude()
  postId: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
