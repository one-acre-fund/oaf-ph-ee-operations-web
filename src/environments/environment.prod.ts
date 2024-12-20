// `.env.ts` is generated by the `npm run env` command
import env from './.env';

export let environment = {
  name: "prod",
  production: true,
  version: env.npm_package_version,
  serverUrl: "",
  oauth: {
    enabled: "false",
    serverUrl: "",
    basicAuth: "false",
    basicAuthToken: ''
  },
  defaultLanguage: "en-US",
  supportedLanguages: ["en-US", "fr-FR"],
  externalConfigurationFile: "",
  auth: {
    enabled: true,
    tenant: "phdefault"
  },
  amsShortCodes: [
    {
    option: 'TUPANDE_TILL',
    type: 'TILL',
    value: '6064956'
}
]
};
