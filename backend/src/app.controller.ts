import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Point d\'entrée principal de l\'API' })
  @ApiResponse({ status: 200, description: 'Message de bienvenue' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérification de l\'état de santé de l\'API' })
  @ApiResponse({ status: 200, description: 'API opérationnelle' })
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
