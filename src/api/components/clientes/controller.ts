import { INewInsert } from './../../../interfaces/Ifunctions';
import { IFactura, IMovCtaCte } from './../../../interfaces/Itables';
import { AfipClass } from './../../../utils/facturacion/AfipClass';
import { Ipages, IWhereParams } from 'interfaces/Ifunctions';
import { IClientes } from 'interfaces/Itables';
import {
  EConcatWhere,
  EModeWhere,
  ESelectFunct,
} from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';
import getPages from '../../../utils/getPages';
import { NextFunction } from 'express';
import fs from 'fs';

export = (injectedStore: typeof StoreType) => {
  let store = injectedStore;

  const list = async (page?: number, item?: string, cantPerPage?: number) => {
    let filter: IWhereParams | undefined = undefined;
    let filters: Array<IWhereParams> = [];
    if (item) {
      filter = {
        mode: EModeWhere.like,
        concat: EConcatWhere.or,
        items: [
          { column: Columns.clientes.telefono, object: String(item) },
          { column: Columns.clientes.email, object: String(item) },
          { column: Columns.clientes.ndoc, object: String(item) },
          { column: Columns.clientes.razsoc, object: String(item) },
        ],
      };
      filters.push(filter);
    }

    let pages: Ipages;
    if (page) {
      pages = {
        currentPage: page,
        cantPerPage: cantPerPage || 10,
        order: Columns.clientes.id,
        asc: true,
      };
      const data = await store.list(
        Tables.CLIENTES,
        [ESelectFunct.all],
        filters,
        undefined,
        pages,
      );
      const cant = await store.list(
        Tables.CLIENTES,
        [`COUNT(${ESelectFunct.all}) AS COUNT`],
        filters,
        undefined,
        undefined,
      );
      const pagesObj = await getPages(cant[0].COUNT, 10, Number(page));
      return {
        data,
        pagesObj,
      };
    } else {
      const data = await store.list(
        Tables.CLIENTES,
        [ESelectFunct.all],
        filters,
        undefined,
        undefined,
      );
      return {
        data,
      };
    }
  };

  const upsert = async (body: IClientes, next: NextFunction) => {
    const cliente: IClientes = {
      cuit: body.cuit,
      ndoc: body.ndoc,
      razsoc: body.razsoc,
      telefono: body.telefono,
      email: body.email,
      cond_iva: body.cond_iva,
    };

    try {
      if (body.id) {
        return await store.update(Tables.CLIENTES, cliente, body.id);
      } else {
        return await store.insert(Tables.CLIENTES, cliente);
      }
    } catch (error) {
      next(error);
    }
  };

  const remove = async (idCliente: number) => {
    const listCtaCte: {
      data: Array<IMovCtaCte>;
    } = await listCtaCteClient(idCliente, false, false);
    const cant = listCtaCte.data.length;
    if (cant > 0) {
      return 403;
    } else {
      const result: any = await store.remove(Tables.CLIENTES, {
        id: idCliente,
      });

      if (result.affectedRows > 0) {
        return 200;
      } else {
        return 500;
      }
    }
  };

  const get = async (idCliente: number) => {
    return await store.get(Tables.CLIENTES, idCliente);
  };

  const dataFiscalPadron = async (
    cuit: number,
    cert: string,
    key: string,
    cuitPv: number,
  ) => {
    let certDir = 'jretondo.crt';
    let keyDir = 'jretondo.key';
    const afip = new AfipClass(20350925148, certDir, keyDir, true);
    const dataFiscal = await afip.getDataCUIT(cuit);
    return dataFiscal;
  };

  const listCtaCteClient = async (
    idCliente: number,
    debit: boolean,
    credit: boolean,
    page?: number,
    cantPerPage?: number,
  ) => {
    let filter: IWhereParams | undefined = undefined;
    let filters: Array<IWhereParams> = [];

    if (!debit && !credit) {
      filter = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.none,
        items: [
          { column: Columns.ctaCte.id_cliente, object: String(idCliente) },
        ],
      };
      filters.push(filter);
    } else if (debit) {
      filter = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [
          { column: Columns.ctaCte.id_cliente, object: String(idCliente) },
        ],
      };
      filters.push(filter);

      filter = {
        mode: EModeWhere.less,
        concat: EConcatWhere.and,
        items: [{ column: Columns.ctaCte.importe, object: String(0) }],
      };
      filters.push(filter);
    } else if (credit) {
      filter = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [
          { column: Columns.ctaCte.id_cliente, object: String(idCliente) },
        ],
      };
      filters.push(filter);

      filter = {
        mode: EModeWhere.higher,
        concat: EConcatWhere.and,
        items: [{ column: Columns.ctaCte.importe, object: String(0) }],
      };
      filters.push(filter);
    }

    let pages: Ipages;
    if (page) {
      pages = {
        currentPage: page,
        cantPerPage: cantPerPage || 10,
        order: Columns.clientes.id,
        asc: false,
      };
      const data = await store.list(
        Tables.CTA_CTE,
        [ESelectFunct.all],
        filters,
        undefined,
        pages,
      );
      const cant = await store.list(
        Tables.CTA_CTE,
        [`COUNT(${ESelectFunct.all}) AS COUNT`],
        filters,
      );
      const suma = await store.list(
        Tables.CTA_CTE,
        [`SUM(${Columns.ctaCte.importe}) as SUMA`],
        filters,
      );
      const pagesObj = await getPages(cant[0].COUNT, 10, Number(page));
      return {
        data,
        pagesObj,
        suma,
      };
    } else {
      const data = await store.list(
        Tables.CTA_CTE,
        [ESelectFunct.all],
        filters,
        undefined,
        undefined,
      );
      const suma = await store.list(
        Tables.CTA_CTE,
        [`SUM(${Columns.ctaCte.importe}) as SUMA`],
        filters,
      );
      return {
        data,
        suma,
      };
    }
  };

  const registerPayment = async (
    newFact: IFactura,
    fileName: string,
    filePath: string,
    clienteData: IClientes,
    next: NextFunction,
  ) => {
    const result: INewInsert = await store.insert(Tables.FACTURAS, newFact);

    if (result.affectedRows > 0) {
      const ctacteData = {
        id_cliente: clienteData.id || 0,
        id_factura: result.insertId,
        id_recibo: result.insertId,
        forma_pago: newFact.forma_pago,
        importe: newFact.total_fact,
        detalle: 'Recibo de Pago',
      };
      const resultCtaCte = await store.insert(Tables.CTA_CTE, ctacteData);

      setTimeout(() => {
        fs.unlinkSync(filePath);
      }, 6000);

      const dataFact = {
        fileName,
        filePath,
        resultInsert: resultCtaCte,
      };
      return dataFact;
    } else {
      throw new Error('Error interno. No se pudo registrar el nuevo recibo.');
    }
  };

  const getDataPayment = async (fileName: string, filePath: string) => {
    const dataFact = {
      fileName,
      filePath,
    };
    return dataFact;
  };

  return {
    list,
    upsert,
    remove,
    get,
    dataFiscalPadron,
    listCtaCteClient,
    registerPayment,
    getDataPayment,
  };
};
