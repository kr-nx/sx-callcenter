import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';

import { Store } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { CartState } from './cart.reducer';
import * as CartActions from './cart.actions';
import * as fromRouter from '@ngrx/router-store';

import {
  mergeMap,
  filter,
  map,
  tap,
  switchMap,
  catchError,
  mergeAll
} from 'rxjs/operators';
import { Observable, of, noop, empty } from 'rxjs';

import {
  notNull,
  cartState,
  reactiveCartActions,
  newItem,
  envioState,
  pedidoState,
  decuentosState
} from './cart-operators';
import { ClienteUiService } from '@swrx/clientes';
import { PedidosFacade } from '@swrx/pedidos';

import { CartAddItemComponent } from '../cart-add-item/cart-add-item.component';
import { CartCheckoutComponent } from '../cart-checkout/cart-checkout.component';
import { EnvioComponent } from '../envio/envio.component';
import {
  InstruccionDeEnvio,
  Pedido,
  TipoDePedido,
  FormaDePago,
  PedidoDet
} from '@swrx/core-model';
import { CartNombreComponent } from '../cart-nombre/cart-nombre.component';
import { CartDescuentosComponent } from '../cart-form/cart-descuentos/cart-descuentos.component';
import { CerrarComponent } from '../cerrar/cerrar.component';
import { CartDescuentoeComponent } from '../cart-descuentoe/cart-descuentoe.component';
import { CartManiobraComponent } from '../cart-maniobra/cart-maniobra.component';
import { ClienteService } from '@swrx/clientes';
import { CartItem } from './cart.models';

import { ExistenciasService } from '@swrx/existencias';

@Injectable()
export class CartEffects {
  cambiarCliente$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.cambiarCliente),
      mergeMap(() => this.clienteUi.seleccionarCliente()),
      filter(cliente => !!cliente),
      map(cliente => CartActions.cambiarClienteSuccess({ cliente }))
    )
  );
  cambiarNombre$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.cambiarNombre),
      cartState(this.store),
      map(([action, state]) => ({ nombre: state.nombre })),
      this.inDialog(CartNombreComponent),
      filter(nombre => !!nombre),
      map(nombre => CartActions.cambiarNombreSuccess({ nombre }))
    )
  );

  addCartItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addCartItem),
      cartState(this.store),
      map(([action, state]) => ({
        item: action.item,
        tipo: state.tipo,
        producto: action.producto,
        sucursal: state.sucursal
      })),
      this.inDialog(CartAddItemComponent),
      notNull(),
      newItem,
      map(item => CartActions.addCartItemSuccess({ item }))
    )
  );

  editItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.editItem),
      cartState(this.store),
      map(([action, state]) => ({
        item: action.item,
        tipo: state.tipo,
        index: action.index,
        sucursal: state.sucursal
      })),
      this.inDialog(CartAddItemComponent),
      notNull(),
      map(item => CartActions.editItemSuccess({ item }))
    )
  );

  recalcular$ = createEffect(() =>
    this.actions$.pipe(
      reactiveCartActions,
      tap(action =>
        console.log('Recalcular partidas detonado por: ', action.type)
      ),
      map(() => CartActions.recalcularPartidas())
    )
  );

  validar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.recalcularPartidas),
      // tap(() => console.log('Detonando validación de pedido')),
      map(() => CartActions.validarPedido())
    )
  );

  startCheckout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.startCheckout),
      pedidoState(this.store),
      tap(state => console.log('Cheqckout with persisten state: ', state)),
      this.inDialog(CartCheckoutComponent),
      notNull(),
      map((data: any) =>
        this.pedidoFacade.createOrUpdatePedido({
          id: data.id,
          changes: data.changes
        })
      ),
      tap(res => console.log('SaveOrUpdate: ', res))
    )
  );

  envio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.registrarEnvio),
      envioState(this.store),
      this.inDialog(EnvioComponent),
      notNull(),
      map((envio: InstruccionDeEnvio) =>
        CartActions.registrarEnvioSuccess({ envio })
      )
    )
  );

  envioSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.registrarEnvioSuccess),
        map(action => action.envio),
        map(envio => {
          if (envio.sucursal) {
            return CartActions.cambiarSucursal({ sucursal: envio.sucursal });
          } else {
            return { type: 'NOOP_ACTION' };
          }
        })
      ),
    { dispatch: true }
  );

  loadPedidoSucces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadPedidoSucces),
      map(() => CartActions.validarPedido())
    )
  );

  asignarSocio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.asignarSocio),
      map(() => CartActions.validarPedido())
    )
  );

  mostrarDescuentos$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.mostrarDescuentos),
        decuentosState(this.store),
        filter(
          data =>
            data.tipo !== TipoDePedido.CREDITO ||
            data.formState.formaDePago === FormaDePago.CHEQUE_PSTF
        ),
        this.inDialog(CartDescuentosComponent)
        // filter(nombre => !!nombre)
      ),
    { dispatch: false }
  );

  iniciarCierre$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.iniciarCierreDePedido),
      map(action => {
        return { pedido: action.pedido };
      }),
      this.inDialog(CerrarComponent, '500px'),
      filter(pedido => !!pedido),
      tap(pedido => console.log('Mandando cerrar pedido: ', pedido)),
      map((pedido: Pedido) => this.pedidoFacade.cerrarPedido(pedido))
    )
  );

  maniobra$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.agregarManiobra),
        cartState(this.store),
        map(([action, state]) => state),
        this.inDialog(CartManiobraComponent, '350px'),
        notNull(),
        map((item: any) => {
          if (item.id) {
            // return CartActions.editItemSuccess({ item });
            return CartActions.addCartItemSuccess({ item });
          } else {
            console.log('Agregando item: ', item);
            return CartActions.addCartItemSuccess({ item });
          }
        })
      ),
    { dispatch: true }
  );

  descuentoEspecial$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.assignarDescuentoEspecial),
      pedidoState(this.store),
      map(state => {
        const descuento = state.changes.descuento;
        const descuentoEspecial = state.changes.descuentoEspecial;
        const descuentoOriginal = state.changes.descuentoOriginal;
        const tipo = state.changes.tipo;
        return { descuento, descuentoEspecial, descuentoOriginal, tipo };
      }),
      filter(state => state.tipo !== TipoDePedido.CREDITO),
      this.inDialog(CartDescuentoeComponent, '400px'),
      // tap(data => console.log('Desc: ', data)),
      filter(desc => desc >= 0),
      map((descuentoEspecial: number) =>
        CartActions.assignarDescuentoEspecialSuccess({ descuentoEspecial })
      )
    )
  );

  /*
  descuentoEspcialListener$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          CartActions.addCartItemSuccess,
          CartActions.deleteItem,
          CartActions.editItem
        ),
        tap(a => console.log('Recalcular partidas por accion: ', a.type)),
        map(() => CartActions.recalcularPartidas())
      ),
    { dispatch: false }
  );
  */

  refrescarCliente$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.refrescarCliente),
        pedidoState(this.store),
        map(state => state.changes.cliente),
        tap(cliente =>
          console.log('Actualizando datos del cliente: {}', cliente)
        ),
        switchMap(cliente =>
          this.clienteService.get(cliente.id).pipe(
            map(result =>
              CartActions.cambiarClienteSuccess({ cliente: result })
            ),
            catchError(error => of(CartActions.cambiarClienteError({ error })))
          )
        )

        // map(cliente => CartActions.cambiarClienteSuccess({ cliente }))
      ),
    { dispatch: true }
  );

  existenciaListener$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CartActions.editItemSuccess,
        CartActions.addCartItemSuccess,
        CartActions.iniciarCierreDePedido
      ),
      tap(action => console.log('Validando existencias por: ', action.type)),
      map(() => CartActions.validacionDeExistenciasInicio())
    )
  );

  validarExistencias$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.validacionDeExistenciasInicio),
      pedidoState(this.store),
      switchMap(state => {
        const { partidas, sucursal } = state.changes;
        return this.existenciaService
          .actualizarFaltantes(partidas, sucursal)
          .pipe(
            map(data =>
              CartActions.validacionDeExistenciasFin({ partidas: data })
            ),
            catchError(error =>
              of(CartActions.validacionDeExistenciasFail({ error }))
            )
          );
      })
      // tap(data => console.log('Existencia actualizada: ', data))
    )
  );

  /*
  validarExistenciaFin$ = createEffect(() => this.actions$.pipe(
    ofType(CartActions.validacionDeExistenciasFin),

  ))
  */

  constructor(
    private actions$: Actions,
    private dialog: MatDialog,
    private clienteUi: ClienteUiService,
    private store: Store<CartState>,
    private pedidoFacade: PedidosFacade, //,
    private clienteService: ClienteService,
    private existenciaService: ExistenciasService
  ) {}

  private inDialog(component: any, width = '750px') {
    return mergeMap(data => this.openDialog(component, data, width));
  }

  private openDialog(
    component: any,
    data: any,
    width = '750px'
  ): Observable<any> {
    return this.dialog
      .open(component, {
        data,
        width
      })
      .afterClosed();
  }
}
