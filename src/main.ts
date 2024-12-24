import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { getWebInstrumentations, initializeFaro, LogLevel } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

if (environment.production) {
  enableProdMode();
}

if (environment?.experimental) {
  initializeFaro({
    url: 'https://faro-collector-prod-eu-north-0.grafana.net/collect/a7eda57dbf6b581662f2bf43a70c7508',
    app: {
      name: 'dsomm',
      version: '1.0.0',
      environment: (window.location.hostname == 'localhost') ? 'development' : 'experimental',
    },
    sessionTracking: {
      samplingRate: 1,
      persistent: true
    },
    instrumentations: [
      // Mandatory, omits default instrumentations otherwise.
      ...getWebInstrumentations(),

      // Tracing package to get end-to-end visibility for HTTP requests.
      new TracingInstrumentation(),
    ],
    consoleInstrumentation: {
      consoleErrorAsLog: true,
      
      disabledLevels: [LogLevel.DEBUG, LogLevel.TRACE],
    },
  });

}


platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
