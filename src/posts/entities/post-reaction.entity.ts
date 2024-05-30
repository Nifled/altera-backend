import { ApiProperty } from '@nestjs/swagger';
import { PostReactionType } from '@prisma/client';
import { Exclude, Expose, Transform } from 'class-transformer';

export class PostReactionEntity {
  constructor(partial: Partial<PostReactionEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  postId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  typeId: string;

  @ApiProperty()
  @Expose({ name: 'reactionType' })
  @Transform(({ value }) => value.name)
  type: PostReactionType;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
