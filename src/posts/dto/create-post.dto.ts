import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsValidUserId } from '../../users/pipes/user-id-exists.pipe';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @ApiProperty({ required: false })
  caption: string;

  @IsString()
  @ApiProperty()
  @IsValidUserId()
  authorId: string;
}
