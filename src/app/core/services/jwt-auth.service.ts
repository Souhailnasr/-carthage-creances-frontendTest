import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User } from '../../shared/models';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class JwtAuthService {
  private baseUrl = 'http://localhost:8089/carthage-creance';

  constructor(private http: HttpClient) {
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/auth/authenticate`,
      {
        email,
        password,
      },
      httpOptions
    );
  }

  getDecodedAccessToken(token: string | null): any {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
}


  isUserLoggedIn() {
    let user = sessionStorage.getItem("auth-user");
    console.log("------>", user);
    return !(user === null);
  }

  loggedUserAuthority() {
  if (this.isUserLoggedIn()) {
    const token = sessionStorage.getItem("auth-user");
    if (!token) return null; // 🔒 handle the null case
    const decoded = this.getDecodedAccessToken(token);
    return decoded?.roles?.[0]?.authority || decoded?.role?.[0]?.authority || null;
  }
  return null;
}

getCurrentUser(): Observable<User> {
    const token = sessionStorage.getItem("auth-user");
    const currentUser = this.getDecodedAccessToken(token);
    return this.http.get<User>(`${this.baseUrl}/api/users/email/${currentUser?.sub}`);
}

  logOut() {
    sessionStorage.removeItem("email");
  }

}
