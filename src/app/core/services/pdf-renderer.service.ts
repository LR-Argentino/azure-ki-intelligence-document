import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

// Configure PDF.js worker - use file in public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface PdfRenderOptions {
  scale: number;
  rotation: number;
}

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

@Injectable({
  providedIn: 'root'
})
export class PdfRendererService {
  private currentDocument: PDFDocumentProxy | null = null;
  private renderTasks: Map<number, RenderTask> = new Map();

  constructor() {}

  /**
   * Load PDF document from ArrayBuffer
   */
  async loadDocument(pdfData: ArrayBuffer): Promise<PDFDocumentProxy> {
    try {
      // Clean up previous document
      if (this.currentDocument) {
        await this.cleanup();
      }

      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        cMapUrl: '/assets/cmaps/',
        cMapPacked: true,
      });

      this.currentDocument = await loadingTask.promise;
      return this.currentDocument;
    } catch (error) {
      console.error('Error loading PDF document:', error);
      throw new Error('Failed to load PDF document');
    }
  }

  /**
   * Get document information
   */
  getDocumentInfo(): { numPages: number } | null {
    if (!this.currentDocument) {
      return null;
    }
    return {
      numPages: this.currentDocument.numPages
    };
  }

  /**
   * Render a specific page to canvas with proper zoom behavior
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    options: PdfRenderOptions = { scale: 1.0, rotation: 0 }
  ): Promise<PdfPageInfo> {
    if (!this.currentDocument) {
      throw new Error('No PDF document loaded');
    }

    try {
      // Cancel any existing render task for this page
      const existingTask = this.renderTasks.get(pageNumber);
      if (existingTask) {
        existingTask.cancel();
        this.renderTasks.delete(pageNumber);
      }

      const page = await this.currentDocument.getPage(pageNumber);
      
      // Get base viewport at scale 1.0 to determine natural dimensions
      const baseViewport = page.getViewport({ scale: 1.0, rotation: options.rotation });
      
      // Calculate container constraints
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const containerHeight = canvas.parentElement?.clientHeight || 600;
      
      // Calculate the fit scale to make the page fit within container at scale 1.0
      const fitScale = Math.min(
        (containerWidth * 0.9) / baseViewport.width,
        (containerHeight * 0.9) / baseViewport.height
      );
      
      // Apply both fit scale and zoom scale
      const actualScale = fitScale * options.scale;
      
      // Get viewport with actual scale
      const viewport = page.getViewport({
        scale: actualScale,
        rotation: options.rotation
      });

      // Set canvas dimensions
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Handle high DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      const scaledWidth = viewport.width * devicePixelRatio;
      const scaledHeight = viewport.height * devicePixelRatio;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      // Set canvas display size - this stays proportional to zoom
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';
      
      // For zoom > 1.0, we want the canvas to overflow its container
      // This creates the "zoom in" effect
      if (options.scale > 1.0) {
        canvas.style.maxWidth = 'none';
        canvas.style.maxHeight = 'none';
      } else {
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
      }

      context.scale(devicePixelRatio, devicePixelRatio);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };

      const renderTask = page.render(renderContext);
      this.renderTasks.set(pageNumber, renderTask);

      await renderTask.promise;
      this.renderTasks.delete(pageNumber);

      return {
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        scale: options.scale,
        rotation: options.rotation
      };
    } catch (error) {
      this.renderTasks.delete(pageNumber);
      if (error instanceof Error && error.name === 'RenderingCancelledException') {
        console.log(`Rendering cancelled for page ${pageNumber}`);
        throw error;
      }
      console.error(`Error rendering page ${pageNumber}:`, error);
      throw new Error(`Failed to render page ${pageNumber}`);
    }
  }

  /**
   * Get page dimensions without rendering
   */
  async getPageDimensions(pageNumber: number, scale: number = 1.0): Promise<{ width: number; height: number }> {
    if (!this.currentDocument) {
      throw new Error('No PDF document loaded');
    }

    try {
      const page = await this.currentDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      return {
        width: viewport.width,
        height: viewport.height
      };
    } catch (error) {
      console.error(`Error getting page ${pageNumber} dimensions:`, error);
      throw new Error(`Failed to get page ${pageNumber} dimensions`);
    }
  }

  /**
   * Cancel all render tasks and cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cancel all pending render tasks
    for (const [pageNumber, renderTask] of this.renderTasks) {
      try {
        renderTask.cancel();
      } catch (error) {
        console.warn(`Error cancelling render task for page ${pageNumber}:`, error);
      }
    }
    this.renderTasks.clear();

    // Cleanup document
    if (this.currentDocument) {
      try {
        await this.currentDocument.destroy();
      } catch (error) {
        console.warn('Error destroying PDF document:', error);
      }
      this.currentDocument = null;
    }
  }

  /**
   * Check if a document is currently loaded
   */
  isDocumentLoaded(): boolean {
    return this.currentDocument !== null;
  }

  /**
   * Get the current document
   */
  getCurrentDocument(): PDFDocumentProxy | null {
    return this.currentDocument;
  }
}
