import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { DataLoaderService } from './services/data-loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'awb';

  public labelForm: FormGroup;

  airlines: any[] = [];
  filteredAirlines$: Observable<any[]>;

  airports: any[] = [];
  filteredOrigins$: Observable<any[]>;
  filteredDestinations$: Observable<any[]>;
  filteredTransit1$: Observable<any[]>;
  filteredTransit2$: Observable<any[]>;

  constructor(private dataLoader: DataLoaderService) {
    this.labelForm = new FormGroup({
      airline: new FormControl('', [ Validators.required]),
      origin: new FormControl('', [ Validators.required]),
      destination: new FormControl('', [ Validators.required]),
      numPieces: new FormControl('', [ Validators.required]),
      totalWeight: new FormControl('', [ Validators.required]),
      transit1: new FormControl('', [ Validators.required]),
      transit2: new FormControl('', [ Validators.required]),
      additionalInfo: new FormControl('', [ Validators.required]),
      specialInstructions: new FormControl('', [ Validators.required]),
      awbSuffix: new FormControl('', [ Validators.required]),
      email: new FormControl('test@test.com', [ Validators.required]),
      website: new FormControl('www.test.com', [ Validators.required]),
      includeBarcode: new FormControl('', [ Validators.required]),
    });
    
  }

  ngOnInit() {
    this.dataLoader.getAirlines().subscribe(data => this.airlines = data);
    this.dataLoader.getAirports().subscribe(data => this.airports = data);
    this.filteredAirlines$ = this.labelForm.get('airline')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAirlines(value || ''))
    );
    this.filteredOrigins$ = this._setupAirportFilter('origin');
    this.filteredDestinations$ = this._setupAirportFilter('destination');
    this.filteredTransit1$ = this._setupAirportFilter('transit1');
    this.filteredTransit2$ = this._setupAirportFilter('transit2');
  }

  // Autocomplete filters
  _filterAirlines(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.airlines.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  private _filterAirports(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.airports.filter(option =>
      `${option.city} ${option.name} ${option.iata}`.toLowerCase().includes(filterValue)
    );
  }

  private _setupAirportFilter(controlName: string): Observable<any[]> {
    return this.labelForm.get(controlName)!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAirports(value || ''))
    );
  }
}
