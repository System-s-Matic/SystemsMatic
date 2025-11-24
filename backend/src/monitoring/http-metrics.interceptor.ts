import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const startTime = process.hrtime();

    let observed = false;
    const observe = () => {
      if (observed) {
        return;
      }
      observed = true;

      const route =
        req.route?.path || req.originalUrl?.split('?')[0] || 'unknown';
      const status = res.statusCode?.toString() || '0';
      const labels = {
        method: req.method,
        route,
        status,
      };

      this.requestCounter.inc(labels);

      const diff = process.hrtime(startTime);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      this.requestDuration.observe(labels, durationInSeconds);
    };

    res.once('finish', observe);
    res.once('close', observe);

    return next.handle();
  }
}
