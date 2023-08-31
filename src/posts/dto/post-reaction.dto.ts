import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { POST_REACTION_NAMES, PostReactionName } from '../posts.types';

export class PostReactionDto {
  constructor(partial: Partial<PostReactionDto>) {
    Object.assign(this, partial);
  }

  @IsString()
  @ApiProperty()
  userId: string;

  @IsString()
  @IsIn(POST_REACTION_NAMES)
  @ApiProperty()
  reactionType: PostReactionName;
}
