import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @ApiProperty({ required: false })
  caption?: string;

  @IsString()
  @ApiProperty()
  authorId: string;

  @IsOptional()
  @ApiProperty({ required: false })
  files?: Express.Multer.File[];
}
