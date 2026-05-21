import { Module } from '@nestjs/common';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { MailingJobsModule } from './mailing-jobs/mailing-jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    MailingJobsModule,
    WorkflowModule,
    FilesModule,
    CommentsModule,
  ],
})
export class AppModule {}
