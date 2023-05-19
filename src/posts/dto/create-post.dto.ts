import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsValidUserId } from 'src/users/validators/user-id-exists.validator';

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
