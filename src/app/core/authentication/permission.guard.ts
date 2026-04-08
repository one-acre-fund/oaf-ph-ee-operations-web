/** Angular Imports */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

/** Custom Services */
import { AuthenticationService } from './authentication.service';

/**
 * Route-level permission guard.
 *
 * Reads `data.permissions` (string[]) from the route and blocks access unless
 * the authenticated user holds at least one of the listed permissions (or
 * ALL_FUNCTIONS, which is always sufficient).
 *
 * Usage in route definition:
 *   canActivate: [PermissionGuard],
 *   data: { permissions: ['READ_USER', 'READ_AUDIT'] }
 */
@Injectable()
export class PermissionGuard {

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required: string[] = route.data?.['permissions'] ?? [];

    // No permissions configured — allow through (AuthenticationGuard already enforces login)
    if (required.length === 0) {
      return true;
    }

    const hasAccess = required.some(p => this.authenticationService.hasAccess(p));
    if (hasAccess) {
      return true;
    }

    this.router.navigate(['/home'], { replaceUrl: true });
    return false;
  }
}
