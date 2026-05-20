/** Angular Imports */
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

/** Keycloak Imports */
import { KeycloakAngularModule } from 'keycloak-angular';

/** Tanslation Imports */
import { TranslateModule } from '@ngx-translate/core';

/** Chart Imports */
import { NgxChartsModule } from '@swimlane/ngx-charts';

/** Environment Configuration */
import { environment } from 'environments/environment';

/** Main Component */
import { WebAppComponent } from './web-app.component';

/** Not Found Component */
import { NotFoundComponent } from './not-found/not-found.component';

/** Load config dynamically */
import { AppConfig } from './app.config';

/** Keycloak Services */
import { KeycloakAuthService } from './core/authentication/keycloak.service';

/** Sentry Services */
import { GlobalErrorHandler } from './core/services/global-error-handler.service';

/** Custom Modules */
import { CoreModule } from './core/core.module';
import { HomeModule } from './home/home.module';
import { LoginModule } from './login/login.module';
import { PaymentHubModule } from './payment-hub/paymenthub.module';
import { SettingsModule } from './settings/settings.module';
import { SystemModule } from './system/system.module';
import { UsersModule } from './users/users.module';


/** Main Routing Module */
import { AppRoutingModule } from './app-routing.module';

import { DatePipe } from '@angular/common';
import { SentryHttpInterceptor } from './core/interceptors/sentry-http.interceptor';

/** Load configuration.properties before Keycloak so oauth.* overrides apply. */
export function initConfigAndKeycloak(
  config: AppConfig,
  keycloakAuthService: KeycloakAuthService
) {
  return async () => {
    await config.load();
    try {
      await keycloakAuthService.initKeycloak();
    } catch (error) {
      console.warn('Keycloak initialization failed:', error);
    }
  };
}

/**
 * App Module
 *
 * Core module and all feature modules should be imported here in proper order.
 */
@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
    TranslateModule.forRoot(),
    NgxChartsModule,
    KeycloakAngularModule,
    CoreModule,
    HomeModule,
    LoginModule,
    SettingsModule,
    SystemModule,
    UsersModule,
    PaymentHubModule,
    AppRoutingModule,
  ],
  declarations: [WebAppComponent, NotFoundComponent],
  providers: [DatePipe,
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfigAndKeycloak,
      deps: [AppConfig, KeycloakAuthService],
      multi: true
    },
    // Sentry Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    // Sentry HTTP Interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SentryHttpInterceptor,
      multi: true,
    }],
  bootstrap: [WebAppComponent]
})
export class AppModule { }
