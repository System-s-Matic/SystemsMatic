import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  ValidationPipe,
  HttpStatus,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteFilterDto } from './dto/quote-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Devis')
@Controller('quotes')
export class QuotesController {
  private readonly logger = new Logger(QuotesController.name);

  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle demande de devis' })
  @ApiResponse({
    status: 201,
    description: 'Demande de devis créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou conditions générales non acceptées',
  })
  @ApiBody({ type: CreateQuoteDto })
  async create(@Body(new ValidationPipe()) createQuoteDto: CreateQuoteDto) {
    try {
      this.logger.log('Nouvelle demande de devis reçue');

      // Validation supplémentaire des conditions générales
      if (!createQuoteDto.acceptTerms) {
        throw new HttpException(
          "L'acceptation des conditions générales est obligatoire",
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.quotesService.create(createQuoteDto);

      this.logger.log('Demande de devis traitée avec succès');
      return result;
    } catch (error) {
      this.logger.error(
        'Erreur lors du traitement de la demande de devis:',
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Une erreur est survenue lors du traitement de votre demande',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoints pour la gestion admin (back-office)

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Récupérer la liste des devis avec filtres (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des devis récupérée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: "Nombre d'éléments par page",
  })
  @ApiQuery({ name: 'status', required: false, description: 'Statut du devis' })
  @ApiQuery({
    name: 'contactId',
    required: false,
    description: 'ID du contact',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche par nom ou email',
  })
  @ApiBearerAuth()
  async findAll(@Query(new ValidationPipe()) filters: QuoteFilterDto) {
    try {
      const page = parseInt(filters.page || '1');
      const limit = parseInt(filters.limit || '10');

      return await this.quotesService.findAllWithFilters(page, limit, filters);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des devis:', error);
      throw new HttpException(
        'Erreur lors de la récupération des devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiOperation({ summary: 'Récupérer les statistiques des devis (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBearerAuth()
  async getStats() {
    try {
      return await this.quotesService.getStats();
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des statistiques:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un devis par son ID (Admin)' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Devis récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Devis non trouvé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    try {
      const quote = await this.quotesService.findOne(id);
      if (!quote) {
        throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
      }
      return quote;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du devis ${id}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un devis (Admin)' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Devis mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Devis non trouvé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBody({ type: UpdateQuoteDto })
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateQuoteDto: UpdateQuoteDto,
  ) {
    try {
      const quote = await this.quotesService.findOne(id);
      if (!quote) {
        throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
      }

      return await this.quotesService.updateQuote(id, updateQuoteDto);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du devis ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  @ApiOperation({ summary: "Mettre à jour le statut d'un devis (Admin)" })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Devis non trouvé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        data: { type: 'object' },
      },
    },
  })
  @ApiBearerAuth()
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; data?: any },
  ) {
    try {
      const quote = await this.quotesService.findOne(id);
      if (!quote) {
        throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
      }

      return await this.quotesService.updateStatus(id, body.status, body.data);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du statut du devis ${id}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour du statut',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/accept')
  @ApiOperation({ summary: 'Accepter un devis (Admin)' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Devis accepté avec succès' })
  @ApiResponse({ status: 404, description: 'Devis non trouvé' })
  @ApiResponse({ status: 400, description: 'Devis non acceptables' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: { type: 'string' },
        validUntil: { type: 'string' },
      },
    },
  })
  @ApiBearerAuth()
  async acceptQuote(
    @Param('id') id: string,
    @Body() body: { document?: string; validUntil?: string },
  ) {
    try {
      const quote = await this.quotesService.findOne(id);
      if (!quote) {
        throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
      }

      if (quote.status !== 'PENDING' && quote.status !== 'PROCESSING') {
        throw new HttpException(
          'Seuls les devis en attente ou en cours de traitement peuvent être acceptés',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.quotesService.acceptQuote(id, body);
    } catch (error) {
      this.logger.error(`Erreur lors de l'acceptation du devis ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Erreur lors de l'acceptation du devis",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/reject')
  @ApiOperation({ summary: 'Rejeter un devis (Admin)' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Devis rejeté avec succès' })
  @ApiResponse({ status: 404, description: 'Devis non trouvé' })
  @ApiResponse({
    status: 400,
    description: 'Devis non rejetables ou raison manquante',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rejectionReason: { type: 'string' },
      },
      required: ['rejectionReason'],
    },
  })
  @ApiBearerAuth()
  async rejectQuote(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
  ) {
    try {
      const quote = await this.quotesService.findOne(id);
      if (!quote) {
        throw new HttpException('Devis introuvable', HttpStatus.NOT_FOUND);
      }

      if (quote.status !== 'PENDING' && quote.status !== 'PROCESSING') {
        throw new HttpException(
          'Seuls les devis en attente ou en cours de traitement peuvent être rejetés',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!body.rejectionReason || body.rejectionReason.trim().length === 0) {
        throw new HttpException(
          'La raison du refus est obligatoire',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.quotesService.rejectQuote(id, body.rejectionReason);
    } catch (error) {
      this.logger.error(`Erreur lors du rejet du devis ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors du rejet du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
