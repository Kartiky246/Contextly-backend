import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContextDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  docs?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  csvFiles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pdfFiles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  youtubeLinks?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  websiteLinks?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  messages?: string[];
}

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsString()
  userId: string;

  @IsBoolean()
  @IsOptional()
  isReadyToUse?: boolean;

  @ValidateNested()
  @Type(() => ContextDto)
  @IsOptional()
  context?: ContextDto;
}
