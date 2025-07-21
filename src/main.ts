import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { faro, getWebInstrumentations, initializeFaro, LogLevel } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

const localDevelopment:boolean = (window.location.hostname == 'localhost');
if (environment.production) {
  enableProdMode();
}

if (environment?.experimental && !localDevelopment) {
  initializeFaro({
    url: 'https://faro-collector-prod-eu-north-0.grafana.net/collect/a7eda57dbf6b581662f2bf43a70c7508',
    app: {
      name: 'dsomm',
      version: '1.1.1',
      environment: localDevelopment ? 'development' : 'experimental',
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

  // Identify specific sessions
  let debugid: string = (new URLSearchParams(location.search)).get('debugid') || '';
  if (debugid) localStorage.setItem('debugid', debugid);
  else debugid = localStorage.getItem('debugid') || '';
  faro.api.setUser(
    { attributes: {
        debugid: debugid,
        debugfamily: debugid.split('-')[0],
        debugreferrer: document.referrer,
      }, 
    });
    if (debugid) console.log('Faro debugid:', debugid);
    if (document.referrer) console.log('Faro referrer:', document.referrer);
}


platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
