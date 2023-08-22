import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PostMediaDto {
  constructor(partial: Partial<PostMediaDto>) {
    Object.assign(this, partial);
  }

  @IsString()
  @ApiProperty()
  url: string;
}
