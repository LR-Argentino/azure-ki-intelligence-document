import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'confidenceColor',
  standalone: true
})
export class ConfidenceColorPipe implements PipeTransform {

  transform(confidence: number): string {
    if (confidence >= 0.9) {
      return '#10b981'; // Green - High confidence
    } else if (confidence >= 0.7) {
      return '#f59e0b'; // Yellow - Medium confidence
    } else if (confidence >= 0.5) {
      return '#f97316'; // Orange - Low confidence
    } else {
      return '#ef4444'; // Red - Very low confidence
    }
  }
}