import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular-ivy';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SentryService {

    constructor() { }

    /**
     * Initialize Sentry with configuration
     */
    public static init(): void {
        if (environment.sentry && environment.sentry.enabled && environment.sentry.dsn) {
            Sentry.init({
                dsn: environment.sentry.dsn,
                environment: environment.sentry.environment,
                integrations: [
                    new Sentry.BrowserTracing({
                        // Set tracing origins to connect sentry for performance monitoring
                        tracePropagationTargets: [
                            'localhost',
                            /^https:\/\/yourapi-domain\.com\/api/,
                            /^https:\/\/.*\.oneacrefund\.org/,
                        ],
                    }),
                ],
                // Performance Monitoring
                tracesSampleRate: environment.production ? 0.1 : 1.0,
                // Release Health
                release: environment.version,
                beforeSend(event, hint) {
                    // Enhanced logging for debugging
                    if (!environment.production) {
                        console.log('📤 Sentry beforeSend:', {
                            event: event,
                            hint: hint,
                            eventType: event.type,
                            exception: event.exception,
                            message: event.message
                        });
                    }

                    // Filter out certain errors or modify events before sending
                    if (event.exception) {
                        const error = hint.originalException;

                        // Skip common Angular hydration errors or other non-critical errors
                        if (error && error.toString && error.toString().includes('hydration')) {
                            console.log('🚫 Filtered out hydration error');
                            return null;
                        }

                        // Don't filter HTTP errors - these are important
                        if (error && ((error as any).name === 'HttpError' || (error as any).name === 'HttpErrorResponse')) {
                            console.log('✅ Allowing HTTP error through filter');
                            return event;
                        }
                    }

                    return event;
                },
                // Additional configuration
                attachStacktrace: true,
                maxBreadcrumbs: 50,
            });
        }
    }

    /**
     * Capture a message
     */
    public captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.captureMessage(message, level);
        }
    }

    /**
     * Capture an exception
     */
    public captureException(error: any): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.captureException(error);
        }
    }

    /**
     * Add breadcrumb
     */
    public addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.addBreadcrumb(breadcrumb);
        }
    }

    /**
     * Set user context
     */
    public setUser(user: Sentry.User): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.setUser(user);
        }
    }

    /**
     * Set tag
     */
    public setTag(key: string, value: string): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.setTag(key, value);
        }
    }

    /**
     * Set context
     */
    public setContext(key: string, context: Record<string, any>): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.setContext(key, context);
        }
    }

    /**
     * Create a new scope for isolated error reporting
     */
    public withScope(callback: (scope: Sentry.Scope) => void): void {
        if (environment.sentry && environment.sentry.enabled) {
            Sentry.withScope(callback);
        }
    }
}
