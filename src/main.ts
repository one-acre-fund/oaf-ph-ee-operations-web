/**
 * Entry point of the application.
 * Only platform bootstrapping code should be here.
 * For app-specific initialization, use `app/web-app.component.ts`.
 */

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { SentryService } from './app/core/services/sentry.service';
import { environment } from './environments/environment';

// Initialize Sentry conditionally based on configuration
if (environment.sentry?.enabled === true &&
  environment.sentry?.dsn &&
  environment.sentry.dsn.trim() !== '') {
  SentryService.init();
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.log(err);
    // If Sentry is enabled, capture the bootstrap error
    if (environment.sentry?.enabled) {
      const sentryService = new SentryService();
      sentryService.captureException(err);
    }
  });
