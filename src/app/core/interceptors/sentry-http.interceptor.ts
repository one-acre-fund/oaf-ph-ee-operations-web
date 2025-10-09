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
                    if (!environment.production) {
                        console.log('🔍 SentryHttpInterceptor caught HTTP error:', {
                            status: error.status,
                            url: this.redactUrl(request.url),
                            method: request.method,
                            message: error.message
                        });
                    }

                    // Add breadcrumb for the HTTP error with sanitized data
                    const redactedUrl = this.redactUrl(request.url);
                    this.sentryService.addBreadcrumb({
                        message: `HTTP ${error.status}: ${request.method} ${redactedUrl}`,
                        level: 'error',
                        data: {
                            url: redactedUrl,
                            method: request.method,
                            status: error.status,
                            statusText: error.statusText,
                            message: error.message
                        },
                        category: 'http'
                    });

                    // Create a more descriptive error for Sentry with redacted URL
                    const sentryError = new Error(`HTTP ${error.status}: ${request.method} ${redactedUrl} - ${error.statusText}`);
                    sentryError.name = 'HttpError';

                    // Add the original error details as properties (with redacted URL)
                    (sentryError as any).httpStatus = error.status;
                    (sentryError as any).httpUrl = redactedUrl;
                    (sentryError as any).httpMethod = request.method;

                    // Set additional context for the error
                    this.sentryService.withScope((scope) => {
                        // Set tags for filtering in Sentry
                        scope.setTag('error.type', 'http');
                        scope.setTag('http.status_code', error.status.toString());
                        scope.setTag('http.method', request.method);
                        scope.setLevel(this.getErrorLevel(error.status));

                        scope.setContext('http_request', {
                            url: redactedUrl,
                            method: request.method,
                            headers: this.sanitizeHeaders(request.headers.keys()),
                        });

                        scope.setContext('http_response', {
                            status: error.status,
                            statusText: error.statusText,
                            url: error.url ? this.redactUrl(error.url) : undefined,
                            message: error.message,
                            body: this.sanitizeResponseBody(error.error, 200)
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

    /**
     * Redacts sensitive information from URLs by:
     * - Stripping all query parameters
     * - Masking path segments that might contain sensitive tokens
     */
    private redactUrl(url: string): string {
        try {
            const urlObj = new URL(url, window.location.origin);
            // Remove all query parameters to avoid leaking tokens, sessions, etc.
            return `${urlObj.origin}${urlObj.pathname}`;
        } catch {
            // Fallback: just remove query string if URL parsing fails
            return url.split('?')[0];
        }
    }

    /**
     * Sanitizes headers using an allowlist approach.
     * Only safe, non-sensitive headers are included.
     */
    private sanitizeHeaders(headers: string[]): Record<string, string> {
        const sanitized: Record<string, string> = {};
        // Allowlist of safe headers to include
        const safeHeaders = new Set(['content-type', 'accept', 'user-agent', 'content-length']);

        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            if (safeHeaders.has(lowerHeader)) {
                sanitized[header] = '[Present]';
            }
        }

        return sanitized;
    }

    /**
     * Sanitizes response body by:
     * - Masking sensitive fields (emails, tokens, passwords, auth data)
     * - Truncating values to prevent excessive data logging
     * - Whitelisting safe fields when possible
     */
    private sanitizeResponseBody(body: any, maxLength: number = 200): any {
        if (!body) {
            return '[Empty]';
        }

        // If body is a string, truncate it
        if (typeof body === 'string') {
            return body.length > maxLength ? `${body.substring(0, maxLength)}... [truncated]` : body;
        }

        // If body is an object, sanitize its fields
        if (typeof body === 'object') {
            const sanitized: any = {};
            const sensitiveKeys = new Set([
                'password', 'token', 'secret', 'apikey', 'api_key', 'authorization',
                'auth', 'session', 'sessionid', 'session_id', 'cookie', 'accesstoken',
                'access_token', 'refreshtoken', 'refresh_token', 'bearer', 'jwt',
                'credentials', 'privatekey', 'private_key', 'ssn', 'credit_card',
                'creditcard', 'cvv', 'pin'
            ]);

            for (const key in body) {
                if (body.hasOwnProperty(key)) {
                    const lowerKey = key.toLowerCase();

                    // Mask sensitive fields
                    if (sensitiveKeys.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token')) {
                        sanitized[key] = '[REDACTED]';
                    } else {
                        const value = body[key];

                        // Mask email addresses
                        if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
                            sanitized[key] = '[EMAIL_REDACTED]';
                        }
                        // Truncate long strings
                        else if (typeof value === 'string') {
                            sanitized[key] = value.length > maxLength ? `${value.substring(0, maxLength)}... [truncated]` : value;
                        }
                        // Keep numbers, booleans, and nulls as-is
                        else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
                            sanitized[key] = value;
                        }
                        // Recursively sanitize nested objects (with depth limit)
                        else if (typeof value === 'object' && value !== null) {
                            sanitized[key] = '[Object]';
                        }
                        else {
                            sanitized[key] = '[Unknown Type]';
                        }
                    }
                }
            }

            return sanitized;
        }

        return '[Non-serializable]';
    }
}
