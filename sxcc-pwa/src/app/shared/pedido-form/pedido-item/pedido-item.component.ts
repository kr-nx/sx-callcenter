import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { PedidoDet, TipoDePedido } from '@models';

@Component({
  selector: 'sxcc-pedido-item',
  templateUrl: './pedido-item.component.html',
  styleUrls: ['./pedido-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoItemComponent implements OnInit {
  @Input() item: PedidoDet;
  @Input() index = 0;
  @Input() odd = false;
  @Input() tipo: TipoDePedido;
  @Input() contadoColor = 'primary';
  @Input() creditoColor = 'secondary';
  constructor() {}

  ngOnInit() {
    console.log('Tipo: ', this.tipo);
    console.log('Precio color: ', this.getPrecioColor());
  }

  get precioCredito() {
    return this.item.producto.precioCredito;
  }
  get precioContado() {
    return this.item.producto.precioContado;
  }

  isCredito() {
    return this.tipo === TipoDePedido.CREDITO;
  }

  getPrecioColor() {
    return this.isCredito() ? 'secondary' : 'primary';
  }
}