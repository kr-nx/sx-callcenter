import { NgModule } from '@angular/core';
import { RouterModule, Route, PreloadAllModules } from '@angular/router';

import { HomeComponent } from './home/home.component';

import {
  canActivate,
  redirectUnauthorizedTo,
  AngularFireAuthGuardModule
} from '@angular/fire/auth-guard';

import { MainPageComponent } from './main-page/main-page.component';
import { MainPageModule } from './main-page/main-page.module';

import { AuthModule, ProfileComponent } from '@swrx/auth';

const redirectToLogin = () => redirectUnauthorizedTo(['loginx']);

const routes: Route[] = [
  {
    path: '',
    component: MainPageComponent,
    ...canActivate(redirectToLogin()),
    children: [
      {
        path: 'inicio',
        component: HomeComponent
      },
      {
        path: 'pedidos',
        loadChildren: () => import('@swrx/pedidos').then(m => m.PedidosModule)
      },
      {
        path: 'depositos',
        loadChildren: () =>
          import('@swrx/depositos').then(m => m.DepositosModule)
      },
      {
        path: 'cart',
        loadChildren: () =>
          import('@swrx/shopping-cart').then(m => m.ShoppingCartModule)
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [
    MainPageModule,
    RouterModule.forRoot(routes, {
      // initialNavigation: 'enabled',
      preloadingStrategy: PreloadAllModules
    }),
    AngularFireAuthGuardModule,
    AuthModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
