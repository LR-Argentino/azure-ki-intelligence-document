import { Injectable } from '@angular/core';
import { ExtractedField } from '../../shared/components/extraction-results/extraction-results.component';

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt';
  includeMetadata: boolean;
  includeConfidence: boolean;
  groupByType: boolean;
  filename?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export extraction results to specified format
   */
  exportExtractionResults(
    fields: ExtractedField[], 
    options: ExportOptions = {
      format: 'json',
      includeMetadata: true,
      includeConfidence: true,
      groupByType: false
    }
  ): void {
    const filename = options.filename || `extraction-results-${Date.now()}`;
    
    switch (options.format) {
      case 'json':
        this.exportAsJSON(fields, options, filename);
        break;
      case 'csv':
        this.exportAsCSV(fields, options, filename);
        break;
      case 'txt':
        this.exportAsText(fields, options, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as JSON format
   */
  private exportAsJSON(fields: ExtractedField[], options: ExportOptions, filename: string): void {
    let exportData: any;

    if (options.groupByType) {
      exportData = this.groupFieldsByType(fields);
    } else {
      exportData = fields.map(field => this.sanitizeField(field, options));
    }

    const jsonData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalFields: fields.length,
        format: 'json',
        options: {
          includeMetadata: options.includeMetadata,
          includeConfidence: options.includeConfidence,
          groupByType: options.groupByType
        }
      },
      data: exportData
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${filename}.json`);
  }

  /**
   * Export as CSV format
   */
  private exportAsCSV(fields: ExtractedField[], options: ExportOptions, filename: string): void {
    const headers = ['Type', 'Label', 'Value', 'Page'];
    
    if (options.includeConfidence) {
      headers.push('Confidence');
    }
    
    if (options.includeMetadata) {
      headers.push('Metadata');
    }

    const rows = [headers];
    
    fields.forEach(field => {
      const row = [
        this.escapeCSVValue(field.type),
        this.escapeCSVValue(field.label),
        this.escapeCSVValue(field.value),
        field.pageNumber.toString()
      ];
      
      if (options.includeConfidence) {
        row.push(`${(field.confidence * 100).toFixed(1)}%`);
      }
      
      if (options.includeMetadata && field.metadata) {
        const metadataStr = this.formatMetadataForCSV(field.metadata);
        row.push(this.escapeCSVValue(metadataStr));
      }
      
      rows.push(row);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  /**
   * Export as formatted text
   */
  private exportAsText(fields: ExtractedField[], options: ExportOptions, filename: string): void {
    let textContent = `Extraction Results Export\n`;
    textContent += `Generated: ${new Date().toLocaleString()}\n`;
    textContent += `Total Fields: ${fields.length}\n`;
    textContent += `${'='.repeat(50)}\n\n`;

    if (options.groupByType) {
      const groupedFields = this.groupFieldsByType(fields);
      
      Object.entries(groupedFields).forEach(([type, typeFields]) => {
        textContent += `${this.formatFieldTypeName(type)} (${typeFields.length})\n`;
        textContent += `${'-'.repeat(30)}\n`;
        
        typeFields.forEach((field: ExtractedField, index: number) => {
          textContent += `${index + 1}. ${field.label}: ${field.value}\n`;
          
          if (options.includeConfidence) {
            textContent += `   Confidence: ${(field.confidence * 100).toFixed(1)}%\n`;
          }
          
          textContent += `   Page: ${field.pageNumber}\n`;
          
          if (options.includeMetadata && field.metadata) {
            const metadataStr = this.formatMetadataForText(field.metadata);
            if (metadataStr) {
              textContent += `   Metadata: ${metadataStr}\n`;
            }
          }
          
          textContent += '\n';
        });
        
        textContent += '\n';
      });
    } else {
      fields.forEach((field, index) => {
        textContent += `${index + 1}. [${this.formatFieldTypeName(field.type)}] ${field.label}\n`;
        textContent += `   Value: ${field.value}\n`;
        
        if (options.includeConfidence) {
          textContent += `   Confidence: ${(field.confidence * 100).toFixed(1)}%\n`;
        }
        
        textContent += `   Page: ${field.pageNumber}\n`;
        
        if (options.includeMetadata && field.metadata) {
          const metadataStr = this.formatMetadataForText(field.metadata);
          if (metadataStr) {
            textContent += `   Metadata: ${metadataStr}\n`;
          }
        }
        
        textContent += '\n';
      });
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.txt`);
  }

  /**
   * Group fields by their type
   */
  private groupFieldsByType(fields: ExtractedField[]): Record<string, ExtractedField[]> {
    return fields.reduce((acc, field) => {
      if (!acc[field.type]) {
        acc[field.type] = [];
      }
      acc[field.type].push(field);
      return acc;
    }, {} as Record<string, ExtractedField[]>);
  }

  /**
   * Sanitize field data based on export options
   */
  private sanitizeField(field: ExtractedField, options: ExportOptions): any {
    const sanitized: any = {
      id: field.id,
      type: field.type,
      label: field.label,
      value: field.value,
      pageNumber: field.pageNumber
    };

    if (options.includeConfidence) {
      sanitized.confidence = field.confidence;
    }

    if (options.includeMetadata && field.metadata) {
      sanitized.metadata = field.metadata;
    }

    return sanitized;
  }

  /**
   * Format field type name for display
   */
  private formatFieldTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'word': 'Words',
      'line': 'Text Lines',
      'table': 'Table Cells',
      'key_value_pair': 'Key-Value Pairs',
      'document_field': 'Document Fields'
    };
    return typeMap[type] || type;
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Format metadata for CSV export
   */
  private formatMetadataForCSV(metadata: any): string {
    const items: string[] = [];
    
    if (metadata.row !== undefined && metadata.col !== undefined) {
      items.push(`Row: ${metadata.row + 1}, Col: ${metadata.col + 1}`);
    }
    
    if (metadata.tableIndex !== undefined) {
      items.push(`Table: ${metadata.tableIndex + 1}`);
    }
    
    if (metadata.fieldName) {
      items.push(`Field: ${metadata.fieldName}`);
    }
    
    if (metadata.valueType) {
      items.push(`Type: ${metadata.valueType}`);
    }
    
    return items.join('; ');
  }

  /**
   * Format metadata for text export
   */
  private formatMetadataForText(metadata: any): string {
    const items: string[] = [];
    
    if (metadata.row !== undefined && metadata.col !== undefined) {
      items.push(`Row ${metadata.row + 1}, Column ${metadata.col + 1}`);
    }
    
    if (metadata.tableIndex !== undefined) {
      items.push(`Table ${metadata.tableIndex + 1}`);
    }
    
    if (metadata.fieldName) {
      items.push(`Field Name: ${metadata.fieldName}`);
    }
    
    if (metadata.valueType) {
      items.push(`Value Type: ${metadata.valueType}`);
    }
    
    return items.join(', ');
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): Array<{ key: string; label: string; description: string }> {
    return [
      {
        key: 'json',
        label: 'JSON',
        description: 'Structured data format for programmatic use'
      },
      {
        key: 'csv',
        label: 'CSV',
        description: 'Comma-separated values for spreadsheet applications'
      },
      {
        key: 'txt',
        label: 'Text',
        description: 'Human-readable formatted text'
      }
    ];
  }

  /**
   * Generate export preview
   */
  generatePreview(fields: ExtractedField[], format: string, maxItems: number = 5): string {
    const previewFields = fields.slice(0, maxItems);
    
    switch (format) {
      case 'json':
        return JSON.stringify(previewFields.map(f => this.sanitizeField(f, {
          format: 'json',
          includeMetadata: true,
          includeConfidence: true,
          groupByType: false
        })), null, 2);
      
      case 'csv':
        const headers = ['Type', 'Label', 'Value', 'Page', 'Confidence'];
        const rows = [headers];
        previewFields.forEach(field => {
          rows.push([
            field.type,
            field.label,
            field.value.substring(0, 50) + (field.value.length > 50 ? '...' : ''),
            field.pageNumber.toString(),
            `${(field.confidence * 100).toFixed(1)}%`
          ]);
        });
        return rows.map(row => row.join(',')).join('\n');
      
      case 'txt':
        let preview = '';
        previewFields.forEach((field, index) => {
          preview += `${index + 1}. [${this.formatFieldTypeName(field.type)}] ${field.label}\n`;
          preview += `   Value: ${field.value}\n`;
          preview += `   Confidence: ${(field.confidence * 100).toFixed(1)}%\n`;
          preview += `   Page: ${field.pageNumber}\n\n`;
        });
        return preview;
      
      default:
        return 'Preview not available for this format';
    }
  }
}
