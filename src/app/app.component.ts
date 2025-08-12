import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { DataLoaderService } from './services/data-loader.service';
import * as JsBarcode from 'jsbarcode';
import ZebraBrowserPrintWrapper from 'zebra-browser-print-wrapper-https';
import jsPDF from 'jspdf';

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
    const paddedPrefix = selectedAirline.awb.toString().padStart(3, '0');
    this.labelForm.patchValue({ awbPrefix: paddedPrefix });
  } else {
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

    const data = this.labelForm.value
    console.log(data)
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
  
      if(this.labelForm.value.hawb != '') {
        JsBarcode("#hawbBarcode", this.labelForm.value.hawb, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 50
        });
      }
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

  async generatePDF() {
    const f = this.labelForm.value;
    console.log(f)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [101.6, 127] // 4x5 inch
    });

    const awb = this.generateAWB(); // keep one consistent AWB per PDF
    const awbBarcode = this.generateBarcodeBase64(awb);
    const hawbBarcode = this.generateBarcodeBase64(f.hawb || '0000');

    // Helper to convert base64 to Image and wait for load
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    };

    try {
      const [awbImg, hawbImg] = await Promise.all([loadImage(awbBarcode), loadImage(hawbBarcode)]);

      for (let i = 1; i <= f.numPieces; i++) {
        if (i > 1) doc.addPage();

        doc.roundedRect(2.5, 2.5, 97, 122, 0, 0);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        centerText(doc, 'Airline', 6, 8); 
        doc.setFont('Helvetica', 'bold');
        centerText(doc, f.airline, 10, 10);
        doc.setFont('Helvetica', 'normal');

        // Barcode section
        doc.roundedRect(2.5, 12.5, 97, 21.5, 0, 0);
        const scale1 = 20 / awbImg.height;
        const scaledWidth1 = awbImg.width * scale1;
        const centerX1 = (doc.internal.pageSize.getWidth() - scaledWidth1) / 2;
        doc.addImage(awbImg, 'PNG', centerX1, 13, scaledWidth1, 20);

        centerText(doc, 'Air Waybill No.', 38, 8);
        doc.setFont('Helvetica', 'bold');
        centerText(doc, awb, 42, 10);
        doc.setFont('Helvetica', 'normal');

        // Data grid
        const startX = 2.5;
        const startY = 45;
        const cellWidth = 48.5;
        const cellHeight = 10;
        const dataGrid = [
          ['Destination', f.destination],
          ['Total No. of Pieces', String(f.numPieces)],
          ['Weight of Consignment', `${f.totalWeight}K`],
          ['Origin', f.origin],
          ['Via(1)', f.transit1],
          ['Via(2)', f.transit2]
        ];

        for (let j = 0; j < dataGrid.length; j++) {
          const col = j % 2;
          const row = Math.floor(j / 2);
          const x = startX + col * (cellWidth);
          const y = startY + row * cellHeight;

          doc.rect(x, y, cellWidth, cellHeight);
          doc.setFontSize(8);
          centerText(doc, dataGrid[j][0], y + 4, 8, x, cellWidth);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          centerText(doc, dataGrid[j][1], y + 8, 10, x, cellWidth);
          doc.setFont('helvetica', 'normal');
        }

        // Additional Info
        doc.roundedRect(2.5, 75, 97, 10, 0, 0);
        centerText(doc, 'Additional Information', 79, 8);
        doc.setFont('Helvetica', 'bold');
        centerText(doc, `${f.additionalInfo} ${f.specialInstructions}`, 83, 10);

        // Piece number
        doc.roundedRect(2.5, 85, 97, 10, 0, 0);
        doc.setFont('Helvetica', 'normal');
        centerText(doc, 'Piece No.', 89, 8);
        doc.setFont('Helvetica', 'bold');
        centerText(doc, `${i}/${f.numPieces}`, 93, 10);

        // HAWB
        doc.roundedRect(2.5, 95, 97, 23, 0, 0);
        doc.setFont('Helvetica', 'bold');
        centerText(doc, `HAWB No. ${f.hawb}`, 99, 10);

        if(f.hawb != '') {
          const scale2 = 17.5 / hawbImg.height;
          const scaledWidth2 = hawbImg.width * scale2;
          const centerX2 = (doc.internal.pageSize.getWidth() - scaledWidth2) / 2;
          doc.addImage(hawbImg, 'PNG', centerX2, 100, scaledWidth2, 17.5);
        } 
        
        // Footer
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        centerText(doc, `Email: ${f.email} | Website: ${f.website}`, 122.5, 8);
      }

      doc.save(`label_${awb}.pdf`);
    } catch (err) {
      console.error('Image loading failed:', err);
    }

    //  Updated centerText helper to optionally align inside boxes
    function centerText(doc: jsPDF, text: string, y: number, fontSize: number, xStart?: number, boxWidth?: number) {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = xStart != null && boxWidth != null
        ? xStart + (boxWidth - textWidth) / 2
        : (doc.internal.pageSize.getWidth() - textWidth) / 2;
      doc.text(text, x, y);
    }
  }


  generateBarcodeBase64(data: string): string {
    const value = data && data.trim() !== '' ? data : '0000'; // default safe value
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, { format: "CODE128" });
    return canvas.toDataURL("image/png");
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

  clearForm() {
    this.labelForm.reset({
      airline: '',
      origin: '',
      destination: '',
      numPieces: '',
      totalWeight: '',
      transit1: '',
      transit2: '',
      additionalInfo: '',
      specialInstructions: '',
      awbPrefix: '',
      awbSuffix: '',
      hawb: '',
      email: 'test@test.com',
      website: 'www.test.com'
      // includeBarcode: ''
    });

    this.showPreview = false;
    this.zplGenerated = false;
    this.zplData = '';
  }


}
