import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BoundingBox,
  BoundingBoxType,
  Point,
  BoundingBoxInteraction,
  InteractionEvent,
  OverlaySettings
} from '../../../core/models/bounding-box.model';
import { BoundingBoxService } from '../../../core/services/bounding-box.service';
import { CoordinateConverterUtil } from '../../utils/coordinate-converter.util';

@Component({
  selector: 'app-bounding-box-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #overlayContainer
      class="bounding-box-overlay-container"
      [style.width.px]="canvasWidth"
      [style.height.px]="canvasHeight"
      [style.position]="'absolute'"
      [style.top]="'0'"
      [style.left]="'0'"
      [style.pointer-events]="'none'"
      [style.z-index]="'10'">
      
      <!-- Bounding box elements -->
      <div
        *ngFor="let box of visibleBoundingBoxes; trackBy: trackByBoxId"
        class="bounding-box"
        [class.bounding-box--highlighted]="box.isHighlighted"
        [class.bounding-box--selected]="box.isSelected"
        [class]="'bounding-box--' + box.type"
        [style.position]="'absolute'"
        [style.left.px]="box.canvasCoordinates?.x"
        [style.top.px]="box.canvasCoordinates?.y"
        [style.width.px]="box.canvasCoordinates?.width"
        [style.height.px]="box.canvasCoordinates?.height"
        [style.border]="getBorderStyle(box)"
        [style.background-color]="getBackgroundColor(box)"
        [style.opacity]="getOpacity(box)"
        [style.pointer-events]="'auto'"
        [style.cursor]="'pointer'"
        [title]="getTooltip(box)"
        (click)="onBoundingBoxClick(box, $event)"
        (mouseenter)="onBoundingBoxHover(box, $event)"
        (mouseleave)="onBoundingBoxLeave(box, $event)"
        (touchstart)="onBoundingBoxTouchStart(box, $event)"
        (touchend)="onBoundingBoxTouchEnd(box, $event)">
        
        <!-- Content label for larger boxes -->
        <div
          *ngIf="shouldShowLabel(box)"
          class="bounding-box__label"
          [style.font-size]="getLabelFontSize(box)"
          [style.color]="getLabelColor(box)"
          [style.background-color]="getLabelBackgroundColor(box)"
          [style.padding]="'2px 4px'"
          [style.border-radius]="'2px'"
          [style.font-weight]="'500'"
          [style.font-family]="'system-ui, -apple-system, sans-serif'"
          [style.line-height]="'1.2'"
          [style.max-width]="box.canvasCoordinates?.width + 'px'"
          [style.word-break]="'break-word'"
          [style.overflow]="'hidden'"
          [style.text-overflow]="'ellipsis'"
          [style.white-space]="'nowrap'">
          {{ getDisplayText(box) }}
        </div>
        
        <!-- Confidence indicator -->
        <div
          *ngIf="overlaySettings.showConfidence && box.confidence < 1"
          class="bounding-box__confidence"
          [style.position]="'absolute'"
          [style.top]="'-8px'"
          [style.right]="'-8px'"
          [style.width]="'16px'"
          [style.height]="'16px'"
          [style.border-radius]="'50%'"
          [style.background-color]="getConfidenceColor(box.confidence)"
          [style.font-size]="'10px'"
          [style.color]="'white'"
          [style.display]="'flex'"
          [style.align-items]="'center'"
          [style.justify-content]="'center'"
          [style.font-weight]="'bold'"
          [title]="'Confidence: ' + (box.confidence * 100 | number:'1.0-0') + '%'">
          {{ (box.confidence * 100 | number:'1.0-0') }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bounding-box-overlay-container {
      pointer-events: none;
      user-select: none;
    }

    .bounding-box {
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .bounding-box:hover {
      transform: scale(1.02);
      z-index: 20;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .bounding-box--highlighted {
      z-index: 15;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
    }

    .bounding-box--selected {
      z-index: 25;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
      border-width: 3px !important;
    }

    /* Type-specific styles */
    .bounding-box--word {
      border-style: solid;
    }

    .bounding-box--line {
      border-style: dashed;
    }

    .bounding-box--table_cell {
      border-style: dotted;
    }

    .bounding-box--key_value_pair {
      border-style: double;
    }

    .bounding-box--document_field {
      border-style: solid;
      border-width: 2px;
    }

    .bounding-box__label {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    }

    .bounding-box__confidence {
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    /* Mobile-specific styles */
    @media (max-width: 768px) {
      .bounding-box:hover {
        transform: none;
      }
      
      .bounding-box {
        min-width: 20px;
        min-height: 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoundingBoxOverlayComponent implements OnInit, OnDestroy, OnChanges {
  @Input() boundingBoxes: BoundingBox[] = [];
  @Input() canvasWidth: number = 0;
  @Input() canvasHeight: number = 0;
  @Input() overlaySettings: OverlaySettings = {
    showWords: true,
    showLines: false,
    showTables: true,
    showKeyValuePairs: true,
    showDocumentFields: true,
    opacity: 0.3,
    highlightColor: '#3b82f6',
    selectedColor: '#ef4444',
    showConfidence: false
  };
  @Input() selectedBoxId: string | null = null;
  @Input() highlightedBoxId: string | null = null;

  @Output() boxClick = new EventEmitter<BoundingBoxInteraction>();
  @Output() boxHover = new EventEmitter<BoundingBoxInteraction>();
  @Output() boxSelect = new EventEmitter<BoundingBox>();
  @Output() boxDeselect = new EventEmitter<void>();

  @ViewChild('overlayContainer', { static: true }) overlayContainer!: ElementRef<HTMLDivElement>;

  visibleBoundingBoxes: BoundingBox[] = [];
  private touchStartTime: number = 0;
  private readonly TOUCH_TAP_THRESHOLD = 300; // milliseconds

  constructor(
    private boundingBoxService: BoundingBoxService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.updateVisibleBoundingBoxes();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['boundingBoxes'] || changes['overlaySettings']) {
      this.updateVisibleBoundingBoxes();
    }

    if (changes['selectedBoxId']) {
      this.updateSelectedState();
    }

    if (changes['highlightedBoxId']) {
      this.updateHighlightedState();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Deselect when clicking outside the overlay
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      if (this.selectedBoxId) {
        this.boxDeselect.emit();
      }
    }
  }

  trackByBoxId(index: number, box: BoundingBox): string {
    return box.id;
  }

  onBoundingBoxClick(box: BoundingBox, event: MouseEvent): void {
    event.stopPropagation();
    
    const interaction: BoundingBoxInteraction = {
      boundingBox: box,
      event: InteractionEvent.CLICK,
      timestamp: new Date()
    };

    this.boxClick.emit(interaction);
    this.boxSelect.emit(box);
  }

  onBoundingBoxHover(box: BoundingBox, event: MouseEvent): void {
    const interaction: BoundingBoxInteraction = {
      boundingBox: box,
      event: InteractionEvent.HOVER,
      timestamp: new Date()
    };

    this.boxHover.emit(interaction);
  }

  onBoundingBoxLeave(box: BoundingBox, event: MouseEvent): void {
    // Handle mouse leave if needed
  }

  onBoundingBoxTouchStart(box: BoundingBox, event: TouchEvent): void {
    event.preventDefault();
    this.touchStartTime = Date.now();
  }

  onBoundingBoxTouchEnd(box: BoundingBox, event: TouchEvent): void {
    event.preventDefault();
    const touchDuration = Date.now() - this.touchStartTime;
    
    if (touchDuration < this.TOUCH_TAP_THRESHOLD) {
      // Treat as tap (equivalent to click)
      const interaction: BoundingBoxInteraction = {
        boundingBox: box,
        event: InteractionEvent.CLICK,
        timestamp: new Date()
      };

      this.boxClick.emit(interaction);
      this.boxSelect.emit(box);
    }
  }

  getBorderStyle(box: BoundingBox): string {
    const color = this.boundingBoxService.getColorForType(box.type);
    const width = box.isSelected ? '3px' : '1px';
    const style = this.getBorderStyleForType(box.type);
    return `${width} ${style} ${color}`;
  }

  getBackgroundColor(box: BoundingBox): string {
    const color = this.boundingBoxService.getColorForType(box.type);
    const alpha = box.isHighlighted ? 0.2 : 0.1;
    return this.hexToRgba(color, alpha);
  }

  getOpacity(box: BoundingBox): number {
    if (box.isSelected) return 0.8;
    if (box.isHighlighted) return 0.6;
    return this.overlaySettings.opacity;
  }

  getTooltip(box: BoundingBox): string {
    const type = box.type.replace('_', ' ').toUpperCase();
    const confidence = (box.confidence * 100).toFixed(0);
    return `${type}\\nContent: ${box.content}\\nConfidence: ${confidence}%`;
  }

  shouldShowLabel(box: BoundingBox): boolean {
    if (!box.canvasCoordinates) return false;
    
    // Show labels for larger boxes or document fields
    const minWidth = 50;
    const minHeight = 20;
    
    return (
      box.canvasCoordinates.width >= minWidth &&
      box.canvasCoordinates.height >= minHeight
    ) || box.type === BoundingBoxType.DOCUMENT_FIELD;
  }

  getDisplayText(box: BoundingBox): string {
    // Truncate long text for display
    const maxLength = 20;
    return box.content.length > maxLength 
      ? box.content.substring(0, maxLength) + '...'
      : box.content;
  }

  getLabelFontSize(box: BoundingBox): string {
    if (!box.canvasCoordinates) return '10px';
    
    const height = box.canvasCoordinates.height;
    if (height < 20) return '8px';
    if (height < 30) return '10px';
    if (height < 40) return '12px';
    return '14px';
  }

  getLabelColor(box: BoundingBox): string {
    return '#1f2937'; // Dark gray
  }

  getLabelBackgroundColor(box: BoundingBox): string {
    return 'rgba(255, 255, 255, 0.9)';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return '#10b981'; // Green
    if (confidence >= 0.7) return '#f59e0b'; // Orange
    if (confidence >= 0.5) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  }

  private updateVisibleBoundingBoxes(): void {
    this.visibleBoundingBoxes = this.boundingBoxes.filter(box => this.shouldShowBox(box));
  }

  private shouldShowBox(box: BoundingBox): boolean {
    switch (box.type) {
      case BoundingBoxType.WORD:
        return this.overlaySettings.showWords;
      case BoundingBoxType.LINE:
        return this.overlaySettings.showLines;
      case BoundingBoxType.TABLE_CELL:
        return this.overlaySettings.showTables;
      case BoundingBoxType.KEY_VALUE_PAIR:
        return this.overlaySettings.showKeyValuePairs;
      case BoundingBoxType.DOCUMENT_FIELD:
        return this.overlaySettings.showDocumentFields;
      default:
        return true;
    }
  }

  private updateSelectedState(): void {
    this.visibleBoundingBoxes.forEach(box => {
      box.isSelected = box.id === this.selectedBoxId;
    });
  }

  private updateHighlightedState(): void {
    this.visibleBoundingBoxes.forEach(box => {
      box.isHighlighted = box.id === this.highlightedBoxId;
    });
  }

  private getBorderStyleForType(type: BoundingBoxType): string {
    switch (type) {
      case BoundingBoxType.WORD:
        return 'solid';
      case BoundingBoxType.LINE:
        return 'dashed';
      case BoundingBoxType.TABLE_CELL:
        return 'dotted';
      case BoundingBoxType.KEY_VALUE_PAIR:
        return 'double';
      case BoundingBoxType.DOCUMENT_FIELD:
        return 'solid';
      default:
        return 'solid';
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
