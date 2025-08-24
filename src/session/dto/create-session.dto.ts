import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export enum Contexts{
  DOCS = 'docs',
  YOUTUBE_LINKS = 'youtubeLinks',
  WEBSITE_LINKS = 'websiteLinks',
  MESSAGES = 'messages'
}
class ContextDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  [Contexts.DOCS]?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  [Contexts.YOUTUBE_LINKS]?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  [Contexts.WEBSITE_LINKS]?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  [Contexts.MESSAGES]?: string[];
}

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isReadyToUse?: boolean;

  @ValidateNested()
  @Type(() => ContextDto)
  @IsOptional()
  context: ContextDto;
}
