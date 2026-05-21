import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransitionStageDto } from './dto/transition-stage.dto';
import { WorkflowService } from './workflow.service';

@ApiTags('Workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('stages')
  @ApiOperation({ summary: 'List all active workflow stages in sequence order' })
  getStages() {
    return this.workflowService.getStages();
  }

  @Get('stages/duration-stats')
  @ApiOperation({ summary: 'Average time spent per stage across all jobs (bottleneck analysis)' })
  getStageDurationStats() {
    return this.workflowService.getStageDurationStats();
  }

  @Post('jobs/:jobId/transition')
  @ApiOperation({ summary: 'Transition a mailing job to a new workflow stage' })
  transition(
    @Param('jobId') jobId: string,
    @Body() dto: TransitionStageDto,
  ) {
    return this.workflowService.transitionJobStage(jobId, dto);
  }

  @Get('jobs/:jobId/history')
  @ApiOperation({ summary: 'Full stage transition history for a job' })
  getHistory(@Param('jobId') jobId: string) {
    return this.workflowService.getJobStageHistory(jobId);
  }
}
