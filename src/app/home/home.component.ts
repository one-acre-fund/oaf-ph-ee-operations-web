/** Angular Imports */
import { Component, OnInit } from '@angular/core';

/** Custom Services */
import { AuthenticationService } from '../core/authentication/authentication.service';
import { KeycloakAuthService } from '../core/authentication/keycloak.service';

/** Environment Configuration */
import { environment } from '../../environments/environment';

/**
 * Home component.
 */
@Component({
  selector: 'mifosx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /** Username of authenticated user. */
  username: string;

  constructor(
    private authenticationService: AuthenticationService,
    private keycloakAuthService: KeycloakAuthService
  ) { }

  /**
   * Sets the username of the authenticated user.
   */
  ngOnInit() {
    if (environment.oauth.enabled) {
      this.resolveKeycloakUsername();
      setTimeout(() => this.resolveKeycloakUsername(), 1000);
    } else {
      const credentials = this.authenticationService.getCredentials();
      this.username = credentials ? credentials.username : 'User';
    }
  }

  private resolveKeycloakUsername() {
    try {
      const name = this.keycloakAuthService.getUsername('name');
      if (name && name !== 'Keycloak User') {
        this.username = name;
      } else if (!this.username) {
        this.username = 'User';
      }
    } catch {
      if (!this.username) { this.username = 'User'; }
    }
  }

}
