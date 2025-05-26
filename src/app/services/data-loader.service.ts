import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {
  constructor(private http: HttpClient) {}

  getAirlines(): Observable<any[]> {
    return this.http.get<any[]>('assets/data/filtered_airlines.json');
  }

  getAirports(): Observable<any[]> {
    return this.http.get<any[]>('assets/data/filtered_airports.json');
  }
}