import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMailingJobDto } from './dto/create-mailing-job.dto';
import { UpdateMailingJobDto } from './dto/update-mailing-job.dto';

const JOB_INCLUDE = {
  requestedBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  team: true,
  currentStage: true,
} satisfies Prisma.MailingJobInclude;

@Injectable()
export class MailingJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMailingJobDto) {
    const data: Prisma.MailingJobCreateInput = {
      title: dto.title,
      description: dto.description,
      requestedBy: { connect: { id: dto.requestedById } },
      targetMailDate: dto.targetMailDate ? new Date(dto.targetMailDate) : undefined,
      overallDueDate: dto.overallDueDate ? new Date(dto.overallDueDate) : undefined,
    };

    if (dto.assignedToId) {
      data.assignedTo = { connect: { id: dto.assignedToId } };
    }
    if (dto.teamId) {
      data.team = { connect: { id: dto.teamId } };
    }

    const job = await this.prisma.mailingJob.create({
      data,
      include: JOB_INCLUDE,
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'MailingJob',
        entityId: job.id,
        action: 'CREATED',
        jobId: job.id,
        changedById: dto.requestedById,
        newValue: { title: job.title, jobStatus: job.jobStatus },
      },
    });

    return job;
  }

  async findAll(filters?: {
    jobStatus?: JobStatus;
    assignedToId?: string;
    teamId?: string;
    dueBefore?: Date;
  }) {
    const where: Prisma.MailingJobWhereInput = {};

    if (filters?.jobStatus) where.jobStatus = filters.jobStatus;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.teamId) where.teamId = filters.teamId;
    if (filters?.dueBefore) {
      where.overallDueDate = { lte: filters.dueBefore };
    }

    return this.prisma.mailingJob.findMany({
      where,
      include: JOB_INCLUDE,
      orderBy: [{ overallDueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.mailingJob.findUnique({
      where: { id },
      include: {
        ...JOB_INCLUDE,
        stageHistories: {
          include: { stage: true, assignedTo: true },
          orderBy: { enteredAt: 'asc' },
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        files: {
          where: { isLatest: true },
          include: { stage: true, uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        milestones: { orderBy: { dueDate: 'asc' } },
        vendorTasks: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!job) throw new NotFoundException(`Mailing job ${id} not found`);
    return job;
  }

  async update(id: string, dto: UpdateMailingJobDto, actorId?: string) {
    const existing = await this.findOne(id);

    const data: Prisma.MailingJobUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.jobStatus !== undefined) data.jobStatus = dto.jobStatus;
    if (dto.blockerType !== undefined) data.blockerType = dto.blockerType;
    if (dto.targetMailDate !== undefined) data.targetMailDate = new Date(dto.targetMailDate);
    if (dto.overallDueDate !== undefined) data.overallDueDate = new Date(dto.overallDueDate);
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    const updated = await this.prisma.mailingJob.update({
      where: { id },
      data,
      include: JOB_INCLUDE,
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'MailingJob',
        entityId: id,
        action: dto.jobStatus && dto.jobStatus !== existing.jobStatus
          ? 'STATUS_CHANGED'
          : 'UPDATED',
        jobId: id,
        changedById: actorId ?? null,
        previousValue: { jobStatus: existing.jobStatus, assignedToId: existing.assignedToId },
        newValue: { jobStatus: updated.jobStatus, assignedToId: updated.assignedToId },
      },
    });

    return updated;
  }

  // ── Dashboard queries ──────────────────────────────────────────────────────

  async findDueThisWeek() {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    return this.prisma.mailingJob.findMany({
      where: {
        overallDueDate: { gte: now, lte: weekEnd },
        jobStatus: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: JOB_INCLUDE,
      orderBy: { overallDueDate: 'asc' },
    });
  }

  async findOverdueInCurrentStage() {
    return this.prisma.mailingJob.findMany({
      where: {
        jobStatus: { notIn: ['COMPLETED', 'CANCELLED'] },
        currentStageDueDate: { lt: new Date() },
      },
      include: JOB_INCLUDE,
      orderBy: { currentStageDueDate: 'asc' },
    });
  }

  async findWaitingOnVendor() {
    return this.prisma.mailingJob.findMany({
      where: { jobStatus: 'WAITING_EXTERNAL' },
      include: {
        ...JOB_INCLUDE,
        vendorTasks: { where: { taskStatus: 'SENT_TO_VENDOR' } },
      },
      orderBy: { stageEnteredAt: 'asc' },
    });
  }

  async getRecentActivity(jobId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.auditLog.findMany({
      where: { jobId, createdAt: { gte: since } },
      include: { changedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
