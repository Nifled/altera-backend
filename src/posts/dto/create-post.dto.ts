import { ApiProperty } from '@nestjs/swagger';
import { IsValidUserId } from 'src/users/validators/user-id-exists.validator';

export class CreatePostDto {
  @ApiProperty({ required: false })
  caption: string;

  @ApiProperty()
  @IsValidUserId()
  authorId: string;
}
