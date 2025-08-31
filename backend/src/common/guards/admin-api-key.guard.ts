import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { headers: any }>();
    const key = req.headers['x-admin-key'] as string | undefined;
    if (!key || key !== process.env.ADMIN_API_KEY)
      throw new UnauthorizedException('Admin key missing/invalid');
    return true;
  }
}
