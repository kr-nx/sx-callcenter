import { NgModule } from '@angular/core';
import { RouterModule, Route } from '@angular/router';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import * as fromCart from './+state/cart.reducer';
import { CartEffects } from './+state/cart.effects';

import { UiCoreModule } from '@swrx/ui-core';
import { ClientesModule } from '@swrx/clientes';
import { ProductosModule } from '@swrx/productos';
import { FormUtilsModule } from '@swrx/form-utils';

import { CartPageComponent } from './cart-page/cart-page.component';
import { CartBtnComponent } from './cart-btn/cart-btn.component';
import { CartToolbarComponent } from './cart-toolbar/cart-toolbar.component';

import { CartItemsComponent } from './cart-items/cart-items.component';
import { CartFooterComponent } from './cart-footer/cart-footer.component';
import { CartSummaryComponent } from './cart-summary/cart-summary.component';
import { CartInfoComponent } from './cart-info/cart-info.component';
import { CartFormModule } from './cart-form/cart-form.module';
import { CartFacade } from './+state/cart.facade';
import { CartAddItemComponent } from './cart-add-item/cart-add-item.component';
import { CartItemsTableComponent } from './cart-items/cart-items-table/cart-items-table.component';
import { CartListComponent } from './cart-items/cart-list/cart-list.component';
import { CartListItemComponent } from './cart-items/cart-list/cart-list-item/cart-list-item.component';
import { CartCheckoutComponent } from './cart-checkout/cart-checkout.component';

const routes: Route[] = [{ path: '', component: CartPageComponent }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    UiCoreModule,
    ClientesModule,
    ProductosModule,
    FormUtilsModule,
    StoreModule.forFeature(fromCart.CART_FEATURE_KEY, fromCart.reducer),
    EffectsModule.forFeature([CartEffects]),
    CartFormModule
  ],
  declarations: [
    CartPageComponent,
    CartBtnComponent,
    CartToolbarComponent,
    CartItemsComponent,
    CartFooterComponent,
    CartSummaryComponent,
    CartInfoComponent,
    CartAddItemComponent,
    CartItemsTableComponent,
    CartListComponent,
    CartListItemComponent,
    CartCheckoutComponent
  ],
  entryComponents: [CartAddItemComponent, CartCheckoutComponent],
  exports: [CartBtnComponent],
  providers: [CartFacade]
})
export class ShoppingCartModule {}
