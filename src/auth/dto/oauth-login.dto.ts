import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class OAuthLoginDto {
  @Expose()
  @IsString()
  @IsIn(['google'])
  @IsNotEmpty()
  providerName: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  providerToken: string;

  @Expose()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Expose()
  @IsOptional()
  @IsString()
  firstName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  lastName?: string;

  // TODO: add 'photo' (or similar) property
}
