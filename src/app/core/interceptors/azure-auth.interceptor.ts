import { HttpInterceptorFn } from '@angular/common/http';

export const azureAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const azureApiKey = 'your-azure-api-key';
  
  // Check if this is an Azure API request
  if (req.url.includes('cognitiveservices.azure.com')) {
    // Clone the request and add Azure authentication headers
    const azureReq = req.clone({
      setHeaders: {
        'Ocp-Apim-Subscription-Key': azureApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return next(azureReq);
  }

  // For non-Azure requests, proceed without modification
  return next(req);
};