import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import round from 'lodash/round';

@Component({
  selector: 'swrx-cart-add-item',
  templateUrl: './cart-add-item.component.html',
  styleUrls: ['./cart-add-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartAddItemComponent implements OnInit, OnDestroy {
  item: any;
  form: FormGroup;
  credito: boolean;
  destroy$ = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialoRef: MatDialogRef<CartAddItemComponent>,
    private fb: FormBuilder
  ) {
    this.credito = data.credito || false;
    this.buildForm();
  }

  ngOnInit() {
    this.addListeners();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private buildForm() {
    this.form = this.fb.group({
      producto: [null, Validators.required],
      cantidad: [0.0, Validators.required],
      precio: [0.0, Validators.required],
      importe: [0.0, Validators.required],
      descuento: [0.0, [Validators.required]],
      descuentoTasa: [0.0, [Validators.required]],
      subtotal: [0.0, [Validators.required]],
      impuesto: [0.0, [Validators.required]],
      total: [0.0, [Validators.required]]
    });
  }

  private addListeners() {
    this.addProductoListener();
    this.addCantidadListener();
  }

  private addProductoListener() {
    this.form
      .get('producto')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(prod => {
        console.log('Producto: ', prod);
        if (this.credito) {
          this.form.get('precio').setValue(prod.precioCredito);
        } else {
          this.form.get('precio').setValue(prod.precioContado);
        }
      });
  }
  private addCantidadListener() {
    this.form
      .get('cantidad')
      .valueChanges.pipe(
        map(can => {
          if (this.producto && this.producto.unidad === 'MIL') {
            return can / 1000;
          } else {
            return can;
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(cantidad => this.actualizarTotal(cantidad));
  }

  private actualizarTotal(cantidad) {
    const precio = this.precio;
    const bruto = cantidad * precio;
    const importe = round(bruto, 2);
    const descuentoTasa = this.descuento || 0.0;
    const descuento = this.descuento;
    const subtotal = importe - descuento;
    const impuesto = round(subtotal * 0.16, 2);
    const total = subtotal + impuesto;
    this.form.get('importe').setValue(importe);
    this.form.get('descuento').setValue(descuento);
    this.form.get('descuentoTasa').setValue(descuentoTasa);
    this.form.get('subtotal').setValue(subtotal);
    this.form.get('impuesto').setValue(impuesto);
    this.form.get('total').setValue(total);
  }

  onSubmit() {
    if (this.form.valid) {
      const producto = this.producto;
      const { clave, descripcion, kilos, gramos, unidad } = producto;
      const entity = {
        ...this.form.value,
        producto: { id: producto.id },
        clave,
        descripcion,
        kilos,
        gramos,
        unidad
      };
      this.dialoRef.close(entity);
    }
  }
  get producto() {
    return this.getValue('producto');
  }

  get precio() {
    return this.form.get('precio').value;
  }

  get importe() {
    return this.form.get('importe').value;
  }

  get descuento() {
    return this.getValue('descuento');
  }

  get subtotal() {
    return this.getValue('subtotal');
  }

  get total() {
    return this.getValue('total');
  }

  private getValue(prop: string) {
    return this.form.get(prop).value;
  }
}