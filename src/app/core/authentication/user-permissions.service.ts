/** Angular Imports */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** rxjs Imports */
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  permissions: string[];
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserPermissionsService {

  private userProfile$ = new BehaviorSubject<UserProfile | null>(null);

  constructor(private http: HttpClient) {}

  async loadPermissions(email: string): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<UserProfile>(`/api/v1/users/${encodeURIComponent(email)}/username`));
      this.userProfile$.next(user ?? null);
    } catch (error) {
      console.warn('Failed to load user permissions from backend:', error);
    }
  }

  hasPermission(permission: string): boolean {
    const profile = this.userProfile$.getValue();
    if (!profile) { return false; }
    return profile.permissions.includes('ALL_FUNCTIONS') || profile.permissions.includes(permission);
  }

  getProfile(): UserProfile | null {
    return this.userProfile$.getValue();
  }

  getPermissions(): string[] {
    return this.userProfile$.getValue()?.permissions ?? [];
  }

  getRoles(): string[] {
    return this.userProfile$.getValue()?.roles ?? [];
  }

  /** Observable for components that need to react to profile changes. */
  get profile$() {
    return this.userProfile$.asObservable();
  }
}
