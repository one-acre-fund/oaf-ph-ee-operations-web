import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SentryService } from '../../core/services/sentry.service';

@Component({
  selector: 'mifosx-http-test',
  template: `
    <div class="http-test-container">
      <h2>🌐 HTTP Error Testing for Sentry</h2>
      
      <div class="test-section">
        <h3>HTTP Error Tests</h3>
        <p>These buttons use Angular HttpClient and WILL trigger the HTTP interceptor:</p>
        
        <button (click)="test404Error()" class="test-btn error">Test 404 Error</button>
        <button (click)="test500Error()" class="test-btn error">Test 500 Error</button>
        <button (click)="testCorsError()" class="test-btn error">Test CORS Error</button>
        <button (click)="testTimeoutError()" class="test-btn error">Test Timeout</button>
      </div>

      <div class="test-section">
        <h3>Direct Sentry Tests</h3>
        <button (click)="testDirectError()" class="test-btn warning">Test Direct Error</button>
        <button (click)="testDirectMessage()" class="test-btn info">Test Direct Message</button>
      </div>

      <div class="results-section" *ngIf="testResults.length > 0">
        <h3>Test Results</h3>
        <div class="result-item" *ngFor="let result of testResults" [ngClass]="result.type">
          <strong>{{result.timestamp}}</strong> - {{result.message}}
        </div>
      </div>

      <div class="instructions">
        <h3>🎯 How to Verify</h3>
        <ol>
          <li>Click the test buttons above</li>
          <li>Open Browser DevTools → Console tab</li>
          <li>Open Browser DevTools → Network tab</li>
          <li>Look for:</li>
          <ul>
            <li>Red HTTP status codes (4xx, 5xx)</li>
            <li>Console messages from the interceptor</li>
            <li>Requests to *.ingest.sentry.io</li>
          </ul>
          <li>Check your Sentry dashboard (Issues tab) in 2-3 minutes</li>
        </ol>
        
        <div class="troubleshooting">
          <h4>🔧 Troubleshooting</h4>
          <p><strong>If you don't see HTTP errors in Sentry:</strong></p>
          <ul>
            <li>Check browser console for interceptor logs</li>
            <li>Verify Network tab shows requests to Sentry</li>
            <li>Make sure you're looking at "Issues" not "Performance" in Sentry</li>
            <li>Wait 2-3 minutes for events to appear</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .http-test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .test-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    .test-btn {
      margin: 5px;
      padding: 12px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .test-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .test-btn.error { background-color: #dc3545; color: white; }
    .test-btn.warning { background-color: #ffc107; color: black; }
    .test-btn.info { background-color: #17a2b8; color: white; }

    .results-section {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .result-item {
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
      font-size: 14px;
    }

    .result-item.success { background-color: #d4edda; color: #155724; }
    .result-item.error { background-color: #f8d7da; color: #721c24; }
    .result-item.info { background-color: #d1ecf1; color: #0c5460; }

    .instructions {
      margin-top: 30px;
      padding: 20px;
      background-color: #e7f3ff;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .troubleshooting {
      margin-top: 15px;
      padding: 15px;
      background-color: #fff3cd;
      border-radius: 4px;
    }

    ol, ul {
      margin: 10px 0;
      padding-left: 20px;
    }
  `]
})
export class HttpTestComponent implements OnInit {
  testResults: Array<{ type: string, message: string, timestamp: string }> = [];

  constructor(
    private http: HttpClient,
    private sentryService: SentryService
  ) { }

  ngOnInit(): void {
    this.logResult('info', 'HTTP Test Component loaded - Ready for testing');
  }

  test404Error(): void {
    console.log('🧪 Testing 404 error with HttpClient...');
    this.logResult('info', 'Testing 404 error...');

    this.http.get('/api/non-existent-endpoint-404').subscribe({
      next: (response) => {
        console.log('Unexpected success:', response);
        this.logResult('success', '404 test: Unexpected success');
      },
      error: (error: HttpErrorResponse) => {
        console.log('✅ 404 error caught by HttpClient:', error);
        this.logResult('error', `404 error captured: ${error.status} ${error.statusText}`);
      }
    });
  }

  test500Error(): void {
    console.log('🧪 Testing 500 error with HttpClient...');
    this.logResult('info', 'Testing 500 error...');

    this.http.get('/api/server-error-500').subscribe({
      next: (response) => {
        console.log('Unexpected success:', response);
        this.logResult('success', '500 test: Unexpected success');
      },
      error: (error: HttpErrorResponse) => {
        console.log('✅ 500 error caught by HttpClient:', error);
        this.logResult('error', `500 error captured: ${error.status} ${error.statusText}`);
      }
    });
  }

  testCorsError(): void {
    console.log('🧪 Testing CORS error with HttpClient...');
    this.logResult('info', 'Testing CORS error...');

    this.http.get('https://httpstat.us/403', {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response) => {
        console.log('CORS test response:', response);
        this.logResult('success', 'CORS test: Success response received');
      },
      error: (error: HttpErrorResponse) => {
        console.log('✅ CORS/403 error caught by HttpClient:', error);
        this.logResult('error', `CORS error captured: ${error.status || 'Network Error'}`);
      }
    });
  }

  testTimeoutError(): void {
    console.log('🧪 Testing timeout error with HttpClient...');
    this.logResult('info', 'Testing timeout error...');

    // This will likely result in a 404 or CORS error instead of timeout
    this.http.get('https://httpstat.us/200?sleep=30000').subscribe({
      next: (response) => {
        console.log('Timeout test response:', response);
        this.logResult('success', 'Timeout test: Response received (no timeout)');
      },
      error: (error: HttpErrorResponse) => {
        console.log('✅ Timeout/error caught by HttpClient:', error);
        this.logResult('error', `Timeout error captured: ${error.status || 'Network Error'}`);
      }
    });
  }

  testDirectError(): void {
    console.log('🧪 Testing direct error capture...');
    this.logResult('info', 'Testing direct error capture...');

    try {
      throw new Error('🧪 Direct test error for Sentry');
    } catch (error) {
      this.sentryService.captureException(error);
      this.logResult('error', 'Direct error sent to Sentry');
      console.log('✅ Direct error sent to Sentry');
    }
  }

  testDirectMessage(): void {
    console.log('🧪 Testing direct message capture...');
    this.logResult('info', 'Testing direct message capture...');

    this.sentryService.captureMessage('🧪 Direct test message for Sentry', 'info');
    this.logResult('success', 'Direct message sent to Sentry');
    console.log('✅ Direct message sent to Sentry');
  }

  private logResult(type: string, message: string): void {
    this.testResults.unshift({
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    });

    // Keep only last 10 results
    if (this.testResults.length > 10) {
      this.testResults = this.testResults.slice(0, 10);
    }
  }
}
