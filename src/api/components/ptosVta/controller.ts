import {
  EConcatWhere,
  EModeWhere,
  ESelectFunct,
} from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';
import getPages from '../../../utils/getPages';
import path from 'path';
import fs from 'fs';
import { staticFolders } from '../../../enums/EStaticFiles';
import { Ipages, IWhereParams } from 'interfaces/Ifunctions';
import { INewPV } from 'interfaces/Irequests';
import { IUser } from 'interfaces/Itables';

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
          { column: Columns.ptosVta.pv, object: String(item) },
          { column: Columns.ptosVta.cuit, object: String(item) },
          { column: Columns.ptosVta.nom_fantasia, object: String(item) },
          { column: Columns.ptosVta.direccion, object: String(item) },
        ],
      };
      filters.push(filter);
    }

    let pages: Ipages;
    if (page) {
      pages = {
        currentPage: page,
        cantPerPage: cantPerPage || 10,
        order: Columns.admin.id,
        asc: true,
      };
      const data = await store.list(
        Tables.PUNTOS_VENTA,
        [ESelectFunct.all],
        filters,
        undefined,
        pages,
      );
      const cant = await store.list(
        Tables.PUNTOS_VENTA,
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
        Tables.PUNTOS_VENTA,
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

  const upsert = async (body: INewPV) => {
    const ptoVta: INewPV = {
      cuit: body.cuit,
      raz_soc: body.raz_soc,
      ini_act: body.ini_act,
      pv: body.pv,
      direccion: body.direccion,
      iibb: body.iibb,
      cond_iva: body.cond_iva,
      cat_mono: body.cat_mono,
      stock_ind: Boolean(body.stock_ind),
      email: body.email,
    };

    if (body.filesName) {
      ptoVta.cert_file = body.filesName.find(
        (element) => element.fieldName === 'cert',
      )?.path;
      ptoVta.key_file = body.filesName.find(
        (element) => element.fieldName === 'key',
      )?.path;
    }

    if (body.id) {
      return await store.update(Tables.PUNTOS_VENTA, ptoVta, body.id);
    } else {
      return await store.insert(Tables.PUNTOS_VENTA, ptoVta);
    }
  };

  const remove = async (id: number) => {
    const data: Array<INewPV> = await store.get(Tables.PUNTOS_VENTA, id);
    const fileCert: string = path.join(
      staticFolders.certAfip,
      data[0].cert_file || '',
    );
    const fileKey = path.join(staticFolders.certAfip, data[0].key_file || '');

    await store
      .remove(Tables.PUNTOS_VENTA, { id: id })
      .then(async (result: any) => {
        if (result.affectedRows > 0) {
          try {
            fs.unlinkSync(fileCert);
            fs.unlinkSync(fileKey);
          } catch (error) {
            console.error(error);
          }
          await store.remove(Tables.PUNTOS_VENTA, { id: id });
        } else {
          throw new Error();
        }
      });
  };

  const get = async (id: number): Promise<Array<INewPV>> => {
    return await store.get(Tables.PUNTOS_VENTA, id);
  };

  const getUserPv = async (user: IUser) => {
    if (!user.pv) {
      return {
        data: await store.list(Tables.PUNTOS_VENTA, [ESelectFunct.all]),
      };
    }
    return {
      data: await store.query(Tables.PUNTOS_VENTA, { pv: user.pv }),
    };
  };

  return {
    list,
    upsert,
    remove,
    get,
    getUserPv,
  };
};
