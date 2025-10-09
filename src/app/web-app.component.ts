/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

/** rxjs Imports */
import { merge } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

/** Translation Imports */
import { TranslateService } from '@ngx-translate/core';

/** Environment Configuration */
import { environment } from 'environments/environment';

/** Custom Services */
import { AlertService } from './core/alert/alert.service';
import { MatomoService } from './core/analytics/matomo.service';
import { I18nService } from './core/i18n/i18n.service';
import { Logger } from './core/logger/logger.service';
import { SentryRouterService } from './core/services/sentry-router.service';
import { SentryService } from './core/services/sentry.service';
import { ThemeStorageService } from './shared/theme-picker/theme-storage.service';

/** Custom Models */
import { Alert } from './core/alert/alert.model';

/** Initialize Logger */
const log = new Logger('MifosX');

/**
 * Main web app component.
 */
@Component({
  selector: 'mifosx-web-app',
  templateUrl: './web-app.component.html',
  styleUrls: ['./web-app.component.scss'],
})
export class WebAppComponent implements OnInit {
  /**
   * @param {Router} router Router for navigation.
   * @param {ActivatedRoute} activatedRoute Activated Route.
   * @param {Title} titleService Title Service.
   * @param {TranslateService} translateService Translate Service.
   * @param {I18nService} i18nService I18n Service.
   * @param {ThemeStorageService} themeStorageService Theme Storage Service.
   * @param {MatSnackBar} snackBar Material Snackbar for notifications.
   * @param {AlertService} alertService Alert Service.
   * @param {MatomoService} matomoService Matomo Analytics Service.
   * @param {SentryService} sentryService Sentry Error Reporting Service.
   * @param {SentryRouterService} sentryRouterService Sentry Router Tracking Service.
   */
  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly titleService: Title,
    private readonly translateService: TranslateService,
    private readonly i18nService: I18nService,
    private readonly themeStorageService: ThemeStorageService,
    public snackBar: MatSnackBar,
    private readonly alertService: AlertService,
    private readonly matomoService: MatomoService,
    private readonly sentryService: SentryService,
    private readonly sentryRouterService: SentryRouterService
  ) { }

  /**
   * Initial Setup:
   *
   * 1) Logger
   *
   * 2) Language and Translations
   *
   * 3) Page Title
   *
   * 4) Theme
   *
   * 5) Alerts
   */
  ngOnInit() {
    // Setup logger
    if (environment.production) {
      Logger.enableProductionMode();
    }
    log.debug('init');

    // Initialize Sentry context
    this.initializeSentryContext();

    // Setup translations
    this.i18nService.init(
      environment.defaultLanguage,
      environment.supportedLanguages
    );

    // Change page title on navigation or language change, based on route data
    const onNavigationEnd = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    );
    merge(this.translateService.onLangChange, onNavigationEnd)
      .pipe(
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data)
      )
      .subscribe((event) => {
        const title = event['title'];
        if (title) {
          const pageTitle = `${this.translateService.instant(title)} | Mifos X`;
          this.titleService.setTitle(pageTitle);
          // Track page view with Matomo
          this.matomoService.trackPageView(this.router.url, pageTitle);
        }
      });

    // Track navigation events with Matomo
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Track page view for navigation without title data
        this.matomoService.trackPageView(event.urlAfterRedirects);
      });

    // Setup theme
    const theme = this.themeStorageService.getTheme();
    if (theme) {
      this.themeStorageService.installTheme(theme);
    }

    // Setup alerts
    this.alertService.alertEvent.subscribe((alertEvent: Alert) => {
      this.snackBar.open(`${alertEvent.message}`, 'Close', {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    });
  }

  /**
   * Initialize Sentry context with application-specific information
   */
  private initializeSentryContext(): void {
    // Set basic application context
    this.sentryService.setContext('application', {
      name: 'OAF Payment Hub Operations Web',
      version: environment.version,
      environment: environment.name
    });

    // Set initial tags
    this.sentryService.setTag('application', 'payment-hub-web');
    this.sentryService.setTag('version', environment.version);

    // Add initial breadcrumb
    this.sentryService.addBreadcrumb({
      message: 'Application initialized',
      level: 'info',
      category: 'application',
      data: {
        version: environment.version,
        environment: environment.name
      }
    });
  }
}
