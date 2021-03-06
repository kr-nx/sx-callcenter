import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'swrx-rechazar-item',
  templateUrl: './rechazar-item.component.html',
  styleUrls: ['./rechazar-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RechazarItemComponent implements OnInit {
  motivos = [
    'CHECAR DATOS',
    'CHEQUAR BANCO',
    'CHECAR IMPORTE',
    'NO ESTA EN BANCO',
    'PROBLEMA CON EL BANCO'
  ];
  control = new FormControl();
  comentario = new FormControl();
  transaccion: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<RechazarItemComponent>
  ) {
    this.transaccion = data.transaccion;
  }

  ngOnInit() {}

  submit() {
    if (this.control.value) {
      const rechazo = {
        user: 'admin',
        motivo: this.control.value,
        fecha: new Date().toISOString(),
        comentario: this.comentario.value || ''
      };

      this.dialogRef.close(rechazo);
    }
  }
}
