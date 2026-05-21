import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async addComment(jobId: string, dto: CreateCommentDto) {
    const job = await this.prisma.mailingJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const comment = await this.prisma.jobComment.create({
      data: {
        job: { connect: { id: jobId } },
        author: { connect: { id: dto.authorId } },
        content: dto.content,
        isInternal: dto.isInternal ?? true,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'JobComment',
        entityId: comment.id,
        action: 'COMMENT_ADDED',
        jobId,
        changedById: dto.authorId,
        newValue: { contentLength: dto.content.length },
      },
    });

    return comment;
  }

  async getJobComments(jobId: string) {
    return this.prisma.jobComment.findMany({
      where: { jobId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
