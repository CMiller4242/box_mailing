import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TransitionStageDto {
  @ApiProperty({ description: 'ID of the WorkflowStage to move the job into' })
  @IsString()
  targetStageId: string;

  @ApiPropertyOptional({ description: 'ID of the user performing the transition' })
  @IsOptional()
  @IsString()
  transitionedById?: string;

  @ApiPropertyOptional({ description: 'ID of the user who will own the job in the new stage' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Context note for why the stage changed' })
  @IsOptional()
  @IsString()
  transitionNote?: string;
}
