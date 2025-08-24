import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Configuration des cookies selon l'environnement
    const cookieOptions: any = {
      httpOnly: process.env.NODE_ENV === 'production', // Sécurisé en prod, visible en dev
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      path: '/',
    };

    // Ajouter le domaine en production si spécifié
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    // Vérifier que le token n'est pas vide avant de le mettre dans le cookie
    if (!result.access_token) {
      throw new Error('Token de connexion invalide');
    }

    // Définir le token dans un cookie HTTP-only
    res.cookie('access_token', result.access_token, cookieOptions);

    // Retourner seulement les données utilisateur (sans le token)
    return {
      user: result.user,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Configuration des cookies selon l'environnement
    const cookieOptions: any = {
      httpOnly: process.env.NODE_ENV === 'production', // Sécurisé en prod, visible en dev
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    };

    // Ajouter le domaine en production si spécifié
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    // Supprimer le cookie
    res.clearCookie('access_token', cookieOptions);

    return { message: 'Déconnexion réussie' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getProfile(@Request() req) {
    // Récupérer les données complètes de l'utilisateur depuis la base de données
    const user = await this.authService.getUserProfile(req.user.id);
    return user;
  }
}
