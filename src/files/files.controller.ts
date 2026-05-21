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
import { CreateJobFileDto } from './dto/create-job-file.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('mailing-jobs/:jobId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new file upload for a mailing job' })
  addFile(@Param('jobId') jobId: string, @Body() dto: CreateJobFileDto) {
    return this.filesService.addFile(jobId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List files for a job (latest revisions by default)' })
  @ApiQuery({ name: 'latestOnly', required: false, type: Boolean })
  getFiles(
    @Param('jobId') jobId: string,
    @Query('latestOnly') latestOnly?: string,
  ) {
    return this.filesService.getJobFiles(jobId, latestOnly !== 'false');
  }

  @Patch(':fileId/approve')
  @ApiOperation({ summary: 'Mark a file as approved' })
  approveFile(@Param('fileId') fileId: string) {
    return this.filesService.approveFile(fileId);
  }

  @Get(':fileId/revisions')
  @ApiOperation({ summary: 'List all revisions for a file' })
  getRevisions(@Param('fileId') fileId: string) {
    return this.filesService.getFileRevisions(fileId);
  }
}
