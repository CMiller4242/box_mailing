import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RenameFileDto {
  @ApiProperty({ description: 'New display name for the file' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'ID of the user performing the rename (uploader or admin)' })
  @IsOptional()
  @IsString()
  actorId?: string;
}
