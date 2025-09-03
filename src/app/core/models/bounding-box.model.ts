export interface BoundingBox {
  id: string;
  polygon: number[];
  content: string;
  confidence: number;
  type: BoundingBoxType;
  pageNumber: number;
  canvasCoordinates?: CanvasCoordinates;
  isHighlighted?: boolean;
  isSelected?: boolean;
}

export enum BoundingBoxType {
  WORD = 'word',
  LINE = 'line',
  TABLE_CELL = 'table_cell',
  KEY_VALUE_PAIR = 'key_value_pair',
  DOCUMENT_FIELD = 'document_field'
}

export interface CanvasCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Point[];
}

export interface Point {
  x: number;
  y: number;
}

export interface PageDimensions {
  width: number;
  height: number;
  scale: number;
}

export interface BoundingBoxInteraction {
  boundingBox: BoundingBox;
  event: InteractionEvent;
  timestamp: Date;
}

export enum InteractionEvent {
  CLICK = 'click',
  HOVER = 'hover',
  SELECT = 'select',
  DESELECT = 'deselect'
}

export interface OverlaySettings {
  showWords: boolean;
  showLines: boolean;
  showTables: boolean;
  showKeyValuePairs: boolean;
  showDocumentFields: boolean;
  opacity: number;
  highlightColor: string;
  selectedColor: string;
}