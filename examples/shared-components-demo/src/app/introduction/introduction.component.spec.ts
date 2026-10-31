import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntroductionComponent } from './introduction.component';

describe('IntroductionComponent', () => {
  let component: IntroductionComponent;
  let fixture: ComponentFixture<IntroductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroductionComponent],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IntroductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders delayed documentation HTTP responses through AsyncPipe', () => {
  it('renders delayed documentation HTTP responses through AsyncPipe', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(IntroductionComponent);
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('assets/angular_json.txt')
      .flush('angular configuration response');
    http
      .expectOne('assets/package_json.txt')
      .flush('package configuration response');
    http
      .expectOne('assets/component_imports.txt')
      .flush('component imports response');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'angular configuration response'
    );
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'package configuration response'
    );
    expect((fixture.nativeElement as HTMLInputElement).textContent).toContain(
      'component imports response'
    );
    http.verify();
  });
});
