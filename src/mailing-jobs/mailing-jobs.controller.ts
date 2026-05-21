import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { CreateMailingJobDto } from './dto/create-mailing-job.dto';
import { UpdateMailingJobDto } from './dto/update-mailing-job.dto';
import { MailingJobsService } from './mailing-jobs.service';

@ApiTags('Mailing Jobs')
@Controller('mailing-jobs')
export class MailingJobsController {
  constructor(private readonly mailingJobsService: MailingJobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mailing job' })
  create(@Body() dto: CreateMailingJobDto) {
    return this.mailingJobsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List mailing jobs with optional filters' })
  @ApiQuery({ name: 'status', enum: JobStatus, required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'dueBefore', required: false, description: 'ISO date string' })
  findAll(
    @Query('status') jobStatus?: JobStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('teamId') teamId?: string,
    @Query('dueBefore') dueBefore?: string,
  ) {
    return this.mailingJobsService.findAll({
      jobStatus,
      assignedToId,
      teamId,
      dueBefore: dueBefore ? new Date(dueBefore) : undefined,
    });
  }

  @Get('dashboard/due-this-week')
  @ApiOperation({ summary: 'Jobs with due dates in the next 7 days' })
  dueThisWeek() {
    return this.mailingJobsService.findDueThisWeek();
  }

  @Get('dashboard/overdue-in-stage')
  @ApiOperation({ summary: 'Jobs that have exceeded their current stage SLA' })
  overdueInStage() {
    return this.mailingJobsService.findOverdueInCurrentStage();
  }

  @Get('dashboard/waiting-on-vendor')
  @ApiOperation({ summary: 'Jobs currently waiting on an external vendor' })
  waitingOnVendor() {
    return this.mailingJobsService.findWaitingOnVendor();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full detail for a single mailing job' })
  findOne(@Param('id') id: string) {
    return this.mailingJobsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mailing job' })
  update(@Param('id') id: string, @Body() dto: UpdateMailingJobDto) {
    // TODO: replace hardcoded actorId with real user from auth context in Phase 2
    return this.mailingJobsService.update(id, dto);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Audit log for a job over the past N days' })
  @ApiQuery({ name: 'days', required: false, description: 'Default 7' })
  getActivity(@Param('id') id: string, @Query('days') days?: string) {
    return this.mailingJobsService.getRecentActivity(id, days ? parseInt(days) : 7);
  }
}
