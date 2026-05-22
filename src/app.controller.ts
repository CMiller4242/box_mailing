import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Status')
@Controller()
export class AppController {
  @Get('/')
  @ApiOperation({ summary: 'API root — confirms the server is reachable' })
  root() {
    return {
      name: 'Box Mailing API',
      status: 'ok',
      docs: '/docs',
      api: '/api/v1',
    };
  }

  @Get('/health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
