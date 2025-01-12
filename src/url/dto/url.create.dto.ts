import { IsNotEmpty, IsString, IsOptional, IsDate } from 'class-validator';

export class UrlCreateDto {
  @IsNotEmpty()
  @IsString()
  originalUrl: string;

  @IsOptional()
  @IsString()
  method: string;

  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  alias?: string;
}
