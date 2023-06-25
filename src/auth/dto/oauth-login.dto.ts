import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class OAuthLoginDto {
  @IsString({})
  @IsIn(['google'])
  @IsNotEmpty()
  providerName: string;

  @IsString()
  @IsNotEmpty()
  providerToken: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  // TODO: add 'photo' (or similar) property
}
