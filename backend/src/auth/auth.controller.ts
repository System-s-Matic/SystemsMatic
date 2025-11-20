import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  getCookieOptions,
  getClearCookieOptions,
} from '../config/cookie.config';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);

    // Définir le cookie HTTP-only pour le token
    res.cookie('auth_token', result.access_token, getCookieOptions());

    // Définir le cookie HTTP-only pour les données utilisateur
    res.cookie('auth_user', JSON.stringify(result.user), getCookieOptions());

    // Retourner la réponse sans le token (il est maintenant dans le cookie)
    return res.status(HttpStatus.OK).json({
      message: 'Connexion réussie',
      user: result.user,
    });
  }

  @Post('register')
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiResponse({ status: 201, description: 'Inscription réussie' })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou email déjà utilisé',
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(registerDto);

    // Définir le cookie HTTP-only pour le token
    res.cookie('auth_token', result.access_token, getCookieOptions());

    // Définir le cookie HTTP-only pour les données utilisateur
    res.cookie('auth_user', JSON.stringify(result.user), getCookieOptions());

    // Retourner la réponse sans le token (il est maintenant dans le cookie)
    return res.status(HttpStatus.CREATED).json({
      message: 'Inscription réussie',
      user: result.user,
    });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(@Res() res: Response) {
    // Supprimer les cookies d'authentification
    res.clearCookie('auth_token', getClearCookieOptions());
    res.clearCookie('auth_user', getClearCookieOptions());

    return res.status(HttpStatus.OK).json({
      message: 'Déconnexion réussie',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Profil utilisateur récupéré' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }
}
