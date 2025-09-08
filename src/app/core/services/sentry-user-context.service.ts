import { Injectable } from '@angular/core';
import { SentryService } from './sentry.service';

@Injectable({
    providedIn: 'root'
})
export class SentryUserContextService {

    constructor(private sentryService: SentryService) { }

    /**
     * Set user context in Sentry when user logs in
     * Call this method after successful authentication
     */
    setUserContext(userInfo: {
        id?: string;
        username?: string;
        email?: string;
        tenant?: string;
        role?: string;
        [key: string]: any;
    }): void {
        const sentryUser: any = {
            id: userInfo.id || userInfo.username,
            username: userInfo.username,
            email: userInfo.email,
        };

        // Add additional context as extras
        if (userInfo.tenant || userInfo.role) {
            sentryUser.extra = {};
            if (userInfo.tenant) sentryUser.extra.tenant = userInfo.tenant;
            if (userInfo.role) sentryUser.extra.role = userInfo.role;

            // Add any other custom fields
            Object.keys(userInfo).forEach(key => {
                if (!['id', 'username', 'email', 'tenant', 'role'].includes(key)) {
                    sentryUser.extra[key] = userInfo[key];
                }
            });
        }

        this.sentryService.setUser(sentryUser);

        // Set additional tags for filtering
        if (userInfo.tenant) {
            this.sentryService.setTag('user.tenant', userInfo.tenant);
        }
        if (userInfo.role) {
            this.sentryService.setTag('user.role', userInfo.role);
        }

        // Add breadcrumb for user login
        this.sentryService.addBreadcrumb({
            message: 'User logged in',
            level: 'info',
            category: 'auth',
            data: {
                userId: sentryUser.id,
                username: sentryUser.username,
                tenant: userInfo.tenant
            }
        });
    }

    /**
     * Clear user context when user logs out
     */
    clearUserContext(): void {
        this.sentryService.setUser(null);

        // Remove user-related tags
        this.sentryService.setTag('user.tenant', '');
        this.sentryService.setTag('user.role', '');

        // Add breadcrumb for user logout
        this.sentryService.addBreadcrumb({
            message: 'User logged out',
            level: 'info',
            category: 'auth'
        });
    }

    /**
     * Update user context with additional information
     * Useful for updating context as user navigates or performs actions
     */
    updateUserContext(updates: Record<string, any>): void {
        this.sentryService.withScope((scope) => {
            const currentUser = scope.getUser();
            if (currentUser) {
                const updatedUser = {
                    ...currentUser,
                    extra: {
                        ...currentUser.extra,
                        ...updates
                    }
                };
                this.sentryService.setUser(updatedUser);
            }
        });
    }
}
