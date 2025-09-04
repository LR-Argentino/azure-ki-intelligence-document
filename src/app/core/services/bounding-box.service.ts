import { Injectable } from '@angular/core';
import { BoundingBox, CanvasCoordinates, BoundingBoxType, Point } from '../models/bounding-box.model';
import { ExtractionResult, AnalyzeResult, Page, Word, Line, Table, KeyValuePair } from '../models/document.model';

/**
 * Service for managing bounding box overlays and coordinate conversions
 * Handles conversion from Azure Document Intelligence coordinates to canvas coordinates
 */
@Injectable({
  providedIn: 'root'
})
export class BoundingBoxService {

  /**
   * Convert Azure Document Intelligence polygon coordinates to canvas coordinates
   * Azure uses normalized coordinates (0-1) based on page dimensions
   * Canvas uses pixel coordinates
   */
  convertPolygonToCanvasCoordinates(
    azurePolygon: number[],
    pageWidth: number,
    pageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    scale: number = 1
  ): CanvasCoordinates {
    if (!azurePolygon || azurePolygon.length < 8) {
      throw new Error('Invalid polygon: must have at least 4 points (8 coordinates)');
    }

    // Convert polygon points to canvas coordinates
    const points: Point[] = [];
    for (let i = 0; i < azurePolygon.length; i += 2) {
      const x = (azurePolygon[i] / pageWidth) * canvasWidth * scale;
      const y = (azurePolygon[i + 1] / pageHeight) * canvasHeight * scale;
      points.push({ x, y });
    }

    // Calculate bounding rectangle from polygon points
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points
    };
  }

  /**
   * Create bounding boxes from Azure Document Intelligence extraction results
   */
  createBoundingBoxes(
    extractionResult: ExtractionResult,
    pageNumber: number,
    canvasWidth: number,
    canvasHeight: number,
    scale: number = 1
  ): BoundingBox[] {
    if (!extractionResult?.analyzeResult?.pages) {
      return [];
    }

    const page = extractionResult.analyzeResult.pages.find(p => p.pageNumber === pageNumber);
    if (!page) {
      return [];
    }

    const boundingBoxes: BoundingBox[] = [];

    // Process words
    if (page.words) {
      page.words.forEach((word, index) => {
        const canvasCoordinates = this.convertPolygonToCanvasCoordinates(
          word.polygon,
          page.width,
          page.height,
          canvasWidth,
          canvasHeight,
          scale
        );

        boundingBoxes.push({
          id: `word-${pageNumber}-${index}`,
          polygon: word.polygon,
          content: word.content,
          confidence: word.confidence,
          type: BoundingBoxType.WORD,
          pageNumber,
          canvasCoordinates
        });
      });
    }

    // Process lines
    if (page.lines) {
      page.lines.forEach((line, index) => {
        const canvasCoordinates = this.convertPolygonToCanvasCoordinates(
          line.polygon,
          page.width,
          page.height,
          canvasWidth,
          canvasHeight,
          scale
        );

        boundingBoxes.push({
          id: `line-${pageNumber}-${index}`,
          polygon: line.polygon,
          content: line.content,
          confidence: 1.0, // Lines typically don't have confidence scores
          type: BoundingBoxType.LINE,
          pageNumber,
          canvasCoordinates
        });
      });
    }

    // Process tables
    if (extractionResult.analyzeResult.tables) {
      extractionResult.analyzeResult.tables.forEach((table, tableIndex) => {
        table.cells.forEach((cell, cellIndex) => {
          // Check if cell belongs to current page
          const cellPage = this.getPageNumberForSpan(cell.spans, extractionResult.analyzeResult);
          if (cellPage === pageNumber) {
            const canvasCoordinates = this.convertPolygonToCanvasCoordinates(
              cell.polygon,
              page.width,
              page.height,
              canvasWidth,
              canvasHeight,
              scale
            );

            boundingBoxes.push({
              id: `table-${tableIndex}-cell-${cellIndex}`,
              polygon: cell.polygon,
              content: cell.content,
              confidence: 1.0, // Table cells typically don't have confidence scores
              type: BoundingBoxType.TABLE_CELL,
              pageNumber,
              canvasCoordinates
            });
          }
        });
      });
    }

    // Process key-value pairs
    if (extractionResult.analyzeResult.keyValuePairs) {
      extractionResult.analyzeResult.keyValuePairs.forEach((kvp, index) => {
        // Process key
        if (kvp.key) {
          const keyPage = this.getPageNumberForSpan(kvp.key.spans, extractionResult.analyzeResult);
          if (keyPage === pageNumber) {
            const canvasCoordinates = this.convertPolygonToCanvasCoordinates(
              kvp.key.polygon,
              page.width,
              page.height,
              canvasWidth,
              canvasHeight,
              scale
            );

            boundingBoxes.push({
              id: `kvp-key-${index}`,
              polygon: kvp.key.polygon,
              content: kvp.key.content,
              confidence: kvp.confidence,
              type: BoundingBoxType.KEY_VALUE_PAIR,
              pageNumber,
              canvasCoordinates
            });
          }
        }

        // Process value
        if (kvp.value) {
          const valuePage = this.getPageNumberForSpan(kvp.value.spans, extractionResult.analyzeResult);
          if (valuePage === pageNumber) {
            const canvasCoordinates = this.convertPolygonToCanvasCoordinates(
              kvp.value.polygon,
              page.width,
              page.height,
              canvasWidth,
              canvasHeight,
              scale
            );

            boundingBoxes.push({
              id: `kvp-value-${index}`,
              polygon: kvp.value.polygon,
              content: kvp.value.content,
              confidence: kvp.confidence,
              type: BoundingBoxType.KEY_VALUE_PAIR,
              pageNumber,
              canvasCoordinates
            });
          }
        }
      });
    }

    // Process document fields
    if (extractionResult.analyzeResult.documents) {
      extractionResult.analyzeResult.documents.forEach((doc, docIndex) => {
        Object.entries(doc.fields).forEach(([fieldName, fieldValue], fieldIndex) => {
          if (fieldValue && fieldValue.boundingRegions) {
            fieldValue.boundingRegions.forEach((region: any, regionIndex: number) => {
              if (region.pageNumber === pageNumber) {
                const canvasCoordinates = this.convertPolygonToCanvasCoordinates(
                  region.polygon,
                  page.width,
                  page.height,
                  canvasWidth,
                  canvasHeight,
                  scale
                );

                boundingBoxes.push({
                  id: `doc-field-${docIndex}-${fieldName}-${regionIndex}`,
                  polygon: region.polygon,
                  content: fieldValue.content || fieldName,
                  confidence: fieldValue.confidence || 1.0,
                  type: BoundingBoxType.DOCUMENT_FIELD,
                  pageNumber,
                  canvasCoordinates
                });
              }
            });
          }
        });
      });
    }

    return boundingBoxes;
  }

  /**
   * Update bounding box coordinates when canvas dimensions or scale change
   */
  updateBoundingBoxCoordinates(
    boundingBoxes: BoundingBox[],
    pageWidth: number,
    pageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    scale: number
  ): BoundingBox[] {
    return boundingBoxes.map(box => ({
      ...box,
      canvasCoordinates: this.convertPolygonToCanvasCoordinates(
        box.polygon,
        pageWidth,
        pageHeight,
        canvasWidth,
        canvasHeight,
        scale
      )
    }));
  }

  /**
   * Get color for different bounding box types
   */
  getColorForType(type: BoundingBoxType): string {
    switch (type) {
      case BoundingBoxType.WORD:
        return '#3b82f6'; // Blue
      case BoundingBoxType.LINE:
        return '#10b981'; // Green
      case BoundingBoxType.TABLE_CELL:
        return '#f59e0b'; // Orange
      case BoundingBoxType.KEY_VALUE_PAIR:
        return '#8b5cf6'; // Purple
      case BoundingBoxType.DOCUMENT_FIELD:
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get opacity for different confidence levels
   */
  getOpacityForConfidence(confidence: number): number {
    if (confidence >= 0.9) return 0.8;
    if (confidence >= 0.7) return 0.6;
    if (confidence >= 0.5) return 0.4;
    return 0.2;
  }

  /**
   * Check if a point is inside a bounding box
   */
  isPointInBoundingBox(point: Point, boundingBox: BoundingBox): boolean {
    if (!boundingBox.canvasCoordinates) return false;

    const coords = boundingBox.canvasCoordinates;
    return (
      point.x >= coords.x &&
      point.x <= coords.x + coords.width &&
      point.y >= coords.y &&
      point.y <= coords.y + coords.height
    );
  }

  /**
   * Find bounding box at given coordinates
   */
  getBoundingBoxAtPoint(point: Point, boundingBoxes: BoundingBox[]): BoundingBox | null {
    // Search from top to bottom (reverse order for proper z-index handling)
    for (let i = boundingBoxes.length - 1; i >= 0; i--) {
      if (this.isPointInBoundingBox(point, boundingBoxes[i])) {
        return boundingBoxes[i];
      }
    }
    return null;
  }

  /**
   * Helper method to determine which page a span belongs to
   */
  private getPageNumberForSpan(spans: any[], analyzeResult: AnalyzeResult): number {
    if (!spans || spans.length === 0) return 1;
    
    // Find the page that contains the span offset
    const spanOffset = spans[0].offset;
    let currentOffset = 0;
    
    for (const page of analyzeResult.pages) {
      const pageTextLength = this.calculatePageTextLength(page);
      if (spanOffset >= currentOffset && spanOffset < currentOffset + pageTextLength) {
        return page.pageNumber;
      }
      currentOffset += pageTextLength;
    }
    
    return 1; // Default to first page
  }

  /**
   * Calculate approximate text length for a page
   */
  private calculatePageTextLength(page: Page): number {
    if (page.lines) {
      return page.lines.reduce((total, line) => total + line.content.length + 1, 0);
    }
    if (page.words) {
      return page.words.reduce((total, word) => total + word.content.length + 1, 0);
    }
    return 0;
  }
}
