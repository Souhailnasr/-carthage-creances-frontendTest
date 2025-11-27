import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HTTP_INTERCEPTORS, HttpEvent } from '@angular/common/http';
const TOKEN_HEADER_KEY = 'Authorization';
@Injectable(/*{
  providedIn: 'root'
}*/)
export class BasicAuthInterceptorService implements HttpInterceptor {
  constructor() {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let authReq = req;
   const token = JSON.parse(sessionStorage.getItem("auth-user"));
    if (token != null) {
      authReq = req.clone({
        headers: req.headers.set(TOKEN_HEADER_KEY, "Bearer "+token.token),
      });
    }

    return next.handle(authReq);
  }

  /*constructor(private token: TokenStorageService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    const token = JSON.parse(this.token.getToken());
    if (token != null) {
      authReq = req.clone({ headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token.token) });
    }
    return next.handle(authReq);
  }*/
}
export const authInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: BasicAuthInterceptorService, multi: true }
];
 
