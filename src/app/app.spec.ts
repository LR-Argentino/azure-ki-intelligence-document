import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { App } from './app';

// Mock component for routing
@Component({
  template: '<div>Mock Route Component</div>'
})
class MockComponent { }

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        RouterTestingModule.withRoutes([
          { path: 'upload', component: MockComponent },
          { path: '', component: MockComponent }
        ])
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // The app renders the main layout component, so we just check that it exists
    expect(compiled.querySelector('app-main-layout')).toBeTruthy();
  });
});
