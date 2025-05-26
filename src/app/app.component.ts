import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { DataLoaderService } from './services/data-loader.service';
import * as JsBarcode from 'jsbarcode';

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

  showPreview: boolean = false

  constructor(private dataLoader: DataLoaderService) {
    this.labelForm = new FormGroup({
      airline: new FormControl('', [ Validators.required]),
      origin: new FormControl('', [ Validators.required]),
      destination: new FormControl('', [ Validators.required]),
      numPieces: new FormControl('', [ Validators.required]),
      totalWeight: new FormControl('', [ Validators.required]),
      transit1: new FormControl(''),
      transit2: new FormControl(''),
      additionalInfo: new FormControl(''),
      specialInstructions: new FormControl(''),
      awbSuffix: new FormControl('', [ Validators.required]),
      email: new FormControl('test@test.com'),
      website: new FormControl('www.test.com'),
      //includeBarcode: new FormControl('', [ Validators.required]),
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

  generateAWB(): string {
    const prefix = '000';
    const suffix = this.labelForm.value.awbSuffix || '0000000';
    return `${prefix}-${suffix}`;
  }

  showLabelPreview(): void {
    this.showPreview = true;

    // Wait for Angular to render the preview DOM
    setTimeout(() => {
      this.generateBarcode();  // Now the element exists
    }, 0);
  }

  generateBarcode(): void {
    const awb = this.generateAWB();
    const barcodeElement = document.querySelector("#barcode");

    if (barcodeElement) {
      JsBarcode(barcodeElement, awb, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 50
      });
    } else {
      console.warn("Barcode element not found");
    }
  }

}
