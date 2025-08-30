import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export enum Contexts{
  YOUTUBE_LINKS = 'youtubeLinks',
  WEBSITE_LINKS = 'websiteLinks',
  PDF_FILES = 'pdfFiles'
}

export enum FileTypes{
  PDF_FILES = 'pdfFiles',
  CSV_FILES = 'csvFiles',
  DOC_FILES = 'docFiles' 
}
class ContextDto {
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
  [Contexts.PDF_FILES]?: string[];

}

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isReadyToUse?: boolean;

  @ValidateNested()
  @Type(() => ContextDto)
  context: ContextDto;
}
