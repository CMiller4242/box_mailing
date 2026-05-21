import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileStorageProvider } from '@prisma/client';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateJobFileDto {
  @ApiProperty({ description: 'Human-readable label for the file' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Storage path or object key' })
  @IsString()
  storageKey: string;

  @ApiPropertyOptional({ enum: FileStorageProvider, default: FileStorageProvider.LOCAL })
  @IsOptional()
  @IsEnum(FileStorageProvider)
  storageProvider?: FileStorageProvider;

  @ApiPropertyOptional({ example: 'text/csv' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumberString()
  sizeBytes?: string;

  @ApiProperty({ description: 'User ID of the uploader' })
  @IsString()
  uploadedById: string;

  @ApiPropertyOptional({ description: 'Stage ID this file is associated with' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({
    description: 'If this is a revision, the ID of the parent (original) file',
  })
  @IsOptional()
  @IsString()
  parentFileId?: string;
}
