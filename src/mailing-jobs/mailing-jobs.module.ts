import { Module } from '@nestjs/common';
import { MailingJobsController } from './mailing-jobs.controller';
import { MailingJobsService } from './mailing-jobs.service';

@Module({
  controllers: [MailingJobsController],
  providers: [MailingJobsService],
  exports: [MailingJobsService],
})
export class MailingJobsModule {}
