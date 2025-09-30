import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiLoggerService {

  constructor() { }

  /**
   * Log une requête HTTP
   */
  logRequest(request: HttpRequest<any>): void {
    console.group(`🚀 HTTP Request: ${request.method} ${request.url}`);
    console.log('Headers:', request.headers);
    console.log('Body:', request.body);
    console.log('URL:', request.url);
    console.groupEnd();
  }

  /**
   * Log une réponse HTTP réussie
   */
  logResponse(response: HttpResponse<any>): void {
    console.group(`✅ HTTP Response: ${response.status} ${response.url}`);
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Body:', response.body);
    console.groupEnd();
  }

  /**
   * Log une erreur HTTP
   */
  logError(error: HttpErrorResponse): void {
    console.group(`❌ HTTP Error: ${error.status} ${error.url}`);
    console.error('Status:', error.status);
    console.error('Status Text:', error.statusText);
    console.error('Message:', error.message);
    console.error('Error:', error.error);
    console.error('URL:', error.url);
    console.error('Headers:', error.headers);
    console.groupEnd();
  }

  /**
   * Log une tentative de création d'entité
   */
  logEntityCreation(entityType: string, data: any): void {
    console.group(`📝 Creating ${entityType}`);
    console.log('Data:', data);
    console.groupEnd();
  }

  /**
   * Log une création d'entité réussie
   */
  logEntityCreated(entityType: string, entity: any): void {
    console.group(`✅ ${entityType} Created Successfully`);
    console.log('Created Entity:', entity);
    console.groupEnd();
  }

  /**
   * Log une erreur de création d'entité
   */
  logEntityCreationError(entityType: string, error: any): void {
    console.group(`❌ Failed to Create ${entityType}`);
    console.error('Error:', error);
    console.error('Error Details:', {
      status: error.status,
      message: error.message,
      url: error.url,
      body: error.error
    });
    console.groupEnd();
  }

  /**
   * Log un diagnostic d'API
   */
  logApiDiagnostic(testName: string, result: any): void {
    console.group(`🔍 API Diagnostic: ${testName}`);
    console.log('Result:', result);
    console.groupEnd();
  }
}
