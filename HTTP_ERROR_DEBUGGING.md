# 🔍 Sentry HTTP Error Troubleshooting Guide

## Issue: Only seeing transactions, not HTTP errors in Sentry

You mentioned seeing "transactions" but not HTTP errors. This suggests that **Sentry performance monitoring is working**, but **error reporting might have an issue**.

## 🎯 **Most Likely Issues & Solutions**

### 1. **Wrong Sentry Tab** ⭐ (Most Common)

- **Problem**: You might be looking in the wrong Sentry tab
- **Solution**: In your Sentry dashboard, make sure you're checking:
  - ✅ **Issues** tab (for errors)
  - ❌ NOT the **Performance** tab (for transactions)

### 2. **HTTP Interceptor Not Catching Errors**

- **Problem**: Angular HTTP interceptor only catches requests made with `HttpClient`
- **Solution**: Ensure you're testing with Angular's `HttpClient`, not `fetch()`

### 3. **Error Filtering**

- **Problem**: Sentry `beforeSend` filter might be blocking HTTP errors
- **Solution**: Check the enhanced logging I added to your Sentry service

## 🧪 **Quick Diagnostic Test**

### Step 1: Open your app at `http://localhost:4200`

### Step 2: Open DevTools Console and paste this:

```javascript
// Test 1: Direct Sentry test
console.log("🧪 Testing direct Sentry error...");
setTimeout(() => {
  throw new Error("🧪 TEST: Direct error - should appear in Sentry Issues tab");
}, 2000);

// Test 2: Check what's being sent to Sentry
console.log("📊 Monitor all outgoing network requests to Sentry...");
```

### Step 3: In DevTools Network Tab:

1. Clear the network log
2. Filter by: `sentry` or `ingest`
3. Trigger errors in your app
4. Look for POST requests to `*.ingest.sentry.io`
5. Click on the request and check:
   - **Status**: Should be `200` (success)
   - **Request payload**: Should contain error data

## 🔧 **Proper HTTP Error Testing**

Since `fetch()` requests **don't** go through Angular HTTP interceptor, you need to test with Angular's `HttpClient`:

### Add this to any component:

```typescript
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

testHttpErrors() {
  // This WILL trigger the Sentry HTTP interceptor
  this.http.get('/api/404-test').subscribe({
    error: (error) => console.log('HTTP Error caught:', error)
  });
}
```

### Or add this to your template temporarily:

```html
<button (click)="testHttpErrors()">Test HTTP Errors</button>
```

## 📊 **What to Look For**

### In Browser Console:

- Look for messages like: `🔍 SentryHttpInterceptor caught HTTP error:`
- Look for messages like: `📤 Sentry beforeSend:`
- Look for messages like: `✅ Allowing HTTP error through filter`

### In Network Tab:

- Red status codes (404, 500, etc.)
- POST requests to `*.ingest.sentry.io` with status 200

### In Sentry Dashboard:

- **Issues** tab (not Performance)
- Look for events with tags like `error.type:http`
- Events should appear within 1-3 minutes

## 🔍 **Advanced Debugging**

### Check if HTTP interceptor is working:

Add this temporary logging to your app component:

```typescript
constructor(private http: HttpClient) {
  // Test on app startup
  console.log('🧪 Testing HTTP interceptor...');
  this.http.get('/api/startup-404-test').subscribe({
    error: (error) => console.log('✅ HTTP interceptor is working:', error)
  });
}
```

## 🎯 **Expected Behavior**

When HTTP interceptor catches an error, you should see:

1. **Console**: `🔍 SentryHttpInterceptor caught HTTP error:`
2. **Console**: `📤 HTTP error sent to Sentry:`
3. **Network**: POST to `*.ingest.sentry.io` (status 200)
4. **Sentry Issues**: New error within 1-3 minutes

## 🚨 **If Still Not Working**

### Check these configuration issues:

1. **Interceptor Registration**: Verify in `app.module.ts`:

   ```typescript
   providers: [
     {
       provide: HTTP_INTERCEPTORS,
       useClass: SentryHttpInterceptor,
       multi: true,
     },
   ];
   ```

2. **Sentry DSN**: Make sure it's not empty in environment files

3. **Sentry Enabled**: Check `environment.sentry.enabled = true`

4. **beforeSend Filter**: The enhanced version now logs what it's filtering

## 💡 **Quick Solution**

Try this simple test right now:

1. Open your app
2. Open DevTools Console
3. Paste: `throw new Error('TEST ERROR');`
4. Wait 2 minutes
5. Check Sentry **Issues** tab (not Performance)

If this error appears in Sentry, then basic error reporting works and the issue is specifically with HTTP error capture.

## 🎯 **Next Steps**

1. Try the direct error test above first
2. If that works, then focus on HTTP interceptor testing
3. Use the enhanced logging I added to debug what's happening
4. Check you're looking at the right tab in Sentry (Issues, not Performance)

Let me know what you see in the browser console when you try these tests!
