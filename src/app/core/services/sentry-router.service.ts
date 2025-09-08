import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SentryService } from '../services/sentry.service';

@Injectable({
    providedIn: 'root'
})
export class SentryRouterService {

    constructor(
        private router: Router,
        private sentryService: SentryService
    ) {
        this.initRouterTracking();
    }

    private initRouterTracking(): void {
        // Track successful navigation
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            // Add breadcrumb for successful navigation
            this.sentryService.addBreadcrumb({
                message: `Navigation to: ${event.url}`,
                level: 'info',
                category: 'navigation',
                data: {
                    from: event.urlAfterRedirects,
                    to: event.url
                }
            });

            // Set current route context
            this.sentryService.setTag('route', event.url);
        });

        // Track navigation errors
        this.router.events.pipe(
            filter(event => event instanceof NavigationError)
        ).subscribe((event: NavigationError) => {
            // Add breadcrumb for navigation error
            this.sentryService.addBreadcrumb({
                message: `Navigation error to: ${event.url}`,
                level: 'error',
                category: 'navigation',
                data: {
                    url: event.url,
                    error: event.error?.message || 'Unknown navigation error'
                }
            });

            // Capture the navigation error
            this.sentryService.withScope((scope) => {
                scope.setTag('navigation.error', 'true');
                scope.setContext('navigation', {
                    url: event.url,
                    id: event.id
                });
                this.sentryService.captureException(event.error);
            });
        });
    }

    /**
     * Track a custom page view event
     */
    public trackPageView(url: string, title?: string): void {
        this.sentryService.addBreadcrumb({
            message: `Page view: ${title || url}`,
            level: 'info',
            category: 'pageview',
            data: {
                url,
                title
            }
        });
    }
}
