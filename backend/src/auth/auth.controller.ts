import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);

    // Définir le cookie HTTP-only pour le token
    res.cookie('auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // 'none' pour cross-site en production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    });

    // Définir le cookie HTTP-only pour les données utilisateur
    res.cookie('auth_user', JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    });

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
    res.cookie('auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    });

    // Définir le cookie HTTP-only pour les données utilisateur
    res.cookie('auth_user', JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    });

    // Retourner la réponse sans le token (il est maintenant dans le cookie)
    return res.status(HttpStatus.CREATED).json({
      message: 'Inscription réussie',
      user: result.user,
    });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    // Supprimer les cookies d'authentification
    res.clearCookie('auth_token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    res.clearCookie('auth_user', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

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
    res.cookie('auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    });

    // Définir le cookie HTTP-only pour les données utilisateur
    res.cookie('auth_user', JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
    });

    // Retourner la réponse sans le token (il est maintenant dans le cookie)
    return res.status(HttpStatus.OK).json({
      message: 'Connexion réussie',
      user: result.user,
    });
  }
}
