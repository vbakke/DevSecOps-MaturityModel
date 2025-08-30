import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { ProgressSliderComponent } from './progress-slider.component';

describe('ProgressSliderComponent', () => {
  let component: ProgressSliderComponent;
  let fixture: ComponentFixture<ProgressSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressSliderComponent],
      imports: [FormsModule, MatSliderModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressSliderComponent);
    component = fixture.componentInstance;
    component.steps = ['Step 1', 'Step 2', 'Step 3'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the correct initial step', () => {
    component.originalValue = 1;
    component.ngOnInit();
    expect(component.currentValue).toBe(1);
  });

  it('should emit step changes', () => {
    spyOn(component.progressChange, 'emit');
    component.onStepChange(2);
    expect(component.progressChange.emit).toHaveBeenCalledWith(2);
  });

  it('should display the correct step label', () => {
    component.currentValue = 1;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.step-label')?.textContent).toContain('Step 2');
  });
});
