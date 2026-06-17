import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';


describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
      ],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('deve criar o aplicativo', () => {
    const fixture =
      TestBed.createComponent(
        AppComponent,
      );

    const componente =
      fixture.componentInstance;

    expect(componente).toBeTruthy();
  });
});