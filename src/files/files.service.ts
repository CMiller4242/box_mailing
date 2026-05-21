import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobFileDto } from './dto/create-job-file.dto';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFile(jobId: string, dto: CreateJobFileDto) {
    // Verify job exists
    const job = await this.prisma.mailingJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    let version = 1;

    if (dto.parentFileId) {
      // Mark the previous latest revision as no longer latest
      await this.prisma.jobFile.updateMany({
        where: { id: dto.parentFileId, isLatest: true },
        data: { isLatest: false },
      });

      // Determine the next version number
      const latest = await this.prisma.jobFile.findFirst({
        where: { parentFileId: dto.parentFileId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      version = (latest?.version ?? 1) + 1;
    }

    const data: Prisma.JobFileCreateInput = {
      job: { connect: { id: jobId } },
      displayName: dto.displayName,
      storageKey: dto.storageKey,
      storageProvider: dto.storageProvider,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes ? BigInt(dto.sizeBytes) : undefined,
      uploadedBy: { connect: { id: dto.uploadedById } },
      version,
      isLatest: true,
      ...(dto.stageId && { stage: { connect: { id: dto.stageId } } }),
      ...(dto.parentFileId && { parentFile: { connect: { id: dto.parentFileId } } }),
    };

    const file = await this.prisma.jobFile.create({ data });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'JobFile',
        entityId: file.id,
        action: 'FILE_UPLOADED',
        jobId,
        changedById: dto.uploadedById,
        newValue: { displayName: dto.displayName, version, stageId: dto.stageId ?? null },
      },
    });

    return file;
  }

  async getJobFiles(jobId: string, latestOnly = true) {
    return this.prisma.jobFile.findMany({
      where: { jobId, ...(latestOnly && { isLatest: true }) },
      include: {
        stage: true,
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveFile(fileId: string, actorId?: string) {
    const file = await this.prisma.jobFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException(`File ${fileId} not found`);

    const updated = await this.prisma.jobFile.update({
      where: { id: fileId },
      data: { isApproved: true, approvedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'JobFile',
        entityId: fileId,
        action: 'FILE_APPROVED',
        jobId: file.jobId,
        changedById: actorId ?? null,
        newValue: { approvedAt: updated.approvedAt },
      },
    });

    return updated;
  }

  async getFileRevisions(parentFileId: string) {
    return this.prisma.jobFile.findMany({
      where: {
        parentFileId,
      },
      orderBy: { version: 'asc' },
    });
  }
}
