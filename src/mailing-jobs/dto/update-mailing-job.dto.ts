import { ApiPropertyOptional } from '@nestjs/swagger';
import { BlockerType, JobStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMailingJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  jobStatus?: JobStatus;

  @ApiPropertyOptional({ enum: BlockerType })
  @IsOptional()
  @IsEnum(BlockerType)
  blockerType?: BlockerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetMailDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  overallDueDate?: string;
}
