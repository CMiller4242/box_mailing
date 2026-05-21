import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('mailing-jobs/:jobId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment or note to a mailing job' })
  addComment(@Param('jobId') jobId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.addComment(jobId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a mailing job' })
  getComments(@Param('jobId') jobId: string) {
    return this.commentsService.getJobComments(jobId);
  }
}
