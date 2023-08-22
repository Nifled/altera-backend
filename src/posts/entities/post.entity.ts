import { ApiProperty } from '@nestjs/swagger';
import { Post } from '@prisma/client';
import { PostMediaEntity } from './post-media.entity';
import { Type } from 'class-transformer';

export class PostEntity implements Post {
  constructor(partial: Partial<PostEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  caption: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  @Type(() => PostMediaEntity)
  media: PostMediaEntity[];
}
