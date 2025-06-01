import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';


@Component({
  selector: 'progress-slider',
  templateUrl: './progress-slider.component.html',
  styleUrls: ['./progress-slider.component.css']
})

export class ProgressSliderComponent implements OnInit {
  @Input() steps: string[] = [];
  @Input() initial: string = '';
  @Output() progressChange = new EventEmitter<string>();
  
  initialValue: number = 0;
  currentValue: number = 0;

  ngOnInit() {
    this.initialValue = this.steps.indexOf(this.initial);
    if (this.initialValue === -1) this.initialValue = 0;
    this.currentValue = this.initialValue;
  }

  getCurrent() {
    return this.steps[this.currentValue];
  }

  hasChanged(): boolean {
    return this.initialValue != this.currentValue;
  }

  onSlide(event: any) {
    console.log('Slider changed:', event);
  }

  onStepChange(step: number | null) {
    if (step !== null) {
      this.currentValue = step as number;
      this.progressChange?.emit(this.getCurrent());
    }
  }
} 