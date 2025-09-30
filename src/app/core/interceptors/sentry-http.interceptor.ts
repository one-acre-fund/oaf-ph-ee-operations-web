import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SentryService } from '../services/sentry.service';

@Injectable()
export class SentryHttpInterceptor implements HttpInterceptor {

    constructor(private readonly sentryService: SentryService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler) {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Only process HTTP errors, not network errors
                if (error instanceof HttpErrorResponse) {
                    console.log('🔍 SentryHttpInterceptor caught HTTP error:', {
                        status: error.status,
                        url: request.url,
                        method: request.method,
                        message: error.message
                    });

                    // Add breadcrumb for the HTTP error
                    this.sentryService.addBreadcrumb({
                        message: `HTTP ${error.status}: ${request.method} ${request.url}`,
                        level: 'error',
                        data: {
                            url: request.url,
                            method: request.method,
                            status: error.status,
                            statusText: error.statusText,
                            message: error.message
                        },
                        category: 'http'
                    });

                    // Create a more descriptive error for Sentry
                    const sentryError = new Error(`HTTP ${error.status}: ${request.method} ${request.url} - ${error.statusText}`);
                    sentryError.name = 'HttpError';

                    // Add the original error details as properties
                    (sentryError as any).httpStatus = error.status;
                    (sentryError as any).httpUrl = request.url;
                    (sentryError as any).httpMethod = request.method;
                    (sentryError as any).originalError = error;

                    // Set additional context for the error
                    this.sentryService.withScope((scope) => {
                        // Set tags for filtering in Sentry
                        scope.setTag('error.type', 'http');
                        scope.setTag('http.status_code', error.status.toString());
                        scope.setTag('http.method', request.method);
                        scope.setLevel(this.getErrorLevel(error.status));

                        scope.setContext('http_request', {
                            url: request.url,
                            method: request.method,
                            headers: this.sanitizeHeaders(request.headers.keys()),
                        });

                        scope.setContext('http_response', {
                            status: error.status,
                            statusText: error.statusText,
                            url: error.url,
                            message: error.message,
                            body: typeof error.error === 'string' ? error.error.substring(0, 500) : 'Non-string response'
                        });

                        // Capture the enhanced error
                        this.sentryService.captureException(sentryError);

                        if (!environment.production) {
                            console.log('📤 HTTP error sent to Sentry:', sentryError.message);
                        }
                    });
                }

                return throwError(() => error);
            })
        );
    }

    private getErrorLevel(status: number): 'fatal' | 'error' | 'warning' | 'info' {
        if (status >= 500) return 'error';
        if (status >= 400) return 'warning';
        return 'info';
    }

    private sanitizeHeaders(headers: string[]): Record<string, string> {
        const sanitized: Record<string, string> = {};
        const excludeHeaders = new Set(['authorization', 'cookie', 'x-api-key']);

        for (const header of headers) {
            if (!excludeHeaders.has(header.toLowerCase())) {
                sanitized[header] = '[Header Value]';
            }
        }

        return sanitized;
    }
}
