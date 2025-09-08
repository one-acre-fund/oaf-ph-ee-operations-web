#!/usr/bin/env node

/**
 * Sentry Configuration Checker
 * 
 * This script helps verify that Sentry is properly configured in the application.
 * Run with: node scripts/check-sentry-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Sentry Configuration...\n');

// Check if environment files exist and have Sentry configuration
const envFiles = [
    'src/environments/environment.ts',
    'src/environments/environment.prod.ts'
];

let allConfigsValid = true;

envFiles.forEach(filePath =>
{
    console.log(`📁 Checking ${filePath}...`);

    if (!fs.existsSync(filePath))
    {
        console.log(`❌ File not found: ${filePath}`);
        allConfigsValid = false;
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Check for Sentry configuration
    const hasSentryConfig = content.includes('sentry:');
    const hasDsn = content.includes('dsn:');
    const hasEnabled = content.includes('enabled:');
    const hasEnvironment = content.includes('environment:');

    if (!hasSentryConfig)
    {
        console.log('❌ No Sentry configuration found');
        allConfigsValid = false;
    } else
    {
        console.log('✅ Sentry configuration found');

        if (!hasDsn)
        {
            console.log('⚠️  No DSN configuration found');
            allConfigsValid = false;
        } else
        {
            console.log('✅ DSN configuration found');
        }

        if (!hasEnabled)
        {
            console.log('⚠️  No enabled flag found');
        } else
        {
            console.log('✅ Enabled flag found');
        }

        if (!hasEnvironment)
        {
            console.log('⚠️  No environment specification found');
        } else
        {
            console.log('✅ Environment specification found');
        }
    }

    console.log('');
});

// Check if Sentry services exist
const sentryFiles = [
    'src/app/core/services/sentry.service.ts',
    'src/app/core/services/global-error-handler.service.ts',
    'src/app/core/interceptors/sentry-http.interceptor.ts',
    'src/app/core/services/sentry-router.service.ts',
    'src/app/core/services/sentry-user-context.service.ts'
];

console.log('📁 Checking Sentry service files...');
sentryFiles.forEach(filePath =>
{
    if (fs.existsSync(filePath))
    {
        console.log(`✅ ${filePath}`);
    } else
    {
        console.log(`❌ ${filePath} not found`);
        allConfigsValid = false;
    }
});

// Check package.json for Sentry dependencies
console.log('\n📦 Checking Sentry dependencies...');
if (fs.existsSync('package.json'))
{
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredPackages = ['@sentry/angular-ivy', '@sentry/tracing'];

    requiredPackages.forEach(pkg =>
    {
        if (dependencies[pkg])
        {
            console.log(`✅ ${pkg} - v${dependencies[pkg]}`);
        } else
        {
            console.log(`❌ ${pkg} - Not installed`);
            allConfigsValid = false;
        }
    });
} else
{
    console.log('❌ package.json not found');
    allConfigsValid = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allConfigsValid)
{
    console.log('🎉 Sentry configuration looks good!');
    console.log('\n📝 Next steps:');
    console.log('1. Add your Sentry DSN to environment files');
    console.log('2. Set sentry.enabled = true in the appropriate environments');
    console.log('3. Test the integration with the demo component');
} else
{
    console.log('⚠️  Some Sentry configuration issues found.');
    console.log('Please review the errors above and refer to docs/sentry-integration.md');
}
console.log('='.repeat(50));
