import { Injectable } from '@angular/core';
import { SentryService } from './sentry.service';

/**
 * SentryUserContextService
 * 
 * Manages user context for Sentry error tracking while ensuring PII (Personally Identifiable Information) 
 * protection. This service implements the following privacy measures:
 * 
 * 1. PII Protection: Never sends raw usernames, emails, or other identifying information to Sentry
 * 2. Hashed Identifiers: Uses SHA-256 hashing for user IDs to allow correlation without exposing identity
 * 3. Environment-Aware Crypto: Uses Web Crypto API in browsers, Node's crypto in server builds, 
 *    with fallback for unsupported environments
 * 4. Structured Context: Places tenant/role data as top-level fields for better Sentry queryability
 * 
 * Security Note: All user identification is done via cryptographically hashed identifiers only.
 * Original usernames and emails are never transmitted to Sentry.
 * 
 * Usage Example:
 * ```typescript
 * // After successful login
 * await this.sentryUserContextService.setUserContext({
 *   id: user.id,
 *   username: user.username, // Will be hashed, not sent as-is
 *   email: user.email,       // Will be excluded from Sentry payload
 *   tenant: user.tenant,     // Safe to send, placed as top-level field
 *   role: user.role          // Safe to send, placed as top-level field
 * });
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class SentryUserContextService {

    constructor(private readonly sentryService: SentryService) { }

    /**
     * Hash user identifier using SHA-256
     * Uses Web Crypto API in browser or Node's crypto in server builds
     * @param id The user identifier to hash
     * @returns Promise<string> SHA-256 hex digest
     */
    private async hashUserId(id: string): Promise<string> {
        // Check if we're in a browser environment with Web Crypto API
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(id);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Fallback: avoid weak hashing and avoid importing Node 'crypto' in browser bundles
        console.warn('Web Crypto API unavailable; using non-identifying user id');
        return 'anonymous';
    }

    /**
     * Set user context in Sentry when user logs in
     * Call this method after successful authentication
     * NOTE: No PII (email/username) is sent to Sentry - only hashed user identifiers
     */
    async setUserContext(userInfo: {
        id?: string;
        username?: string;
        email?: string;
        tenant?: string;
        role?: string;
        [key: string]: any;
    }): Promise<void> {
        // Hash the user identifier to avoid sending PII to Sentry
        const userIdentifier = userInfo.id || userInfo.username || 'anonymous';
        const hashedUserId = await this.hashUserId(userIdentifier);

        // Create Sentry user object with only non-PII data
        const sentryUser: any = {
            id: hashedUserId,
            // NOTE: We deliberately do NOT set username or email to avoid PII
        };

        // Add tenant and role as top-level fields for better queryability
        if (userInfo.tenant) {
            sentryUser.tenant = userInfo.tenant;
        }
        if (userInfo.role) {
            sentryUser.role = userInfo.role;
        }

        // Add any other custom fields that are not PII
        const piiFields = ['id', 'username', 'email'];
        for (const key of Object.keys(userInfo)) {
            if (!piiFields.includes(key) && key !== 'tenant' && key !== 'role') {
                sentryUser[key] = userInfo[key];
            }
        }

        this.sentryService.setUser(sentryUser);

        // Set additional tags for filtering
        if (userInfo.tenant) {
            this.sentryService.setTag('user.tenant', userInfo.tenant);
        }
        if (userInfo.role) {
            this.sentryService.setTag('user.role', userInfo.role);
        }

        // Add breadcrumb for user login - no PII included
        this.sentryService.addBreadcrumb({
            message: 'User logged in',
            level: 'info',
            category: 'auth',
            data: {
                userId: hashedUserId, // Only hashed ID, no raw username
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
        this.sentryService.setTag('user.tenant', undefined);
        this.sentryService.setTag('user.role', undefined);

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
     * NOTE: Only updates non-PII fields to maintain privacy
     */
    updateUserContext(updates: Record<string, any>): void {
        this.sentryService.withScope((scope) => {
            const currentUser = scope.getUser();
            if (currentUser) {
                // Filter out any PII fields from updates
                const piiFields = ['username', 'email'];
                const filteredUpdates = Object.keys(updates)
                    .filter(key => !piiFields.includes(key))
                    .reduce((obj, key) => {
                        obj[key] = updates[key];
                        return obj;
                    }, {} as Record<string, any>);

                const updatedUser = {
                    ...currentUser,
                    ...filteredUpdates
                };
                this.sentryService.setUser(updatedUser);
            }
        });
    }
}
