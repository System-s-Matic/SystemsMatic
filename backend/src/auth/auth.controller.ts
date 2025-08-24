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
      httpOnly: false, // Temporairement désactivé pour debug
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' pour domaines différents en prod
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      path: '/',
      domain:
        process.env.NODE_ENV === 'production' ? '.netlify.app' : undefined, // Domaine partagé pour Netlify
    };

    // Log pour debug
    console.log('Login - Cookie options:', {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      domain: cookieOptions.domain,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Vérifier que le token n'est pas vide avant de le mettre dans le cookie
    if (!result.access_token) {
      throw new Error('Token de connexion invalide');
    }

    // Log pour debug
    console.log('Login - Token created:', {
      tokenLength: result.access_token.length,
      tokenStart: result.access_token.substring(0, 20) + '...',
    });

    // Définir le token dans un cookie HTTP-only
    res.cookie('access_token', result.access_token, cookieOptions);

    // Log pour debug - vérifier les headers de réponse
    console.log('Login - Response headers:', {
      'Set-Cookie': res.getHeaders()['set-cookie'],
    });

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
      httpOnly: false, // Temporairement désactivé pour debug
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' pour domaines différents en prod
      path: '/',
      domain:
        process.env.NODE_ENV === 'production' ? '.netlify.app' : undefined, // Domaine partagé pour Netlify
    };

    // Log pour debug
    console.log('Logout - Cookie options:', {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      domain: cookieOptions.domain,
      NODE_ENV: process.env.NODE_ENV,
    });

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
    // Log pour debug
    console.log('Profile - Request cookies:', req.cookies);
    console.log('Profile - User from JWT:', req.user);

    // Récupérer les données complètes de l'utilisateur depuis la base de données
    const user = await this.authService.getUserProfile(req.user.id);
    return user;
  }
}
