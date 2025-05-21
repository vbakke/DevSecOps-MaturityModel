import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'progress-slider',
  templateUrl: './progress-slider.component.html',
  styleUrls: ['./progress-slider.component.css']
})
export class ProgressSliderComponent implements OnInit {
  @Input() steps: string[] = [];
  @Input() initialValue: number = 0;
  // @Output() stepChange = new EventEmitter<number>();

  currentValue: number = 0;

  ngOnInit() {
    this.currentValue = this.initialValue;
  }

  onSlide(event: any) {
    console.log('Slider changed:', event);
  }

  onStepChange(step: number | null) {
    if (step !== null) {
      this.currentValue = step as number;
      // this.stepChange.emit(this.currentStep);
    }
  }
} 