import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { 
  ChatMessage, 
  ChatResponse, 
  ChatSession, 
  MessageSender, 
  ContractAnalysis,
  KeyInfo,
  DocumentSource
} from '../models/chat.model';
import { ExtractionResult, DocumentType } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatHistory = signal<ChatMessage[]>([]);
  private currentSession = signal<ChatSession | null>(null);

  readonly chatHistorySignal = this.chatHistory.asReadonly();
  readonly currentSessionSignal = this.currentSession.asReadonly();

  /**
   * Send message with document context for RAG
   */
  sendMessage(
    message: string, 
    documentContext: ExtractionResult
  ): Observable<ChatResponse> {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: message,
      timestamp: new Date(),
      sender: MessageSender.USER,
      documentId: this.currentSession()?.documentId
    };

    this.addMessageToHistory(userMessage);

    // Simulate RAG processing and generate response
    return this.generateRAGResponse(message, documentContext).pipe(
      delay(1500), // Simulate processing time
      map(response => {
        this.addMessageToHistory(response.message);
        return response;
      })
    );
  }

  /**
   * Get chat history for document
   */
  getChatHistory(documentId: string): Observable<ChatMessage[]> {
    const messages = this.chatHistory().filter(msg => msg.documentId === documentId);
    return of(messages);
  }

  /**
   * Start new chat session
   */
  startChatSession(documentId: string): Observable<ChatSession> {
    const session: ChatSession = {
      id: this.generateId(),
      documentId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.currentSession.set(session);
    this.chatHistory.set([]);

    return of(session);
  }

  /**
   * Specialized contract analysis
   */
  analyzeContract(
    query: string, 
    contractData: ExtractionResult
  ): Observable<ContractAnalysis> {
    // Mock contract analysis
    const analysis: ContractAnalysis = {
      clauses: [
        {
          type: 'Payment Terms',
          content: 'Payment shall be made within 30 days of invoice date.',
          location: {
            pageNumber: 1,
            boundingBox: [100, 200, 400, 250],
            textSpan: { start: 150, end: 200 }
          },
          importance: 'high' as any
        }
      ],
      keyTerms: [
        {
          term: 'Force Majeure',
          definition: 'Unforeseeable circumstances that prevent a party from fulfilling a contract.',
          occurrences: [
            {
              pageNumber: 2,
              boundingBox: [50, 300, 200, 320],
              textSpan: { start: 500, end: 520 }
            }
          ]
        }
      ],
      risks: [
        {
          type: 'legal' as any,
          description: 'Unclear termination clause may lead to disputes.',
          severity: 'medium' as any,
          location: {
            pageNumber: 3,
            boundingBox: [100, 400, 500, 450],
            textSpan: { start: 800, end: 850 }
          }
        }
      ],
      summary: 'This contract contains standard commercial terms with moderate risk factors.'
    };

    return of(analysis).pipe(delay(2000));
  }

  /**
   * Extract key information based on document type
   */
  extractKeyInfo(
    documentType: DocumentType,
    extractionResult: ExtractionResult
  ): Observable<KeyInfo[]> {
    let keyInfo: KeyInfo[] = [];

    switch (documentType) {
      case DocumentType.INVOICE:
        keyInfo = [
          {
            label: 'Invoice Number',
            value: 'INV-2024-001',
            confidence: 0.95,
            location: {
              pageNumber: 1,
              boundingBox: [100, 50, 200, 70],
              textSpan: { start: 0, end: 12 }
            }
          },
          {
            label: 'Total Amount',
            value: '$1,250.00',
            confidence: 0.98,
            location: {
              pageNumber: 1,
              boundingBox: [400, 300, 500, 320],
              textSpan: { start: 200, end: 210 }
            }
          }
        ];
        break;

      case DocumentType.CONTRACT:
        keyInfo = [
          {
            label: 'Contract Date',
            value: '2024-01-15',
            confidence: 0.92,
            location: {
              pageNumber: 1,
              boundingBox: [300, 100, 400, 120],
              textSpan: { start: 50, end: 60 }
            }
          },
          {
            label: 'Contract Value',
            value: '$50,000',
            confidence: 0.89,
            location: {
              pageNumber: 2,
              boundingBox: [200, 250, 300, 270],
              textSpan: { start: 300, end: 310 }
            }
          }
        ];
        break;

      default:
        keyInfo = [
          {
            label: 'Document Type',
            value: documentType,
            confidence: 0.85
          }
        ];
    }

    return of(keyInfo).pipe(delay(1000));
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.chatHistory.set([]);
  }

  private generateRAGResponse(query: string, context: ExtractionResult): Observable<ChatResponse> {
    // Mock RAG response generation
    const responses = [
      "Based on the document analysis, I can see that this document contains structured information about the topic you're asking about.",
      "According to the extracted content, the document shows relevant details that address your question.",
      "The document intelligence analysis reveals several key points related to your inquiry.",
      "From the processed document data, I can provide insights about the specific information you're looking for."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      content: randomResponse,
      timestamp: new Date(),
      sender: MessageSender.ASSISTANT,
      documentId: this.currentSession()?.documentId,
      confidence: 0.85,
      sources: [
        {
          documentId: this.currentSession()?.documentId || '',
          pageNumber: 1,
          content: context.analyzeResult.content.substring(0, 100) + '...',
          confidence: 0.9
        }
      ]
    };

    const response: ChatResponse = {
      message: assistantMessage,
      sources: assistantMessage.sources || [],
      confidence: 0.85,
      processingTime: 1200
    };

    return of(response);
  }

  private addMessageToHistory(message: ChatMessage): void {
    this.chatHistory.update(history => [...history, message]);
    
    // Update session last activity
    if (this.currentSession()) {
      this.currentSession.update(session => 
        session ? { ...session, lastActivity: new Date() } : null
      );
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}