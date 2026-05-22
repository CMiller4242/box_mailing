import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateJobFileDto } from './dto/create-job-file.dto';
import { RenameFileDto } from './dto/rename-file.dto';
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

  @Get(':fileId/download')
  @ApiOperation({ summary: 'Get file metadata for download (binary storage wired separately)' })
  downloadFile(@Param('fileId') fileId: string) {
    return this.filesService.getFileForDownload(fileId);
  }

  @Patch(':fileId')
  @ApiOperation({ summary: 'Rename a file (uploader or admin only)' })
  renameFile(@Param('fileId') fileId: string, @Body() dto: RenameFileDto) {
    return this.filesService.renameFile(fileId, dto);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file record (uploader or admin only)' })
  deleteFile(
    @Param('fileId') fileId: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.filesService.deleteFile(fileId, actorId);
  }
}
