import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

@Module({
  imports: [PrometheusModule.register()],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Compteur global des requêtes HTTP',
      labelNames: ['method', 'route', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Histogramme de la durée des requêtes HTTP',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    }),
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class MonitoringModule {}
