import { Component, OnInit } from '@angular/core';
import { PaymenthubService } from 'app/payment-hub/paymenthub.service';

@Component({
  selector: 'mifosx-incoming-transaction-export',
  templateUrl: './incoming-transaction-export.component.html',
  styleUrls: ['./incoming-transaction-export.component.scss']
})
export class IncomingTransactionExportComponent implements OnInit {
  private readonly exportUrl = "/api/v1/transfers/export";
  private readonly fileNamePrefix = "TRANSFERS";

  constructor(private paymenthubService: PaymenthubService) { }

  ngOnInit(): void {
  }

  exportCSV(filterBy: any) {
    this.paymenthubService.exportCSV(filterBy, this.exportUrl, this.fileNamePrefix);
  }

}
