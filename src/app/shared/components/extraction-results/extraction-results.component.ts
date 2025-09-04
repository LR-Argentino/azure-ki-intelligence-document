import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnChanges, 
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ExtractionResult,
  AnalyzeResult,
  Page,
  Word,
  Line,
  Table,
  KeyValuePair,
  DocumentField
} from '../../../core/models/document.model';
import { BoundingBox, BoundingBoxType } from '../../../core/models/bounding-box.model';
import { ExportService } from '../../../core/services/export.service';

export interface ExtractedField {
  id: string;
  type: 'word' | 'line' | 'table' | 'key_value_pair' | 'document_field';
  label: string;
  value: string;
  confidence: number;
  pageNumber: number;
  boundingBox?: BoundingBox;
  metadata?: any;
}

export interface FilterOptions {
  fieldTypes: string[];
  minConfidence: number;
  maxConfidence: number;
  searchText: string;
  pageNumber: number | null;
}

@Component({
  selector: 'app-extraction-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="extraction-results-container">
      <!-- Header with tabs and controls -->
      <div class="extraction-results-header">
        <div class="tabs-container">
          <button
            *ngFor="let tab of availableTabs"
            class="tab-button"
            [class.active]="activeTab === tab.key"
            [disabled]="tab.count === 0"
            (click)="setActiveTab(tab.key)">
            {{ tab.label }}
            <span class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
        
        <div class="header-actions">
          <button
            class="action-button"
            (click)="toggleFilters()"
            [class.active]="showFilters">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v6.586a1 1 0 01-.553.894L12 23l-1.447-.724A1 1 0 0110 21.382v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Filter
          </button>
          
          <button
            class="action-button"
            (click)="exportResults()"
            [disabled]="filteredFields.length === 0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Filters panel -->
      <div class="filters-panel" *ngIf="showFilters">
        <div class="filter-group">
          <label class="filter-label">Search:</label>
          <input
            type="text"
            class="filter-input"
            placeholder="Search in results..."
            [(ngModel)]="filters.searchText"
            (ngModelChange)="applyFilters()">
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Confidence Range:</label>
          <div class="confidence-range">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              [(ngModel)]="filters.minConfidence"
              (ngModelChange)="applyFilters()"
              class="range-input">
            <span class="range-value">{{ (filters.minConfidence * 100).toFixed(0) }}%</span>
            <span class="range-separator">-</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              [(ngModel)]="filters.maxConfidence"
              (ngModelChange)="applyFilters()"
              class="range-input">
            <span class="range-value">{{ (filters.maxConfidence * 100).toFixed(0) }}%</span>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Field Types:</label>
          <div class="checkbox-group">
            <label *ngFor="let type of fieldTypes" class="checkbox-label">
              <input
                type="checkbox"
                [value]="type"
                [checked]="filters.fieldTypes.includes(type)"
                (change)="onFieldTypeChange($event, type)"
                class="checkbox-input">
              {{ formatFieldType(type) }}
            </label>
          </div>
        </div>
      </div>

      <!-- Results content -->
      <div class="results-content">
        <div class="results-summary" *ngIf="filteredFields.length > 0">
          Showing {{ filteredFields.length }} of {{ extractedFields.length }} results
          <span *ngIf="filters.searchText || filters.minConfidence > 0 || filters.maxConfidence < 1 || filters.fieldTypes.length < fieldTypes.length">
            (filtered)
          </span>
        </div>

        <!-- No results state -->
        <div class="no-results" *ngIf="filteredFields.length === 0">
          <div class="no-results-icon">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3>No results found</h3>
          <p *ngIf="!extractionResult">No extraction data available.</p>
          <p *ngIf="extractionResult && extractedFields.length === 0">No extractable fields found in this document.</p>
          <p *ngIf="extractionResult && extractedFields.length > 0 && filteredFields.length === 0">
            No results match your current filters. Try adjusting the search criteria.
          </p>
        </div>

        <!-- Results list -->
        <div class="results-list" *ngIf="filteredFields.length > 0">
          <div
            *ngFor="let field of filteredFields; trackBy: trackByField"
            class="result-item"
            [class.selected]="field.id === selectedFieldId"
            [class.highlighted]="field.id === highlightedFieldId"
            (click)="selectField(field)"
            (mouseenter)="highlightField(field)"
            (mouseleave)="unhighlightField(field)">
            
            <div class="result-header">
              <div class="field-type-badge" [class]="'badge--' + field.type">
                {{ formatFieldType(field.type) }}
              </div>
              
              <div class="confidence-indicator">
                <div class="confidence-bar">
                  <div
                    class="confidence-fill"
                    [style.width.%]="field.confidence * 100"
                    [class.high]="field.confidence >= 0.9"
                    [class.medium]="field.confidence >= 0.7 && field.confidence < 0.9"
                    [class.low]="field.confidence < 0.7">
                  </div>
                </div>
                <span class="confidence-value">{{ (field.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
            
            <div class="result-content">
              <div class="field-label" *ngIf="field.label !== field.value">
                {{ field.label }}
              </div>
              <div class="field-value">{{ field.value }}</div>
              <div class="field-metadata" *ngIf="field.metadata">
                <span class="metadata-item">Page {{ field.pageNumber }}</span>
                <span class="metadata-item" *ngIf="field.metadata.row !== undefined && field.metadata.col !== undefined">
                  Row {{ field.metadata.row + 1 }}, Col {{ field.metadata.col + 1 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .extraction-results-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .extraction-results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      border-radius: 8px 8px 0 0;
    }

    .tabs-container {
      display: flex;
      gap: 4px;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: transparent;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-button:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
      color: #374151;
    }

    .tab-button.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .tab-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tab-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .tab-button:not(.active) .tab-count {
      background: #e5e7eb;
      color: #6b7280;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-button:hover:not(:disabled) {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .action-button.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .filters-panel {
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
    }

    .filter-group {
      margin-bottom: 16px;
    }

    .filter-group:last-child {
      margin-bottom: 0;
    }

    .filter-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .filter-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
    }

    .confidence-range {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .range-input {
      flex: 1;
    }

    .range-value {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      min-width: 35px;
      text-align: center;
    }

    .range-separator {
      color: #9ca3af;
    }

    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
    }

    .checkbox-input {
      margin: 0;
    }

    .results-content {
      flex: 1;
      overflow-y: auto;
    }

    .results-summary {
      padding: 12px 16px;
      background: #f9fafb;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
      color: #6b7280;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: #6b7280;
    }

    .no-results-icon {
      color: #d1d5db;
      margin-bottom: 16px;
    }

    .no-results h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .no-results p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      max-width: 300px;
    }

    .results-list {
      padding: 8px;
    }

    .result-item {
      padding: 12px;
      margin-bottom: 6px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .result-item:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .result-item.highlighted {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .result-item.selected {
      border-color: #3b82f6;
      background: #dbeafe;
      box-shadow: 0 0 0 1px #3b82f6;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .field-type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge--word {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .badge--line {
      background: #d1fae5;
      color: #059669;
    }

    .badge--table {
      background: #fef3c7;
      color: #d97706;
    }

    .badge--key_value_pair {
      background: #e9d5ff;
      color: #7c3aed;
    }

    .badge--document_field {
      background: #fee2e2;
      color: #dc2626;
    }

    .confidence-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .confidence-bar {
      width: 60px;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      border-radius: 2px;
      transition: all 0.3s;
    }

    .confidence-fill.high {
      background: #10b981;
    }

    .confidence-fill.medium {
      background: #f59e0b;
    }

    .confidence-fill.low {
      background: #ef4444;
    }

    .confidence-value {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
    }

    .result-content {
      
    }

    .field-label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      line-height: 1.4;
      word-break: break-word;
    }

    .field-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 6px;
    }

    .metadata-item {
      font-size: 11px;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .extraction-results-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .tabs-container {
        justify-content: center;
      }

      .checkbox-group {
        flex-direction: column;
      }

      .confidence-range {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExtractionResultsComponent implements OnInit, OnChanges {
  @Input() extractionResult: ExtractionResult | null = null;
  @Input() selectedFieldId: string | null = null;
  @Input() highlightedFieldId: string | null = null;

  @Output() fieldSelected = new EventEmitter<ExtractedField>();
  @Output() fieldHighlighted = new EventEmitter<ExtractedField | null>();
  @Output() exportRequested = new EventEmitter<{ format: string; data: ExtractedField[] }>();

  constructor(
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {}

  // Component state
  extractedFields: ExtractedField[] = [];
  filteredFields: ExtractedField[] = [];
  activeTab: string = 'all';
  showFilters: boolean = false;
  fieldTypes: string[] = ['word', 'line', 'table', 'key_value_pair', 'document_field'];

  // Filter state
  filters: FilterOptions = {
    fieldTypes: ['line', 'table', 'key_value_pair', 'document_field'],
    minConfidence: 0,
    maxConfidence: 1,
    searchText: '',
    pageNumber: null
  };

  // Tab configuration
  availableTabs = [
    { key: 'all', label: 'All', count: 0 },
    { key: 'document_field', label: 'Fields', count: 0 },
    { key: 'key_value_pair', label: 'Key-Value', count: 0 },
    { key: 'table', label: 'Tables', count: 0 },
    { key: 'line', label: 'Lines', count: 0 },
    { key: 'word', label: 'Words', count: 0 }
  ];

  ngOnInit(): void {
    console.log('[ExtractionResultsComponent] ngOnInit - extractionResult:', this.extractionResult);
    this.processExtractionResult();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[ExtractionResultsComponent] ngOnChanges:', changes);
    if (changes['extractionResult']) {
      console.log('[ExtractionResultsComponent] extractionResult changed:', {
        previousValue: changes['extractionResult'].previousValue,
        currentValue: changes['extractionResult'].currentValue,
        firstChange: changes['extractionResult'].firstChange
      });
      this.processExtractionResult();
    }
  }

  processExtractionResult(): void {
    console.log('[ExtractionResultsComponent] processExtractionResult called');
    console.log('[ExtractionResultsComponent] extractionResult:', this.extractionResult);
    
    this.extractedFields = [];
    
    if (!this.extractionResult?.analyzeResult) {
      console.log('[ExtractionResultsComponent] No analyzeResult found. extractionResult:', this.extractionResult);
      this.updateTabCounts();
      this.applyFilters();
      return;
    }

    const result = this.extractionResult.analyzeResult;
    console.log('[ExtractionResultsComponent] analyzeResult:', result);
    let wordIndex = 0;
    let lineIndex = 0;

    // Process pages for words and lines
    if (result.pages) {
      result.pages.forEach((page: Page) => {
        // Process words
        if (page.words) {
          page.words.forEach((word: Word) => {
            this.extractedFields.push({
              id: `word-${wordIndex++}`,
              type: 'word',
              label: 'Word',
              value: word.content,
              confidence: word.confidence,
              pageNumber: page.pageNumber,
              metadata: { spans: word.span }
            });
          });
        }

        // Process lines
        if (page.lines) {
          page.lines.forEach((line: Line) => {
            this.extractedFields.push({
              id: `line-${lineIndex++}`,
              type: 'line',
              label: 'Text Line',
              value: line.content,
              confidence: 1.0, // Lines typically don't have confidence
              pageNumber: page.pageNumber,
              metadata: { spans: line.spans }
            });
          });
        }
      });
    }

    // Process key-value pairs
    if (result.keyValuePairs) {
      result.keyValuePairs.forEach((kvp: KeyValuePair, index: number) => {
        // Create separate entries for key and value to match BoundingBoxService
        if (kvp.key) {
          this.extractedFields.push({
            id: `kvp-key-${index}`,
            type: 'key_value_pair',
            label: 'Key',
            value: kvp.key.content,
            confidence: kvp.confidence,
            pageNumber: this.getPageNumberFromSpans(kvp.key.spans || [], result),
            metadata: {
              type: 'key',
              kvpIndex: index,
              spans: kvp.key.spans
            }
          });
        }
        
        if (kvp.value) {
          this.extractedFields.push({
            id: `kvp-value-${index}`,
            type: 'key_value_pair',
            label: kvp.key?.content || 'Value',
            value: kvp.value.content,
            confidence: kvp.confidence,
            pageNumber: this.getPageNumberFromSpans(kvp.value.spans || [], result),
            metadata: {
              type: 'value',
              kvpIndex: index,
              spans: kvp.value.spans
            }
          });
        }
      });
    }

    // Process tables
    if (result.tables) {
      result.tables.forEach((table: Table, tableIndex: number) => {
        if (table.cells) {
          table.cells.forEach((cell, cellIndex: number) => {
            this.extractedFields.push({
              id: `table-${tableIndex}-cell-${cellIndex}`,
              type: 'table',
              label: `Table ${tableIndex + 1} Cell`,
              value: cell.content,
              confidence: 1.0, // Table cells typically don't have confidence
              pageNumber: this.getPageNumberFromSpans(cell.spans, result),
              metadata: {
                tableIndex,
                cellIndex,
                row: cell.rowIndex,
                col: cell.columnIndex,
                rowSpan: cell.rowSpan,
                colSpan: cell.columnSpan,
                spans: cell.spans
              }
            });
          });
        }
      });
    }

    // Process document fields
    if (result.documents) {
      result.documents.forEach((doc, docIndex) => {
        Object.entries(doc.fields).forEach(([fieldName, fieldValue]: [string, any]) => {
          if (fieldValue && fieldValue.content) {
            // Handle multiple regions for the same field
            if (fieldValue.boundingRegions && fieldValue.boundingRegions.length > 0) {
              fieldValue.boundingRegions.forEach((region: any, regionIndex: number) => {
                this.extractedFields.push({
                  id: `doc-field-${docIndex}-${fieldName}-${regionIndex}`,
                  type: 'document_field',
                  label: this.formatFieldName(fieldName),
                  value: fieldValue.content,
                  confidence: fieldValue.confidence || 1.0,
                  pageNumber: region.pageNumber || 1,
                  metadata: {
                    docIndex,
                    fieldName,
                    regionIndex,
                    valueType: fieldValue.type,
                    boundingRegion: region
                  }
                });
              });
            } else {
              // Fallback for fields without bounding regions
              this.extractedFields.push({
                id: `doc-field-${docIndex}-${fieldName}-0`,
                type: 'document_field',
                label: this.formatFieldName(fieldName),
                value: fieldValue.content,
                confidence: fieldValue.confidence || 1.0,
                pageNumber: this.getPageNumberFromBoundingRegions(fieldValue.boundingRegions),
                metadata: {
                  docIndex,
                  fieldName,
                  regionIndex: 0,
                  valueType: fieldValue.type,
                  boundingRegions: fieldValue.boundingRegions
                }
              });
            }
          }
        });
      });
    }

    console.log('[ExtractionResultsComponent] Processing complete. Extracted fields:', this.extractedFields.length, this.extractedFields);
    this.updateTabCounts();
    this.applyFilters();
    console.log('[ExtractionResultsComponent] After filtering. Filtered fields:', this.filteredFields.length, this.filteredFields);
    
    // Force change detection since we're using OnPush strategy
    this.cdr.detectChanges();
  }

  private getPageNumberFromSpans(spans: any[], result: AnalyzeResult): number {
    if (!spans || spans.length === 0) return 1;
    
    // Simple approximation - find which page contains the span offset
    const spanOffset = spans[0].offset;
    let currentOffset = 0;
    
    for (const page of result.pages || []) {
      const pageTextLength = (page.lines || []).reduce((total, line) => total + line.content.length + 1, 0);
      if (spanOffset >= currentOffset && spanOffset < currentOffset + pageTextLength) {
        return page.pageNumber;
      }
      currentOffset += pageTextLength;
    }
    
    return 1;
  }

  private getPageNumberFromBoundingRegions(boundingRegions: any[]): number {
    if (!boundingRegions || boundingRegions.length === 0) return 1;
    return boundingRegions[0].pageNumber || 1;
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private updateTabCounts(): void {
    const counts = this.extractedFields.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.availableTabs.forEach(tab => {
      if (tab.key === 'all') {
        tab.count = this.extractedFields.length;
      } else {
        tab.count = counts[tab.key] || 0;
      }
    });
  }

  setActiveTab(tabKey: string): void {
    this.activeTab = tabKey;
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onFieldTypeChange(event: Event, fieldType: string): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.filters.fieldTypes.includes(fieldType)) {
        this.filters.fieldTypes.push(fieldType);
      }
    } else {
      this.filters.fieldTypes = this.filters.fieldTypes.filter(type => type !== fieldType);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.extractedFields];

    // Filter by active tab
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(field => field.type === this.activeTab);
    }

    // Filter by field types
    if (this.filters.fieldTypes.length > 0) {
      filtered = filtered.filter(field => this.filters.fieldTypes.includes(field.type));
    }

    // Filter by confidence range
    filtered = filtered.filter(field => 
      field.confidence >= this.filters.minConfidence && 
      field.confidence <= this.filters.maxConfidence
    );

    // Filter by search text
    if (this.filters.searchText.trim()) {
      const searchLower = this.filters.searchText.toLowerCase();
      filtered = filtered.filter(field =>
        field.label.toLowerCase().includes(searchLower) ||
        field.value.toLowerCase().includes(searchLower)
      );
    }

    // Filter by page number
    if (this.filters.pageNumber !== null) {
      filtered = filtered.filter(field => field.pageNumber === this.filters.pageNumber);
    }

    this.filteredFields = filtered;
  }

  selectField(field: ExtractedField): void {
    this.fieldSelected.emit(field);
  }

  highlightField(field: ExtractedField): void {
    this.fieldHighlighted.emit(field);
  }

  unhighlightField(field: ExtractedField): void {
    this.fieldHighlighted.emit(null);
  }

  formatFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      'word': 'Word',
      'line': 'Line',
      'table': 'Table',
      'key_value_pair': 'Key-Value',
      'document_field': 'Field'
    };
    return typeMap[type] || type;
  }

  trackByField(index: number, field: ExtractedField): string {
    return field.id;
  }

  exportResults(): void {
    if (this.filteredFields.length === 0) {
      return;
    }

    // Use the export service to download results as JSON by default
    this.exportService.exportExtractionResults(this.filteredFields, {
      format: 'json',
      includeMetadata: true,
      includeConfidence: true,
      groupByType: false,
      filename: `extraction-results-${new Date().toISOString().split('T')[0]}`
    });

    // Also emit the event for parent components that might want to handle it
    this.exportRequested.emit({
      format: 'json',
      data: this.filteredFields
    });
  }
}
