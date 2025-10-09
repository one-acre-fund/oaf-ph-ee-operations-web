import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SentryService } from './sentry.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    constructor(private readonly sentryService: SentryService) { }

    handleError(error: any): void {
        // Log to console for development
        if (!environment.production) {
            console.error('Global error caught:', error);
        }

        // Extract the actual error if it's wrapped
        const actualError = this.extractError(error);

        // Send to Sentry if enabled
        if (environment.sentry?.enabled) {
            this.sentryService.captureException(actualError);
        }

        // You can also send errors to other logging services here
        // For example, a custom logging service or analytics
    }

    private extractError(error: any): any {
        // If it's a wrapped error, extract the original error
        if (error?.originalError) {
            return error.originalError;
        }

        // If it's a rejection with a reason, extract the reason
        if (error?.rejection) {
            return error.rejection;
        }

        // Otherwise return the error as is
        return error;
    }
}
