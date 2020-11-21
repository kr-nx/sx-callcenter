import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BehaviorSubject, Observable } from 'rxjs';
import { startWith, map, tap } from 'rxjs/operators';

import { BaseComponent } from '@shared/common';
import { getFormValidationErrors } from '@utils';

@Component({
  selector: 'sxcc-pedido-validation',
  template: `
    <ng-container *ngIf="errors$ | async as errors">
      <ion-list class="ion-no-padding" *ngIf="visible$ | async">
        <ion-list-header>
          <ion-label>Errores</ion-label>
          <ion-button color="tertiary" (click)="close()">
            <ion-icon name="close"></ion-icon>
            Cerrar
          </ion-button>
        </ion-list-header>
        <ion-item *ngFor="let e of errors">
          <ion-label color="danger">
            {{ getDescripcion(e) }}
          </ion-label>
        </ion-item>
      </ion-list>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoValidationComponent extends BaseComponent implements OnInit {
  @Input() parent: FormGroup;
  visible$ = new BehaviorSubject<boolean>(true); // Required to use OnPush detection esasy
  errors$: Observable<string[]>;
  // envioErrors$: Observable<string[]>;

  constructor() {
    super();
  }

  ngOnInit() {
    this.errors$ = this.parent.statusChanges.pipe(
      startWith('VALID'),
      map(() => this.parent.errors || {}),
      map((errors) => Object.keys(errors)),
      map((errors) => [...errors, ...this.getEnvioErrores()]),
      tap((errors) => this.visible$.next(errors.length > 0))
    );

    // this.envioErrors$ = this.parent.get('envio').statusChanges.pipe(
    //   startWith('VALID'),
    //   map(() => this.getEnvioErrores())
    // );
  }

  getEnvioErrores() {
    const eform = this.parent.get('envio') as FormGroup;
    const errors = getFormValidationErrors(eform);
    return errors.map((err) => `envio.${err.control}.${err.error}`);
  }

  setVisible() {
    this.visible$.next(true);
  }

  close() {
    this.visible$.next(false);
  }

  getDescripcion(key: string) {
    switch (key) {
      case 'importeMaximo':
        return 'Importe máximo en ventas de contado es $100,000.00';
      case 'importeMinimo':
        return 'Importe mínimo para facturación: $10.00';
      case 'formaDePagoInvalidaEnCod':
        return 'En COD sólo se permite:  CHEQUE o EFECTIVO o TARJETA';
      case 'postFechadoRequerido':
        return 'Cliente requiere  cheque post fechado';
      case 'chequeNoPermitido':
        return 'Cliente no autorizado a recibir Cheque';
      case 'postFechadoNoPermitido':
        return 'Cheque PSF solo es válido en Crédito';
      case 'enJuridico':
        return 'Cliente en trámite jurídico';
      case 'chequesDevueltos':
        return 'Cliente con cheque devuelto';
      case 'socioRequerido':
        return 'Socio de la union requerido';
      case 'envioRequerido':
        return 'Debe configurar el envio en COD';
      default:
        return key;
    }
  }
}