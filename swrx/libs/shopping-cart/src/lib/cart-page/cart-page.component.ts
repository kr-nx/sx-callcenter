import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  HostListener
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Observable, Subject } from 'rxjs';
import { takeUntil, take, tap } from 'rxjs/operators';

import { CartFacade } from '../+state/cart.facade';
import { ClientesFacade } from '@swrx/clientes';
import { ProductosUiService } from '@swrx/productos';
import { CartSumary } from '../+state/cart.models';
import {
  TipoDePedido,
  FormaDePago,
  Pedido,
  Cliente,
  Socio
} from '@swrx/core-model';

import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'swrx-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartPageComponent implements OnInit, OnDestroy {
  cartForm: FormGroup;
  sumary$: Observable<CartSumary> = this.facade.sumary$;
  destroy$ = new Subject<boolean>();
  pedido$: Observable<Pedido>;
  pedido: Pedido;
  user: any;

  constructor(
    private fb: FormBuilder,
    public facade: CartFacade,
    private clientes: ClientesFacade,
    private firebaseAuth: AngularFireAuth,
    private productoServie: ProductosUiService
  ) {}

  ngOnInit() {
    this.buildForm();
    console.log('Form value BEFORE: ', this.cartForm.value);
    this.registerStateForm();
    console.log('Form value AFTER: ', this.cartForm.value);
    this.addListeners();
    this.firebaseAuth.user.pipe(takeUntil(this.destroy$)).subscribe(usr => {
      const { displayName, email } = usr;
      this.user = { displayName, email };
    });
  }

  private buildForm() {
    this.cartForm = this.fb.group(
      {
        nombre: [null, [Validators.required]],
        sucursal: [null, [Validators.required]],
        tipo: [TipoDePedido.CONTADO, [Validators.required]],
        formaDePago: [null, [Validators.required]],
        usoDeCfdi: [null, [Validators.required]],
        cfdiMail: [null, [Validators.email]],
        comprador: [null],
        comentario: [null]
      },
      { updateOn: 'blur' }
    );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private registerStateForm() {
    this.facade.cartStateForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(formState => {
        const newState = { ...formState, comprador: null };
        this.cartForm.patchValue(newState, { emitEvent: false });
      });

    this.facade.sucursal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sucursal =>
        this.cartForm.patchValue({ sucursal }, { emitEvent: false })
      );
  }

  private addListeners() {
    this.addFormaDePagoListener();
    this.addTipoDePedidoListener();
    this.addUsoDeCfdiListener();
    this.addCfdiMailListener();
    this.addSucursallListener();
    this.addClienteListener();
    this.addCompradorListener();
    this.addComemtarioListener();
    this.facade.dirty$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cartForm.markAsDirty());
  }

  private addClienteListener() {
    this.facade.cliente$.pipe(takeUntil(this.destroy$)).subscribe(cte => {
      if (cte.credito) {
        if (cte.credito.postfechado) {
          this.cartForm.get('formaDePago').setValue(FormaDePago.CHEQUE_PSTF);
        } else {
          this.cartForm.get('formaDePago').setValue(FormaDePago.EFECTIVO);
        }

        if (!this.pedido) {
          this.cartForm
            .get('usoDeCfdi')
            .setValue(cte.credito.usoDeCfdi || 'G01');
        }
        //
        console.log('Cliente credito: ', cte);
        this.cartForm.get('tipo').setValue(TipoDePedido.CREDITO);
      }
      this.cartForm.get('cfdiMail').setValue(cte.cfdiMail);
    });
  }

  private addFormaDePagoListener() {
    this.cartForm
      .get('formaDePago')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(formaDePago => {
        this.facade.cambiarFormaDePago(formaDePago);
        if (formaDePago === FormaDePago.CHEQUE_PSTF) {
          this.cartForm.get('tipo').setValue(TipoDePedido.CREDITO);
          // this.cartForm.get('tipo').disable();
        } else {
          // this.cartForm.get('tipo').enable();
        }
      });
  }

  private addTipoDePedidoListener() {
    this.cartForm
      .get('tipo')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(tipo => {
        this.facade.cambiarTipo(tipo);
        if (tipo !== TipoDePedido.CREDITO) {
          const fp = this.cartForm.get('formaDePago').value;
          if (
            fp === FormaDePago.CHEQUE_PSTF ||
            fp === FormaDePago.CHEQUE_PSTF
          ) {
            this.cartForm.get('formaDePago').setValue(FormaDePago.EFECTIVO);
          }
        }
      });
  }

  private addUsoDeCfdiListener() {
    this.cartForm
      .get('usoDeCfdi')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(clave => this.facade.cambiarUso(clave));
  }

  private addCfdiMailListener() {
    this.cartForm
      .get('cfdiMail')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(email => this.facade.cambiarMail(email));
  }

  private addSucursallListener() {
    this.cartForm
      .get('sucursal')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(sucursal => this.facade.cambiarSucursal(sucursal));
  }

  private addCompradorListener() {
    this.cartForm
      .get('comprador')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(comprador => this.facade.cambiarComprador(comprador));
  }

  private addComemtarioListener() {
    this.cartForm
      .get('comentario')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(comentario => this.facade.cambiarComentario(comentario));
  }

  addCartItem() {
    this.facade.addCartItem();
  }

  cambiarCliente() {
    this.facade.cambiarCliente();
  }

  onCheckout() {
    if (this.user) {
      this.facade.startCheckout(this.user);
    }
  }

  onCambiarNombre(cliente: Partial<Cliente>) {
    if (cliente.rfc === 'XAXX010101000') {
      this.facade.cambiarNombre();
    }
  }

  showDescuentos() {
    this.facade.mostrarDescuentos();
  }

  goToNewCart() {
    this.facade.cleanShoppingCartState();
  }

  isDisabled(pedido: Partial<Pedido>, hasErrors: boolean) {
    if (pedido && pedido.status === 'CERRADO') {
      return true;
    } else if (hasErrors) {
      return true;
    } else {
      return this.cartForm.invalid || this.cartForm.pristine;
    }
  }

  clienteNuevo() {
    if (this.user) {
      this.clientes.createCliente(this.user);
    }
  }
  onSocio(event: Socio) {
    this.facade.asignarSocio(event);
  }
  onDescuentoEspecial() {
    this.facade.asignarDescuentoEspecial();
  }

  cancelar() {
    this.facade.cancelarMantenimiento();
  }

  /** Insert item */
  @HostListener('document:keydown.meta.i', ['$event'])
  onHotKeyInsert(event) {
    this.addCartItem();
  }
  @HostListener('document:keydown.insert', ['$event'])
  onHotKeyInsert2(event) {
    this.addCartItem();
  }

  /** Show descuentos */
  @HostListener('document:keydown.control.d', ['$event'])
  onHotKeyShowDescuentos(event) {
    this.showDescuentos();
  }

  /** Show descuentos */
  @HostListener('document:keydown.control.a', ['$event'])
  onHotKeyAltaDeCliente(event) {
    this.clienteNuevo();
  }

  @HostListener('document:keydown.control.shift.s', ['$event'])
  onHotKeyCloseCart(event) {
    this.onCheckout();
  }

  @HostListener('document:keydown.f2', ['$event'])
  onHotKeyAltP(event) {
    this.productoServie
      .openSelector()
      .subscribe(prod => this.facade.addCartItem(prod));
  }
}
