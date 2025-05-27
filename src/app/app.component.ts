import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { DataLoaderService } from './services/data-loader.service';
import * as JsBarcode from 'jsbarcode';
import ZebraBrowserPrintWrapper from 'zebra-browser-print-wrapper-https';

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

  zplGenerated: boolean = false;
  zplData: string = '';

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
      awbPrefix: new FormControl(''),
      awbSuffix: new FormControl('', [ Validators.required]),
      hawb: new FormControl(''),
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
    return this.airlines.filter(option => option.airline.toLowerCase().includes(filterValue));
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

getPrefix(selectedAirlineName: string): void {
  const selectedAirline = this.airlines.find(a => a.airline === selectedAirlineName);
  if (selectedAirline && selectedAirline.awb) {
    this.labelForm.patchValue({ awbPrefix: selectedAirline.awb });
  } else {
    // Optional: clear the prefix if not found
    this.labelForm.patchValue({ awbPrefix: '' });
  }
}
  generateAWB(): string {
    const prefix = this.labelForm.value.awbPrefix || '000';
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
    setTimeout(() => {
      JsBarcode("#barcode", this.generateAWB(), {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 50
      });
  
      JsBarcode("#hawbBarcode", this.labelForm.value.hawb, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 50
      });
    }, 0);
  }

  printLabel() {
    this.zplData = this.generateZPL();
    this.zplGenerated = true;
    console.log(this.zplData); // Optional
  }


  generateZPL(): string {
    const awb = this.generateAWB();
    const airline = this.labelForm.value.airline;
    const dest = this.labelForm.value.destination;
    const pcs = this.labelForm.value.numPieces;
    const weight = this.labelForm.value.totalWeight;
    const origin = this.labelForm.value.origin;
    const transit1 = this.labelForm.value.transit1;
    const transit2 = this.labelForm.value.transit2;
    const info = this.labelForm.value.additionalInfo + this.labelForm.value.specialInstructions;
    const hawb = this.labelForm.value.hawb;
    return `
^XA
^PW812
^LL1016
^FO50,30^A0N,40,40^FD${airline}^FS
^FO50,80^BY2^BCN,100,Y,N,N^FD${awb}^FS
^FO50,200^A0N,30,30^FDAWB No:^FS
^FO250,200^A0N,35,35^FD${awb}^FS
^FO50,250^A0N,25,25^FDDestination:^FS
^FO250,250^A0N,25,25^FD${dest}^FS
^FO50,280^A0N,25,25^FDPieces:^FS
^FO250,280^A0N,25,25^FD${pcs}^FS
^FO50,310^A0N,25,25^FDWeight:^FS
^FO250,310^A0N,25,25^FD${weight}K^FS
^FO50,340^A0N,25,25^FDOrigin:^FS
^FO250,340^A0N,25,25^FD${origin}^FS
^FO50,370^A0N,25,25^FDVia(1):^FS
^FO250,370^A0N,25,25^FD${transit1}^FS
^FO50,400^A0N,25,25^FDVia(2):^FS
^FO250,400^A0N,25,25^FD${transit2}^FS
^FO50,430^A0N,25,25^FDInfo:^FS
^FO50,460^A0N,25,25^FD${info}^FS
^FO50,500^A0N,25,25^FDPiece No:^FS
^FO250,500^A0N,25,25^FD1/${pcs}^FS
^FO50,530^A0N,25,25^FDHAWB No:^FS
^FO250,530^A0N,25,25^FD${hawb}^FS
^FO50,570^BY2^BCN,100,Y,N,N^FD${hawb}^FS
^FO50,690^A0N,20,20^FDEmail: ${this.labelForm.value.email} Website: ${this.labelForm.value.website}^FS
^XZ
  `.trim();
}

  downloadZPL() {
    const blob = new Blob([this.zplData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'label.zpl';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  sendToPrinter() {
    let savedIP = localStorage.getItem('printerIP');

    if (savedIP) {
      const useSaved = confirm(`Use saved printer IP: ${savedIP}? Click "Cancel" to enter a new one.`);
      if (!useSaved) {
        const newIP = prompt("Enter new printer IP (e.g., 192.168.1.50):");
        if (!newIP) return;
        savedIP = newIP;
        localStorage.setItem('printerIP', savedIP);
      }
    } else {
      const newIP = prompt("Enter printer IP (e.g., 192.168.1.50):");
      if (!newIP) return;
      savedIP = newIP;
      localStorage.setItem('printerIP', savedIP);
    }

    // Now we send to the printer
    fetch(`http://${savedIP}:9100`, {
      method: 'POST',
      body: this.zplData,
      mode: 'no-cors',
    })
    .then(() => alert('ZPL sent to printer!'))
    .catch(err => console.error('Error printing:', err));
  }


  /*copyZPL() {
    navigator.clipboard.writeText(this.zplData).then(() => {
      alert('ZPL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }*/

  async printZPL(){
    try {
      const browserPrint = new ZebraBrowserPrintWrapper();
      const defaultPrinter = await browserPrint.getDefaultPrinter();
      browserPrint.setPrinter(defaultPrinter);

      const printerStatus = await browserPrint.checkPrinterStatus();
      if (printerStatus.isReadyToPrint) {
        const zpl = this.generateZPL(); // your own ZPL generating function
        browserPrint.print(zpl);
        console.log('Print success!');
      } else {
        console.warn('Printer not ready:', printerStatus.errors);
      }
    } catch (err) {
      console.error('Print error:', err);
    }
  }


}
