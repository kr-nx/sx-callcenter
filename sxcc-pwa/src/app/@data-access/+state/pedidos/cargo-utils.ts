import { FormaDePago, PedidoDet, TipoDePedido } from '@models';

import round from 'lodash-es/round';
import sumBy from 'lodash-es/sumBy';

import { v4 as uuidv4 } from 'uuid';

export function generarCargoPorTarjeta(
  items: PedidoDet[],
  fp: FormaDePago
): PedidoDet {
  const netos = items.filter((item) => item.modoVenta === 'N');
  if (netos.length > 0) {
    const cargo = fp === FormaDePago.TARJETA_CRE ? 0.02 : 0.01;
    console.log('Calculando cargo por pago: %s %n', fp, netos);
    const importeNeto = round(sumBy(netos, 'subtotal'), 2);
    const precio = round(importeNeto * cargo, 2);
    const importe = precio;
    const subtotal = importe;
    const impuesto = round(importe * 0.16, 2);
    const total = subtotal + impuesto;
    return {
      id: uuidv4(),
      cantidad: 1,
      precio,
      importe,
      impuesto,
      subtotal,
      total,
      producto: {
        id: '402880fc5e4ec411015e4ecdb4bb06a0',
        clave: 'MANIOBRA',
        descripcion: 'M A N I O B R A',
        modoVenta: 'N',
        imageUrl: 'assets/images/1273567240.jpg',
        precioCredito: 0.0,
        precioContado: precio,
      },
      clave: 'MANIOBRA',
      descripcion: 'M A N I O B R A',
      kilos: 0,
      gramos: 0,
      unidad: 'PZA',
      modoVenta: 'N',
      presentacion: 'ND',
      nacional: true,
      descuento: 0.0,
      descuentoImporte: 0.0,
      impuestoTasa: 0.16,
      precioOriginal: 0.0,
      precioLista: 0.0,
      descuentoOriginal: 0,
    };
  }
  return null;
}

export function generarCargoPorCorte(items: PedidoDet[]): PedidoDet | null {
  const found = items.filter((item) => item.corte);
  if (found && found.length > 0) {
    const cortes = found.map((item) => item.corte);
    const importeNeto = sumBy(cortes, (item) => item.cantidad * item.precio);
    const precio = round(importeNeto, 2);
    const importe = precio;
    const subtotal = importe;
    if (subtotal <= 0) {
      return null;
    }
    const impuesto = round(importe * 0.16, 2);
    const total = subtotal + impuesto;
    return {
      id: uuidv4(),
      cantidad: 1,
      precio: importe,
      importe,
      impuesto,
      subtotal,
      total,
      producto: {
        id: '402880fc5e4ec411015e4ecc6cc60571',
        clave: 'CORTE',
        descripcion: 'CORTE',
        modoVenta: 'N',
        precioCredito: precio,
        precioContado: precio,
      },
      clave: 'CORTE',
      descripcion: 'CORTE',
      kilos: 0,
      gramos: 0,
      unidad: 'PZA',
      modoVenta: 'N',
      presentacion: 'ND',
      nacional: true,
      descuento: 0.0,
      descuentoImporte: 0.0,
      impuestoTasa: 0.16,
      precioOriginal: 0.0,
      precioLista: 0.0,
      descuentoOriginal: 0,
    };
  } else {
    return null;
  }
}

export function generarCargoPorFlete(precio: number): PedidoDet {
  const importe = precio;
  const impuesto = round(precio * 0.16, 2);
  const total = importe + impuesto;
  return {
    id: uuidv4(),
    cantidad: 1,
    precio,
    importe,
    impuesto,
    subtotal: importe,
    total,
    producto: {
      id: '402880fc5e4ec411015e4ecdb4bb06a3',
      clave: 'MANIOBRAF',
      descripcion: 'M A N I O B R A F',
      modoVenta: 'N',
      precioCredito: precio,
      precioContado: precio,
    },
    clave: 'MANIOBRAF',
    descripcion: 'M A N I O B R A F',
    kilos: 0,
    gramos: 0,
    unidad: 'PZA',
    modoVenta: 'N',
    presentacion: 'ND',
    nacional: true,
    descuento: 0.0,
    descuentoImporte: 0.0,
    impuestoTasa: 0.16,
    precioOriginal: 0.0,
    precioLista: 0.0,
    descuentoOriginal: 0,
  };
}