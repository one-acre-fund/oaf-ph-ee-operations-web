import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { browserTracingIntegration } from '@sentry/angular';
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
        if (environment.sentry?.enabled && environment.sentry?.dsn) {
            Sentry.init({
                dsn: environment.sentry.dsn,
                environment: environment.sentry.environment,
                integrations: [
                    browserTracingIntegration(),
                ],
                // Performance Monitoring
                tracesSampleRate: environment.production ? 0.1 : 1,
                // Release Health
                release: environment.version,
                beforeSend(event: any, hint: any) {
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
                        if (error?.toString?.().includes('hydration')) {
                            console.log('🚫 Filtered out hydration error');
                            return null;
                        }

                        // Don't filter HTTP errors - these are important
                        if (error?.name === 'HttpError' || error?.name === 'HttpErrorResponse') {
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
        if (environment.sentry?.enabled) {
            Sentry.captureMessage(message, level);
        }
    }

    /**
     * Capture an exception
     */
    public captureException(error: any): void {
        if (environment.sentry?.enabled) {
            Sentry.captureException(error);
        }
    }

    /**
     * Add breadcrumb
     */
    public addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
        if (environment.sentry?.enabled) {
            Sentry.addBreadcrumb(breadcrumb);
        }
    }

    /**
     * Set user context
     */
    public setUser(user: Sentry.User | null): void {
        if (environment.sentry?.enabled) {
            Sentry.setUser(user);
        }
    }

    /**
     * Set tag
     * Pass undefined as value to remove/clear the tag
     */
    public setTag(key: string, value: string | undefined): void {
        if (environment.sentry?.enabled) {
            Sentry.setTag(key, value);
        }
    }

    /**
     * Set context
     */
    public setContext(key: string, context: Record<string, any>): void {
        if (environment.sentry?.enabled) {
            Sentry.setContext(key, context);
        }
    }

    /**
     * Create a new scope for isolated error reporting
     */
    public withScope(callback: (scope: Sentry.Scope) => void): void {
        if (environment.sentry?.enabled) {
            Sentry.withScope(callback);
        }
    }
}
