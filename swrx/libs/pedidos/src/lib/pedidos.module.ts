import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule, Route } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { UiCoreModule } from '@swrx/ui-core';

import { PedidosPageComponent } from './pedidos-page/pedidos-page.component';
import { PedidosTableComponent } from './pedidos-page/pedidos-table/pedidos-table.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import * as fromPedidos from './+state/pedidos.reducer';
import { PedidosEffects } from './+state/pedidos.effects';
import { PedidosFacade } from './+state/pedidos.facade';
import { AltPedidoComponent } from './alt-pedido/alt-pedido.component';
import { AutorizacionesPageComponent } from './autorizaciones-page/autorizaciones-page.component';

import { CfdiModule } from '@swrx/cfdi';
import { CerradosComponent } from './pedidos-page/cerrados/cerrados.component';
import { PedidoViewComponent } from './pedidos-page/pedido-view/pedido-view.component';
import { FacturadosComponent } from './pedidos-page/facturados/facturados.component';
import { FacturasTableComponent } from './facturas-table/facturas-table.component';

export const routes: Route[] = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: PedidosPageComponent },
      {
        path: 'view/:id',
        component: PedidoViewComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    PedidosPageComponent,
    PedidosTableComponent,
    AltPedidoComponent,
    AutorizacionesPageComponent,
    CerradosComponent,
    FacturadosComponent,
    PedidoViewComponent,
    FacturasTableComponent
  ],
  entryComponents: [AltPedidoComponent],
  imports: [
    UiCoreModule,
    MatTableModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature(
      fromPedidos.PEDIDOS_FEATURE_KEY,
      fromPedidos.reducer
    ),
    EffectsModule.forFeature([PedidosEffects]),
    CfdiModule
  ],
  providers: [PedidosFacade]
})
export class PedidosModule {
  /*
  static forRoot(): ModuleWithProviders {
    return { ngModule: PedidosStateModule, providers: [] };
  }
  */
}
/*
@NgModule({
  declarations: [PedidosPageComponent, PedidosTableComponent],
  imports: [
    UiCoreModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature(
      fromPedidos.PEDIDOS_FEATURE_KEY,
      fromPedidos.reducer
    ),
    EffectsModule.forFeature([PedidosEffects])
  ],
  providers: [PedidosFacade]
})
export class PedidosStateModule {}
*/
