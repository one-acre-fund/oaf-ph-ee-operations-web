import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AlertService } from 'app/core/alert/alert.service';

import { ExportJob, PaymenthubService } from './paymenthub.service';

describe('PaymenthubService', () => {
  const EXPORTS = PaymenthubService.EXPORTS_URL;
  let service: PaymenthubService;
  let httpMock: HttpTestingController;
  let alerts: string[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DatePipe],
    });
    // the app's HttpService adds skipErrorHandler; the testing HttpClient does not have it
    const http = TestBed.inject(HttpClient) as any;
    http.skipErrorHandler = () => http;
    alerts = [];
    TestBed.inject(AlertService).alertEvent.subscribe(alert => alerts.push(alert.message));
    service = TestBed.inject(PaymenthubService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:export');
    spyOn(window.URL, 'revokeObjectURL');
  });

  afterEach(() => httpMock.verify());

  function job(status: ExportJob['status'], extra: Partial<ExportJob> = {}): ExportJob {
    return { jobId: 'job-1', status, attempts: 1, ...extra };
  }

  it('sends only the filters that have values, trimmed, with the dates in the server format', () => {
    service.exportCSV({
      transactionid: 'a, b,',
      workflowinstancekey: '',
      payerdfspid: ['123'],
      status: 'COMPLETED',
      startdate: new Date(2026, 9, 1),
      enddate: '',
    }, 'TRANSFERS', 'TRANSFERS').subscribe();

    const create = httpMock.expectOne(EXPORTS);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({
      type: 'TRANSFERS',
      startFrom: '2026-10-01 00:00:00',
      startTo: undefined,
      filters: { transactionId: ['a', 'b'], payerDfspId: ['123'], state: ['COMPLETED'] },
    });
  });

  it('sends external id and error description only for transaction requests', () => {
    service.exportCSV({ externalid: 'x', errordescription: 'e', payerdfspid: '1,2' }, 'TRANSACTION_REQUESTS', 'TR')
      .subscribe();
    service.exportCSV({ externalid: 'x', errordescription: 'e' }, 'TRANSFERS', 'T').subscribe();

    const [requests, transfers] = httpMock.match(EXPORTS);
    expect(requests.request.body.filters).toEqual({ externalId: ['x'], errorDescription: ['e'], payerDfspId: ['1', '2'] });
    expect(transfers.request.body.filters).toEqual({});
  });

  it('polls until the export succeeds, then downloads the file and completes', fakeAsync(() => {
    const statuses: string[] = [];
    let completed = false;
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS')
      .subscribe({ next: j => statuses.push(j.status), complete: () => completed = true });

    httpMock.expectOne(EXPORTS).flush(job('QUEUED'));
    tick();
    httpMock.expectOne(`${EXPORTS}/job-1`).flush(job('RUNNING', { attempts: 2 }));
    tick(PaymenthubService.POLL_INTERVAL_MS);
    httpMock.expectOne(`${EXPORTS}/job-1`).flush(job('SUCCEEDED', { rowCount: 3 }));
    expect(completed).toBe(false);
    httpMock.expectOne(`${EXPORTS}/job-1/download`).flush(new Blob(['csv']));

    expect(statuses).toEqual(['RUNNING', 'SUCCEEDED']);
    expect(completed).toBe(true);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    tick(PaymenthubService.POLL_INTERVAL_MS);
    httpMock.expectNone(`${EXPORTS}/job-1`);
  }));

  it('does not download an empty export and says no records were found', fakeAsync(() => {
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS').subscribe();

    httpMock.expectOne(EXPORTS).flush(job('QUEUED'));
    tick();
    httpMock.expectOne(`${EXPORTS}/job-1`).flush(job('SUCCEEDED', { rowCount: 0 }));

    httpMock.expectNone(`${EXPORTS}/job-1/download`);
    expect(alerts).toEqual(['No records found matching your criteria']);
  }));

  it('shows the reason of a failed export and errors', fakeAsync(() => {
    let failed = false;
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS').subscribe({ error: () => failed = true });

    httpMock.expectOne(EXPORTS).flush(job('QUEUED'));
    tick();
    httpMock.expectOne(`${EXPORTS}/job-1`).flush(job('FAILED', {
      error: { code: 'EXPORT_TOO_LARGE', message: 'The export has more than 5000000 rows; narrow the dates or filters' },
    }));

    expect(failed).toBe(true);
    expect(alerts).toEqual(['The export has more than 5000000 rows; narrow the dates or filters']);
    discardPeriodicTasks();
  }));

  it('shows the server message, with details, when the export is refused', () => {
    let failed = false;
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS').subscribe({ error: () => failed = true });

    httpMock.expectOne(EXPORTS).flush(
      { message: 'Invalid export request', details: ['filters.workflowInstanceKey: not a number \'x\''] },
      { status: 400, statusText: 'Bad Request' });

    expect(failed).toBe(true);
    expect(alerts).toEqual(['Invalid export request: filters.workflowInstanceKey: not a number \'x\'']);
  });

  it('shows the server message when the user already has too many exports', () => {
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS').subscribe({ error: () => undefined });

    httpMock.expectOne(EXPORTS).flush(
      { message: 'You already have 2 exports queued or running; wait for one to finish' },
      { status: 429, statusText: 'Too Many Requests' });

    expect(alerts).toEqual(['You already have 2 exports queued or running; wait for one to finish']);
  });

  it('shows a generic message when the server gives no reason', () => {
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS').subscribe({ error: () => undefined });

    httpMock.expectOne(EXPORTS).error(new ProgressEvent('offline'));

    expect(alerts).toEqual(['The export could not be started; please try again later']);
  });

  it('errors when the file cannot be downloaded', fakeAsync(() => {
    let failed = false;
    service.exportCSV({}, 'TRANSFERS', 'TRANSFERS').subscribe({ error: () => failed = true });

    httpMock.expectOne(EXPORTS).flush(job('QUEUED'));
    tick();
    httpMock.expectOne(`${EXPORTS}/job-1`).flush(job('SUCCEEDED', { rowCount: 1 }));
    httpMock.expectOne(`${EXPORTS}/job-1/download`).flush(new Blob(), { status: 410, statusText: 'Gone' });

    expect(failed).toBe(true);
    expect(alerts).toEqual(['The export file could not be downloaded; run the export again']);
  }));
});
