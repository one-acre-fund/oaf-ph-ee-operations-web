/** Angular Imports */
import { Directive, Input, HostListener, ElementRef } from "@angular/core";

/** Custom Services */
import { MatomoService } from "../analytics/matomo.service";

/**
 * Matomo Click Tracking Directive
 *
 * Usage: <button matomoClick="Button" category="Navigation" name="Header Menu">Click me</button>
 */
@Directive({
  selector: "[mifosxMatomoClick]",
})
export class MatomoClickDirective {
  @Input() mifosxMatomoClick: string; // Action
  @Input() category = "User Interaction";
  @Input() name?: string;
  @Input() value?: number;

  constructor(
    private matomoService: MatomoService,
    private elementRef: ElementRef
  ) {}

  @HostListener("click", ["$event"])
  onClick(event: Event): void {
    const action = this.mifosxMatomoClick || "Click";
    const name = this.name || this.getElementText();

    this.matomoService.trackEvent(this.category, action, name, this.value);
  }

  private getElementText(): string {
    const element = this.elementRef.nativeElement;
    return element.textContent?.trim() || element.value || "Unknown Element";
  }
}

/**
 * Matomo Form Tracking Directive
 *
 * Usage: <form matomoForm="Contact Form" (ngSubmit)="onSubmit()">
 */
@Directive({
  selector: "[mifosxMatomoForm]",
})
export class MatomoFormDirective {
  @Input() mifosxMatomoForm: string; // Form name

  constructor(private matomoService: MatomoService) {}

  @HostListener("submit", ["$event"])
  onSubmit(event: Event): void {
    const formName = this.mifosxMatomoForm || "Unknown Form";
    // Assume success by default, let the component handle errors
    this.matomoService.trackFormSubmission(formName, true);
  }

  @HostListener("invalid", ["$event"])
  onInvalid(event: Event): void {
    const formName = this.mifosxMatomoForm || "Unknown Form";
    this.matomoService.trackFormSubmission(formName, false);
  }
}

/**
 * Matomo Download Tracking Directive
 *
 * Usage: <a matomoDownload [href]="downloadUrl">Download File</a>
 */
@Directive({
  selector: "[mifosxMatomoDownload]",
})
export class MatomoDownloadDirective {
  @Input() mifosxMatomoDownload?: string; // Optional custom URL

  constructor(
    private matomoService: MatomoService,
    private elementRef: ElementRef
  ) {}

  @HostListener("click", ["$event"])
  onClick(event: Event): void {
    const element = this.elementRef.nativeElement;
    const downloadUrl =
      this.mifosxMatomoDownload || element.href || element.getAttribute("href");

    if (downloadUrl) {
      this.matomoService.trackDownload(downloadUrl);
    }
  }
}

/**
 * Matomo Outbound Link Tracking Directive
 *
 * Usage: <a mifosxMatomoOutbound [href]="externalUrl">External Link</a>
 */
@Directive({
  selector: "[mifosxMatomoOutbound]",
})
export class MatomoOutboundDirective {
  @Input() mifosxMatomoOutbound?: string; // Optional custom URL

  constructor(
    private matomoService: MatomoService,
    private elementRef: ElementRef
  ) {}

  @HostListener("click", ["$event"])
  onClick(event: Event): void {
    const element = this.elementRef.nativeElement;
    const linkUrl =
      this.mifosxMatomoOutbound || element.href || element.getAttribute("href");

    if (linkUrl && this.isExternalLink(linkUrl)) {
      this.matomoService.trackOutboundLink(linkUrl);
    }
  }

  private isExternalLink(url: string): boolean {
    try {
      const link = new URL(url, window.location.href);
      return link.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }
}
