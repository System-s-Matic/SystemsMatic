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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  getCookieOptions,
  getClearCookieOptions,
} from '../config/cookie.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
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
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/local')
  async loginLocal(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user);

    // Définir le cookie HTTP-only pour le token
    res.cookie('auth_token', result.access_token, getCookieOptions());

    // Définir le cookie HTTP-only pour les données utilisateur
    res.cookie('auth_user', JSON.stringify(result.user), getCookieOptions());

    return res.status(HttpStatus.OK).json({
      message: 'Connexion locale réussie',
      user: result.user,
    });
  }

  @Get('debug-cookies')
  async debugCookies(@Request() req, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      cookies: req.cookies,
      headers: req.headers,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
    });
  }

  @Get('test-cookies')
  async testCookies(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      message: 'Cookie de test défini',
      cookieOptions: getCookieOptions(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
      },
    });
  }
}
