import {
  PedidoDet,
  TipoDePedido,
  Pedido,
  Cliente,
  Producto,
  FormaDePago
} from '@swrx/core-model';

import { CartState } from './cart.reducer';
import { CartSumary, CartItem } from './cart.models';
import { generarCargoPorCorte } from './cart-cargos-utils';

import round from 'lodash/round';
import sumBy from 'lodash/sumBy';
import maxBy from 'lodash/maxBy';
import values from 'lodash/values';

export function clienteMostrador(): Partial<Cliente> {
  return {
    id: '402880fc5e4ec411015e4ecc5dfc0554',
    rfc: 'XAXX010101000',
    nombre: 'MOSTRADOR',
    permiteCheque: false,
    activo: true
  };
}

export const DESCUENTOS = [
  { descuento: 0.0, importe: 100.0 },
  { descuento: 8.0, importe: 1000.0 },
  { descuento: 10.0, importe: 5000.0 },
  { descuento: 12.0, importe: 12000.0 },
  { descuento: 14.0, importe: 21500.0 },
  { descuento: 15.0, importe: 46000.0 },
  { descuento: 16.0, importe: 82000.0 },
  { descuento: 17.0, importe: 150000.0 },
  { descuento: 18.0, importe: 30000000.0 }
];

export function calcularImporteBruto(partidas: CartItem[]): number {
  const items = normalize(partidas);
  const importe = sumBy(items, (i: CartItem) => {
    if (i.producto.modoVenta === 'B') {
      const { cantidad, precio } = i;
      const factor = i.unidad === 'MIL' ? 1000 : 1;
      const res = (cantidad * precio) / factor;
      return round(res, 2);
    } else {
      return 0.0;
    }
  });
  return importe;
}

export function findDescuentoPorVolumen(importe: number) {
  const mayores = DESCUENTOS.filter(item => item.importe >= importe);
  if (mayores.length > 0) {
    return mayores[0].descuento;
  } else {
    return 18.0;
  }
}
/**
 * Pure function para calcular el descuento del Pedido en funcion de las partidas, el tipo de venta
 * y el cliente
 *
 * @param items
 * @param tipo
 * @param cliente
 */
export function calcularDescuento(
  items: CartItem[],
  tipo: TipoDePedido,
  cliente: Partial<Cliente>
): number {
  switch (tipo) {
    case TipoDePedido.CREDITO: {
      if (cliente.credito && cliente.credito.postfechado) {
        const importe = calcularImporteBruto(items);
        return findDescuentoPorVolumen(importe) - 4;
      } else {
        return cliente.credito ? cliente.credito.descuentoFijo || 0.0 : 0.0;
      }
    }
    case TipoDePedido.INE:
    case TipoDePedido.CONTADO:
    case TipoDePedido.COD: {
      const importe = calcularImporteBruto(items);
      return findDescuentoPorVolumen(importe);
    }
    default: {
      console.log('Tipo de venta no califica para descuento tipo: ', tipo);
      return 0;
    }
  }
}

/**
 * Pure function para recalcular las  partidas del pedido y registrar los cargos
 * correspondientes. Esto en funcion del estado actual (CartState)
 *
 * @param state
 */
export function recalcularPartidas(state: CartState): Partial<PedidoDet>[] {
  const partidas = values(state.items);
  const partidasActualizadas = aplicarDescuentos(
    partidas,
    state.tipo,
    state.formaDePago,
    state.cliente,
    state.descuentoEspecial
  );

  const corteItem = generarCargoPorCorte(partidasActualizadas);
  if (corteItem) {
    partidasActualizadas.push(corteItem);
  }
  return partidasActualizadas;
}

/**
 * Pure function para aplica el descuento a las partidas del ShoppingCart
 *
 * @param partidas
 * @param tipo
 * @param cliente
 */
export function aplicarDescuentos(
  partidas: CartItem[],
  tipo: TipoDePedido,
  fpago: FormaDePago,
  cliente: Partial<Cliente>,
  descuentoEspecial: number
): CartItem[] {
  // const items = normalize(partidas);
  const items = filtrarPartidasAutomaticas(partidas);
  let descuento = calcularDescuento(items, tipo, cliente);
  let descuentoOriginal = descuento;

  if (fpago === FormaDePago.TARJETA_CRE) {
    descuento = descuento - 2;
  } else if (fpago === FormaDePago.TARJETA_DEB) {
    descuento = descuento - 1;
  }
  /*
  if (descuentoEspecial > 0) {
    if (
      tipo === TipoDePedido.CONTADO ||
      tipo === TipoDePedido.COD ||
      tipo === TipoDePedido.INE
    ) {
      descuento = descuentoEspecial;
    }
  }
  */
  if (descuentoEspecial > 0) {
    descuento = descuentoEspecial;
  }

  const res: CartItem[] = [];
  items.map(item => {
    let rdesc: number;
    if (tipo === TipoDePedido.CREDITO) {
      rdesc = descuento;
    } else {
      if (item.modoVenta === 'B') {
        rdesc = descuento;
        descuentoOriginal = descuento;
        descuentoEspecial = 0;
      } else {
        rdesc = 0;
        descuentoOriginal = 0;
        descuentoEspecial = 0;
      }
      // rdesc = item.modoVenta === 'B' ? descuento : 0;
    }
    const det: PedidoDet = recalculaPartida(item, tipo, rdesc);
    det.descuentoOriginal = rdesc;
    det.descuentoEspecial = descuentoEspecial > 0 ? descuentoEspecial : 0;

    res.push(recalculaPartida(item, tipo, rdesc));
  });
  return res;
}

export function recalculaPartida(
  item: PedidoDet,
  tipo: TipoDePedido,
  descuento: number
): PedidoDet {
  const { cantidad } = item;
  const { precioCredito, precioContado } = item.producto;
  const precio = tipo === TipoDePedido.CREDITO ? precioCredito : precioContado;
  const factor = item.unidad === 'MIL' ? 1000 : 1;
  let importe = (cantidad * precio) / factor;
  importe = round(importe, 2);
  const descuentoImporte = round(importe * (descuento / 100), 2);
  const subtotal = importe - descuentoImporte;
  const impuesto = round(subtotal * 0.16, 2);
  const total = subtotal + impuesto;

  return {
    ...item,
    precio,
    precioLista: precio,
    importe,
    descuento,
    descuentoOriginal: descuento,
    descuentoImporte,
    subtotal,
    impuesto,
    total
  };
}

/**
 * Build an initial Pedido entity with default
 * properties
 */
export function createPedidoTemplate(): Partial<Pedido> {
  return {
    cliente: clienteMostrador(),
    fecha: new Date().toISOString(),
    sucursal: 'CALL CENTER'
  };
}

/**
 * Build the ShoppingCart sumary out of their items
 *
 * @param items PedidoDet array
 */
export function buildCartSumary(items: PedidoDet[]) {
  const importe = round(sumBy(items, 'importe'), 2);
  const descuentoImporte = round(sumBy(items, 'descuentoImporte'), 2);
  const subtotal = round(sumBy(items, 'subtotal'), 2);
  const impuesto = round(sumBy(items, 'impuesto'), 2);
  const total = round(sumBy(items, 'total'), 2);
  const maxDes = maxBy(items, 'descuento');
  const descuento = maxDes ? maxDes.descuento : 0.0;
  return {
    importe,
    descuentoImporte,
    subtotal,
    impuesto,
    total,
    descuento
  };
}

/**
 * Builds a Pedido entity in ready to be persisted
 *
 * @param state The ShoppingCart state
 * @param cliente The cliente to charte
 * @param items  Array of items (PedidoDet entities)
 * @param sumary Summary of the chart (Totales)
 */
export function buildPedidoEntity(
  state: CartState,
  cliente: Partial<Cliente>,
  nombre: string,
  items: PedidoDet[],
  sumary: CartSumary
): Pedido {
  if (state.pedido) {
    const pedido = {
      ...state.pedido,
      sucursal: state.sucursal,
      tipo: state.tipo,
      formaDePago: state.formaDePago,
      usoDeCfdi: state.usoDeCfdi,
      cfdiMail: state.cfdiMail,
      cliente: { id: cliente.id },
      nombre: nombre,
      rfc: cliente.rfc,
      partidas: items,
      kilos: sumBy(items, 'kilos'),
      envio: state.envio,
      comprador: state.comprador,
      comentario: state.comentario,
      socio: state.socio,
      descuentoEspecial: state.descuentoEspecial || 0.0,
      autorizacionesRequeridas: state.autorizacionesRequeridas,
      ...sumary
    };
    return pedido;
  } else {
    return buildNewPedido(state, sumary);
  }
}

export function buildNewPedido(state: CartState, sumary: CartSumary): Pedido {
  const cliente = state.cliente;
  const items = Object.values(state.items);
  return {
    fecha: new Date().toISOString(),
    sucursal: state.sucursal,
    tipo: state.tipo,
    formaDePago: state.formaDePago,
    moneda: 'MXN',
    tipoDeCambio: 1.0,
    usoDeCfdi: state.usoDeCfdi,
    cfdiMail: state.cfdiMail,
    cliente: { id: cliente.id },
    nombre: state.nombre,
    rfc: cliente.rfc,
    partidas: items,
    kilos: sumBy(items, 'kilos'),
    status: 'COTIZACION',
    envio: state.envio,
    comprador: state.comprador,
    comentario: state.comentario,
    socio: state.socio,
    descuentoEspecial: state.descuentoEspecial || 0.0,
    autorizacionesRequeridas: state.autorizacionesRequeridas,
    inicio: state.inicio,
    ...sumary
  };
}

/**
 * Utility function to create a CartItem out of a
 * producto
 *
 * @param producto The producto to build from
 */
export function buildCartItem(producto: Producto): CartItem {
  const {
    clave,
    descripcion,
    kilos,
    gramos,
    unidad,
    modoVenta,
    presentacion,
    nacional
  } = producto;
  return {
    id: undefined,
    cantidad: 0.0,
    precio: 0.0,
    importe: 0.0,
    producto: producto,
    clave,
    descripcion,
    kilos,
    gramos,
    unidad,
    modoVenta,
    presentacion,
    nacional,
    descuento: 0.0,
    descuentoImporte: 0.0,
    subtotal: 0.0,
    impuesto: 0.0,
    impuestoTasa: 0.16,
    total: 0.0,
    precioOriginal: 0.0,
    precioLista: 0.0,
    descuentoOriginal: 0
  };
}
export function updateItemProduct(
  item: CartItem,
  producto: Producto
): CartItem {
  return {
    ...item,
    producto: producto,
    ...extracProductDataForCartItem(producto)
  };
}

export function extracProductDataForCartItem(producto: Producto) {
  const {
    clave,
    descripcion,
    kilos,
    gramos,
    unidad,
    modoVenta,
    presentacion,
    nacional
  } = producto;
  return {
    clave,
    descripcion,
    kilos,
    gramos,
    unidad,
    modoVenta,
    presentacion,
    nacional
  };
}

/**
 * Filtra las partidas quitando las que no participan para acumular descuentos
 * ni les corresponde descuento alguno es dedicr CORTE, MANIOBRA y MANIOBRAF
 *
 * @param partidas
 */
export function normalize(partidas: CartItem[]) {
  return partidas
    .filter(item => !item.clave.includes('CORTE'))
    .filter(item => !item.clave.startsWith('MANIOBRA'));
}

/**
 * Quita las partidas de CORTE y MANIOBRA dejando la de MANIOBRAF
 *
 * @param partidas
 */
export function filtrarPartidasAutomaticas(partidas: CartItem[]) {
  return partidas
    .filter(item => !item.clave.includes('CORTE'))
    .filter(item => item.clave !== 'MANIOBRA');
}
