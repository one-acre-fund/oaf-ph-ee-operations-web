// QUICK HTTP ERROR TEST - Add this to any component

// 1. In your component TypeScript file, add:
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {
  // Test HTTP interceptor on component init
  this.testHttpInterceptor();
}

testHttpInterceptor() {
  console.log('🧪 Testing HTTP Interceptor...');

  // This will trigger a 404 error and should be caught by SentryHttpInterceptor
  this.http.get('/api/test-404-sentry').subscribe({
    next: (data) => console.log('Unexpected success:', data),
    error: (error) =>
    {
      console.log('✅ HTTP Error caught by component:', error);
      console.log('👀 Check if SentryHttpInterceptor logged anything above');
    }
  });
}

// 2. In your component template, add this button:
<button (click) = "testHttpInterceptor()" style = "background: red; color: white; padding: 10px;" >
  🧪 Test HTTP Interceptor
</button >

// 3. What to expect when you click the button:
// - Console: "🔍 SentryHttpInterceptor caught HTTP error:"
// - Console: "📤 HTTP error sent to Sentry:"  
// - Network Tab: POST to *.ingest.sentry.io
// - Sentry Issues Tab: New error within 2-3 minutes

// If you don't see the interceptor console logs, the interceptor isn't working
// If you see the logs but no Sentry request, there's a configuration issue
