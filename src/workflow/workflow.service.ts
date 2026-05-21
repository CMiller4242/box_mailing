import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransitionStageDto } from './dto/transition-stage.dto';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async getStages() {
    return this.prisma.workflowStage.findMany({
      where: { isActive: true },
      orderBy: { sequence: 'asc' },
    });
  }

  async getStage(stageId: string) {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException(`Stage ${stageId} not found`);
    return stage;
  }

  // Core transition method — closes current open history row, opens a new one,
  // and updates the denormalized pointer on MailingJob atomically.
  async transitionJobStage(jobId: string, dto: TransitionStageDto) {
    const job = await this.prisma.mailingJob.findUnique({
      where: { id: jobId },
      include: { currentStage: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const targetStage = await this.getStage(dto.targetStageId);

    if (job.currentStageId === dto.targetStageId) {
      throw new BadRequestException('Job is already in the requested stage');
    }

    const now = new Date();

    // Compute the SLA due date for the new stage
    const stageDueDate =
      targetStage.slaDays != null
        ? new Date(now.getTime() + targetStage.slaDays * 86_400_000)
        : null;

    // Determine top-level job status based on whether new stage is external
    const jobStatus = targetStage.isExternalStep
      ? 'WAITING_EXTERNAL'
      : 'ACTIVE';

    const blockerType = targetStage.isExternalStep ? 'VENDOR' : 'NONE';

    await this.prisma.$transaction(async (tx) => {
      // Close the currently open history row if one exists
      if (job.currentStageId) {
        const openHistory = await tx.jobStageHistory.findFirst({
          where: { jobId, stageId: job.currentStageId, exitedAt: null },
          orderBy: { enteredAt: 'desc' },
        });

        if (openHistory) {
          const durationMinutes = Math.round(
            (now.getTime() - openHistory.enteredAt.getTime()) / 60_000,
          );
          await tx.jobStageHistory.update({
            where: { id: openHistory.id },
            data: { exitedAt: now, durationMinutes },
          });
        }
      }

      // Open new history row
      await tx.jobStageHistory.create({
        data: {
          job: { connect: { id: jobId } },
          stage: { connect: { id: dto.targetStageId } },
          enteredAt: now,
          transitionNote: dto.transitionNote,
          ...(dto.assignedToId && {
            assignedTo: { connect: { id: dto.assignedToId } },
          }),
          ...(dto.transitionedById && {
            transitionedBy: { connect: { id: dto.transitionedById } },
          }),
        },
      });

      // Update denormalized fields on the job
      await tx.mailingJob.update({
        where: { id: jobId },
        data: {
          currentStage: { connect: { id: dto.targetStageId } },
          stageEnteredAt: now,
          currentStageDueDate: stageDueDate,
          jobStatus,
          blockerType,
          ...(dto.assignedToId && {
            assignedTo: { connect: { id: dto.assignedToId } },
          }),
        },
      });

      // Audit record
      await tx.auditLog.create({
        data: {
          entityType: 'MailingJob',
          entityId: jobId,
          action: 'STAGE_TRANSITIONED',
          jobId,
          changedById: dto.transitionedById ?? null,
          previousValue: {
            stageId: job.currentStageId,
            stageName: job.currentStage?.name ?? null,
          },
          newValue: {
            stageId: targetStage.id,
            stageName: targetStage.name,
          },
        },
      });
    });

    return this.prisma.mailingJob.findUnique({
      where: { id: jobId },
      include: {
        currentStage: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  // Returns how long each stage took on average across all completed jobs —
  // the primary bottleneck analysis query.
  async getStageDurationStats() {
    const rows = await this.prisma.jobStageHistory.groupBy({
      by: ['stageId'],
      where: { durationMinutes: { not: null } },
      _avg: { durationMinutes: true },
      _count: { id: true },
    });

    const stages = await this.prisma.workflowStage.findMany({
      orderBy: { sequence: 'asc' },
    });

    const stageMap = new Map(stages.map((s) => [s.id, s]));

    return rows.map((r) => ({
      stageId: r.stageId,
      stageName: stageMap.get(r.stageId)?.name ?? 'Unknown',
      sequence: stageMap.get(r.stageId)?.sequence ?? 0,
      avgDurationMinutes: r._avg.durationMinutes,
      sampleCount: r._count.id,
    }));
  }

  async getJobStageHistory(jobId: string) {
    return this.prisma.jobStageHistory.findMany({
      where: { jobId },
      include: {
        stage: true,
        assignedTo: { select: { id: true, name: true } },
        transitionedBy: { select: { id: true, name: true } },
      },
      orderBy: { enteredAt: 'asc' },
    });
  }
}
