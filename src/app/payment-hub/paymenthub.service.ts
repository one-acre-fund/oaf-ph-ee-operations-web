import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dates } from 'app/core/utils/dates';
import { AlertService } from 'app/core/alert/alert.service';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, map, switchMap, takeWhile, tap } from 'rxjs/operators';

export type ExportType = 'TRANSFERS' | 'TRANSACTION_REQUESTS';

export interface ExportJob {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'DOWNLOADED' | 'EXPIRED';
  rowCount?: number;
  attempts: number;
  error?: { code: string; message: string };
}

@Injectable({
  providedIn: 'root'
})
export class PaymenthubService {

  static readonly EXPORTS_URL = '/api/v1/exports';
  static readonly POLL_INTERVAL_MS = 3000;

  constructor(private http: HttpClient, private dateUtils: Dates, private alertService: AlertService) { }

  /**
   * Runs an export on the server and downloads the CSV once it is ready. The export runs in the background, so
   * this starts it, checks its status every few seconds, then downloads the file. Errors are shown as alerts.
   * @param filterBy object containing the filters
   * @param type what to export
   * @param prefix the prefix to use for the file name
   * @returns emits each status of the export; completes once the file is downloaded, errors if the export failed
   */
  exportCSV(filterBy: any, type: ExportType, prefix: string): Observable<ExportJob> {
    const fileName = this.fileName(filterBy, prefix);
    const http = this.http.skipErrorHandler();
    return http.post<ExportJob>(PaymenthubService.EXPORTS_URL, this.exportRequest(filterBy, type)).pipe(
      switchMap(created => timer(0, PaymenthubService.POLL_INTERVAL_MS).pipe(
        switchMap(() => http.get<ExportJob>(`${PaymenthubService.EXPORTS_URL}/${created.jobId}`)))),
      tap(job => this.checkNotFailed(job)),
      // emits the finished status too, then completes
      takeWhile(job => job.status === 'QUEUED' || job.status === 'RUNNING', true),
      concatMap(job => job.status === 'SUCCEEDED' ? this.download(job, fileName) : of(job)),
      catchError(error => {
        this.alertService.alert({ type: 'Export Error', message: this.errorMessage(error) });
        return throwError(() => error);
      })
    );
  }

  private exportRequest(filterBy: any, type: ExportType): any {
    const filters: { [name: string]: string[] } = {
      transactionId: this.getValues(filterBy.transactionid),
      workflowInstanceKey: this.getValues(filterBy.workflowinstancekey),
      payerId: this.getValues(filterBy.payerid),
      payeeId: this.getValues(filterBy.payeeid),
      payerDfspId: this.getPayerDfspIdValues(filterBy.payerdfspid),
      state: filterBy.status ? [filterBy.status] : [],
    };
    if (type === 'TRANSACTION_REQUESTS') {
      filters.externalId = this.getValues(filterBy.externalid);
      filters.errorDescription = this.getValues(filterBy.errordescription);
    }
    // the server rejects filters it does not support for the type, even empty ones
    Object.keys(filters).filter(name => filters[name].length === 0).forEach(name => delete filters[name]);
    return {
      type,
      startFrom: this.dateUtils.formatDate(filterBy.startdate, 'yyyy-MM-dd HH:mm:ss') || undefined,
      startTo: this.dateUtils.formatDate(filterBy.enddate, 'yyyy-MM-dd HH:mm:ss') || undefined,
      filters,
    };
  }

  private fileName(filterBy: any, prefix: string): string {
    let fileFilters = '';
    if (filterBy.startdate) {
      fileFilters += `_FROM_${this.dateUtils.getDate(filterBy.startdate)}`;
    }
    if (filterBy.enddate) {
      fileFilters += `_TO_${this.dateUtils.getDate(filterBy.enddate)}`;
    }
    if (filterBy.status) {
      fileFilters += `_FOR_STATUS_${filterBy.status}`;
    }
    return `${prefix}${fileFilters}_AS_AT_${this.dateUtils.formatDate(new Date(), 'yyyy-MM-dd_HH:mm:ss')}.csv`;
  }

  private checkNotFailed(job: ExportJob): void {
    if (job.status === 'FAILED' || job.status === 'EXPIRED') {
      throw new ExportFailedError(job.error ? job.error.message : 'The export failed; run it again');
    }
  }

  private download(job: ExportJob, fileName: string): Observable<ExportJob> {
    if (job.rowCount === 0) {
      this.alertService.alert({ type: 'Export', message: 'No records found matching your criteria' });
      return of(job);
    }
    return this.http.skipErrorHandler()
      .get(`${PaymenthubService.EXPORTS_URL}/${job.jobId}/download`, { responseType: 'blob' })
      .pipe(
        tap(file => this.downloadFile(file, fileName)),
        map(() => job),
        catchError(() => throwError(() =>
          new ExportFailedError('The export file could not be downloaded; run the export again'))));
  }

  private errorMessage(error: any): string {
    if (error instanceof ExportFailedError) {
      return error.message;
    }
    if (error instanceof HttpErrorResponse && error.error && error.error.message) {
      const details: string[] = error.error.details || [];
      return details.length ? `${error.error.message}: ${details.join('; ')}` : error.error.message;
    }
    return 'The export could not be started; please try again later';
  }

  /**
   * Download a file.
   * @param data the file to download
   * @param fileTitle the name of the file to be downloaded
   */
  private downloadFile(data: Blob, fileTitle: string) {
    let url = window.URL.createObjectURL(data);
    let a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = fileTitle;
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get values from a comma separated string.
   * @param value comma separated string
   * @returns an array of values
   */
  private getValues(value: string): string[] {
    return value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
  }

  /** The multi-select gives an array; the quick export form gives a comma separated string. */
  private getPayerDfspIdValues(value: any): string[] {
    return Array.isArray(value) ? value : this.getValues(value);
  }
}

class ExportFailedError extends Error { }
