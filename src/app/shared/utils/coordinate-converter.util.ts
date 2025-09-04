import { CanvasCoordinates, Point, PageDimensions } from '../../core/models/bounding-box.model';

export class CoordinateConverterUtil {

  /**
   * Convert Azure Document Intelligence polygon coordinates to canvas coordinates
   */
  static polygonToCanvas(
    polygon: number[], 
    pageDimensions: PageDimensions,
    canvasWidth: number,
    canvasHeight: number
  ): CanvasCoordinates {
    if (polygon.length < 8) {
      throw new Error('Polygon must have at least 4 points (8 coordinates)');
    }

    const points: Point[] = [];
    
    // Convert polygon points (x1, y1, x2, y2, x3, y3, x4, y4) to canvas coordinates
    for (let i = 0; i < polygon.length; i += 2) {
      const x = (polygon[i] / pageDimensions.width) * canvasWidth * pageDimensions.scale;
      const y = (polygon[i + 1] / pageDimensions.height) * canvasHeight * pageDimensions.scale;
      points.push({ x, y });
    }

    // Calculate bounding rectangle
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points: points
    };
  }

  /**
   * Convert canvas coordinates back to document coordinates
   */
  static canvasToDocument(
    canvasCoords: CanvasCoordinates,
    pageDimensions: PageDimensions,
    canvasWidth: number,
    canvasHeight: number
  ): number[] {
    if (!canvasCoords.points || canvasCoords.points.length === 0) {
      // If no points, create rectangle from x, y, width, height
      const x1 = (canvasCoords.x / canvasWidth) * pageDimensions.width;
      const y1 = (canvasCoords.y / canvasHeight) * pageDimensions.height;
      const x2 = ((canvasCoords.x + canvasCoords.width) / canvasWidth) * pageDimensions.width;
      const y2 = ((canvasCoords.y + canvasCoords.height) / canvasHeight) * pageDimensions.height;
      
      return [x1, y1, x2, y1, x2, y2, x1, y2];
    }

    // Convert points back to document coordinates
    const polygon: number[] = [];
    for (const point of canvasCoords.points) {
      const x = (point.x / canvasWidth) * pageDimensions.width;
      const y = (point.y / canvasHeight) * pageDimensions.height;
      polygon.push(x, y);
    }

    return polygon;
  }

  /**
   * Scale coordinates by a factor
   */
  static scaleCoordinates(coords: CanvasCoordinates, scaleFactor: number): CanvasCoordinates {
    return {
      x: coords.x * scaleFactor,
      y: coords.y * scaleFactor,
      width: coords.width * scaleFactor,
      height: coords.height * scaleFactor,
      points: coords.points?.map(point => ({
        x: point.x * scaleFactor,
        y: point.y * scaleFactor
      }))
    };
  }

  /**
   * Check if a point is inside a bounding box
   */
  static isPointInBoundingBox(point: Point, boundingBox: CanvasCoordinates): boolean {
    return point.x >= boundingBox.x &&
           point.x <= boundingBox.x + boundingBox.width &&
           point.y >= boundingBox.y &&
           point.y <= boundingBox.y + boundingBox.height;
  }

  /**
   * Check if two bounding boxes overlap
   */
  static boundingBoxesOverlap(box1: CanvasCoordinates, box2: CanvasCoordinates): boolean {
    return !(box1.x + box1.width < box2.x ||
             box2.x + box2.width < box1.x ||
             box1.y + box1.height < box2.y ||
             box2.y + box2.height < box1.y);
  }

  /**
   * Calculate the center point of a bounding box
   */
  static getBoundingBoxCenter(boundingBox: CanvasCoordinates): Point {
    return {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2
    };
  }

  /**
   * Calculate the area of a bounding box
   */
  static getBoundingBoxArea(boundingBox: CanvasCoordinates): number {
    return boundingBox.width * boundingBox.height;
  }

  /**
   * Convert screen/client coordinates to canvas coordinates
   * Taking into account canvas offset and scroll position
   */
  static screenToCanvas(
    screenX: number,
    screenY: number,
    canvasElement: HTMLCanvasElement
  ): Point {
    const rect = canvasElement.getBoundingClientRect();
    
    return {
      x: screenX - rect.left,
      y: screenY - rect.top
    };
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   */
  static isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let isInside = false;
    const x = point.x;
    const y = point.y;

    let j = polygon.length - 1;
    for (let i = 0; i < polygon.length; i++) {
      if (
        (polygon[i].y > y) !== (polygon[j].y > y) &&
        x < ((polygon[j].x - polygon[i].x) * (y - polygon[i].y)) / (polygon[j].y - polygon[i].y) + polygon[i].x
      ) {
        isInside = !isInside;
      }
      j = i;
    }

    return isInside;
  }

  /**
   * Calculate distance between two points
   */
  static getDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clamp coordinates to canvas bounds
   */
  static clampToCanvas(
    point: Point,
    canvasWidth: number,
    canvasHeight: number
  ): Point {
    return {
      x: Math.max(0, Math.min(canvasWidth, point.x)),
      y: Math.max(0, Math.min(canvasHeight, point.y))
    };
  }

  /**
   * Convert polygon array to Point array
   */
  static polygonToPoints(polygon: number[]): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < polygon.length; i += 2) {
      points.push({
        x: polygon[i],
        y: polygon[i + 1]
      });
    }
    return points;
  }

  /**
   * Convert Point array to polygon array
   */
  static pointsToPolygon(points: Point[]): number[] {
    const polygon: number[] = [];
    points.forEach(point => {
      polygon.push(point.x, point.y);
    });
    return polygon;
  }
}
