import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateMailingJobDto {
  @ApiProperty({ example: 'Spring 2025 Donor Mailing' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'User ID of the person requesting the mailing' })
  @IsString()
  requestedById: string;

  @ApiPropertyOptional({ description: 'User ID of the initial assignee' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Team responsible for this job' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({
    description: 'Date the physical mailing must drop',
    example: '2025-06-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  targetMailDate?: string;

  @ApiPropertyOptional({
    description: 'Hard deadline for all job tasks to be complete',
    example: '2025-06-14T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  overallDueDate?: string;
}
