// import { HttpClient, HttpHandler } from '@angular/common/http';
// import {
//   HttpClientTestingModule,
//   HttpTestingController,
// } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { loaderService } from './data-loader.service';
// import { ymlService } from '../yaml-parser/yaml-parser.service';

describe('DataLoaderService', () => {
  let service: loaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [loaderService],
      // providers: [HttpClientTestingModule, loaderService, HttpClient, HttpHandler],
    });
    service = TestBed.inject(loaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
