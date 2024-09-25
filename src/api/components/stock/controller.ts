import {
  IChangeStock,
  Iorder,
  Ipages,
  IWhereParams,
} from 'interfaces/Ifunctions';
import { INewProduct, INewPV, INewStock } from 'interfaces/Irequests';
import {
  IDetFactura,
  IModPriceProd,
  IMovStock,
  IUser,
} from 'interfaces/Itables';
import moment from 'moment';
import getPages from '../../../utils/getPages';
import {
  EConcatWhere,
  EModeWhere,
  ESelectFunct,
} from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';

export = (injectedStore: typeof StoreType) => {
  let store = injectedStore;

  const list = async (idPv: number, idProd: number) => {
    let filter: IWhereParams | undefined = undefined;
    let filters: Array<IWhereParams> = [];

    filter = {
      mode: EModeWhere.strict,
      concat: EConcatWhere.and,
      items: [{ column: Columns.stock.id_prod, object: String(idProd) }],
    };
    filters.push(filter);

    let stockvar: Array<any> = [];
    filter = {
      mode: EModeWhere.strict,
      concat: EConcatWhere.and,
      items: [
        { column: Columns.stock.id_prod, object: String(idProd) },
        { column: Columns.stock.pv_id, object: String(idPv) },
      ],
    };
    filters.push(filter);
    const nuevo = await store.list(
      Tables.STOCK,
      [`${ESelectFunct.sum}(${Columns.stock.cant}) as cant`],
      filters,
      undefined,
      undefined,
      undefined,
    );
    const item = {
      stock: nuevo[0].cant === null ? 0 : nuevo[0].cant,
      variedad: false,
    };
    stockvar.push(item);
    return stockvar;
  };

  const ultimosMovStock = async (idPv: number, idProd: number) => {
    let filter: IWhereParams | undefined = undefined;
    let filters: Array<IWhereParams> = [];
    filter = {
      mode: EModeWhere.strict,
      concat: EConcatWhere.and,
      items: [
        { column: Columns.stock.id_prod, object: String(idProd) },
        { column: Columns.stock.pv_id, object: String(idPv) },
      ],
    };

    const orderBy: Ipages = {
      currentPage: 1,
      order: Columns.stock.fecha,
      cantPerPage: 20,
      asc: false,
    };

    filters.push(filter);
    return await store.list(
      Tables.STOCK,
      [ESelectFunct.all],
      filters,
      undefined,
      orderBy,
      undefined,
    );
  };

  const upsert = async (body: INewStock, user: IUser, act: Boolean) => {
    const prodData: Array<INewProduct> = await store.get(
      Tables.PRODUCTS_PRINCIPAL,
      body.idProd,
    );
    const pvData: Array<INewPV> = await store.get(
      Tables.PUNTOS_VENTA,
      body.pv_id,
    );
    const newMov: IMovStock = {
      fecha: new Date(),
      id_prod: body.idProd,
      pv_id: body.pv_id,
      cant: body.nvoStockSingle,
      venta: false,
      nro_remito: body.obs,
      costo: prodData[0].precio_compra * body.nvoStockSingle,
      iva: prodData[0].iva,
      id_user: user.id,
      prod_name: prodData[0].name,
      pv_descr: `${
        Number(body.pv_id) === 0 || Number(body.pv_id) === -1
          ? 'Deposito'
          : pvData[0].direccion + ` (PV: ${pvData[0].pv})`
      }`,
      category: prodData[0].category,
      sub_category: prodData[0].subcategory,
    };

    if (act && body.vta_price) {
      const NewPriceProd: IModPriceProd = {
        id: body.idProd,
        vta_fija: body.vta_fija,
        vta_price: body.vta_price,
        round: body.round,
        porc_minor: body.porc_minor,
        precio_compra: body.precio_compra,
      };
      await store.update(Tables.PRODUCTS_PRINCIPAL, NewPriceProd, body.idProd);
    }
    const response = await store.insert(Tables.STOCK, newMov);
    return response;
  };

  const multipleInsertStock = async (
    prodList: Array<IDetFactura>,
    userId: number,
    pvId: number,
    factId: number,
  ) => {
    const headers: Array<string> = [
      Columns.stock.fecha,
      Columns.stock.id_prod,
      Columns.stock.pv_id,
      Columns.stock.cant,
      Columns.stock.venta,
      Columns.stock.nro_remito,
      Columns.stock.costo,
      Columns.stock.iva,
      Columns.stock.id_user,
      Columns.stock.id_fact,
      Columns.stock.prod_name,
      Columns.stock.pv_descr,
      Columns.stock.category,
      Columns.stock.sub_category,
    ];

    const rows: Promise<Array<Array<any>>> = new Promise((resolve, reject) => {
      const rowsvalues: Array<Array<any>> = [];
      prodList.map(async (item, key) => {
        const prodData: Array<INewProduct> = await store.get(
          Tables.PRODUCTS_PRINCIPAL,
          item.id_prod,
        );
        const pvData: Array<INewPV> = await store.get(
          Tables.PUNTOS_VENTA,
          pvId,
        );
        const values = [];
        values.push(moment(new Date()).format('YYYY-MM-DD HH:mm:ss'));
        values.push(item.id_prod);
        values.push(pvId);
        values.push(-item.cant_prod);
        values.push(1);
        values.push('Venta Stock');
        values.push(0);
        values.push(item.alicuota_id);
        values.push(userId);
        values.push(factId);
        values.push(prodData[0].name);
        values.push(`${pvData[0].direccion} (PV: ${pvData[0].pv})`);
        values.push(prodData[0].category);
        values.push(prodData[0].subcategory);
        rowsvalues.push(values);
        if (key === prodList.length - 1) {
          resolve(rowsvalues);
        }
      });
    });
    try {
      const resultinsert = store.mInsert(Tables.STOCK, {
        headers: headers,
        rows: await rows,
      });
      return {
        status: 200,
        msg: resultinsert,
      };
    } catch (error) {
      throw new Error(String(error));
    }
  };

  const remove = async (id: number) => {
    await store.remove(Tables.STOCK, { id: id });
  };

  const get = async (id: number) => {
    return await store.get(Tables.STOCK, id);
  };

  const moverStock = async (body: IChangeStock, user: IUser) => {
    const destino: INewStock = body.destino;
    const origen: INewStock = body.origen;
    const result1 = await upsert(origen, user, false);
    const result2 = await upsert(destino, user, false);
    return {
      result1,
      result2,
    };
  };

  const ultStockList = async (
    desde?: string,
    hasta?: string,
    prodId?: number,
    tipoMov?: number,
    pvId?: number,
    userId?: number,
    cat?: string,
    subCat?: string,
    page?: number,
    cantPerPage?: number,
  ) => {
    let data: Array<IMovStock>;
    let pages: Ipages;
    let filters: Array<IWhereParams> = [];
    if (desde) {
      const filter: IWhereParams = {
        mode: EModeWhere.higherEqual,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.fecha, object: String(desde) }],
      };
      filters.push(filter);
    }
    if (hasta) {
      const filter: IWhereParams = {
        mode: EModeWhere.lessEqual,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.fecha, object: String(hasta) }],
      };
      filters.push(filter);
    }
    if (prodId) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.id_prod, object: String(prodId) }],
      };
      filters.push(filter);
    }
    if (tipoMov) {
      if (tipoMov === 1) {
        const filter: IWhereParams = {
          mode: EModeWhere.higher,
          concat: EConcatWhere.and,
          items: [{ column: Columns.stock.cant, object: String(0) }],
        };
        filters.push(filter);
      } else {
        const filter: IWhereParams = {
          mode: EModeWhere.less,
          concat: EConcatWhere.and,
          items: [{ column: Columns.stock.cant, object: String(0) }],
        };
        filters.push(filter);
      }
    }
    if (pvId) {
      if (pvId === -1) {
        const filter: IWhereParams = {
          mode: EModeWhere.strict,
          concat: EConcatWhere.and,
          items: [{ column: Columns.stock.pv_id, object: String(0) }],
        };
        filters.push(filter);
      } else {
        const filter: IWhereParams = {
          mode: EModeWhere.strict,
          concat: EConcatWhere.and,
          items: [{ column: Columns.stock.pv_id, object: String(pvId) }],
        };
        filters.push(filter);
      }
    }

    if (userId) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.id_user, object: String(userId) }],
      };
      filters.push(filter);
    }
    if (cat) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.category, object: String(cat) }],
      };
      filters.push(filter);
    }
    if (subCat) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.sub_category, object: String(subCat) }],
      };
      filters.push(filter);
    }
    if (page) {
      pages = {
        currentPage: page,
        cantPerPage: cantPerPage || 10,
        order: Columns.stock.fecha,
        asc: false,
      };
      data = await store.list(
        Tables.STOCK,
        [ESelectFunct.all],
        filters,
        undefined,
        pages,
      );
      const cant = await store.list(
        Tables.STOCK,
        [`COUNT(${ESelectFunct.all}) AS COUNT`],
        filters,
      );
      const pagesObj = await getPages(cant[0].COUNT, 10, Number(page));
      return {
        data,
        pagesObj,
      };
    } else {
      return await store.list(Tables.STOCK, [ESelectFunct.all], filters);
    }
  };

  const listaStock = async (
    desc: boolean,
    order: string,
    prodId?: number,
    pvId?: number,
    cat?: string,
    subCat?: string,
    group?: number,
    page?: number,
    cantPerPage?: number,
  ) => {
    let data: Array<IMovStock>;
    let pages: Ipages;
    let filters: Array<IWhereParams> = [];
    if (prodId) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.id_prod, object: String(prodId) }],
      };
      filters.push(filter);
    }
    if (pvId) {
      if (pvId === -1) {
        const filter: IWhereParams = {
          mode: EModeWhere.strict,
          concat: EConcatWhere.and,
          items: [{ column: Columns.stock.pv_id, object: String(0) }],
        };
        filters.push(filter);
      } else {
        const filter: IWhereParams = {
          mode: EModeWhere.strict,
          concat: EConcatWhere.and,
          items: [{ column: Columns.stock.pv_id, object: String(pvId) }],
        };
        filters.push(filter);
      }
    }
    if (cat) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.category, object: String(cat) }],
      };
      filters.push(filter);
    }
    if (subCat) {
      const filter: IWhereParams = {
        mode: EModeWhere.strict,
        concat: EConcatWhere.and,
        items: [{ column: Columns.stock.sub_category, object: String(subCat) }],
      };
      filters.push(filter);
    }

    let groupBy: Array<string> = [Columns.stock.id_prod];

    if (group === 1) {
      groupBy = [Columns.stock.sub_category];
    } else if (group === 2) {
      groupBy = [Columns.stock.category];
    }
    let arrayOrden: Array<{
      orden: number;
      title: string;
    }> = JSON.parse(order);
    arrayOrden = arrayOrden.sort((a, b) => a.orden - b.orden);
    let ordenArray: Array<string> = [];
    let orden: Iorder = {
      columns: ordenArray,
      asc: desc,
    };
    arrayOrden.map((item, key) => {
      if (item.title === 'Nombre de Productos') {
        ordenArray.push(Columns.stock.prod_name);
      } else if (item.title === 'Importe') {
        ordenArray.push('costoTotal');
      } else if (item.title === 'Marca') {
        ordenArray.push(Columns.stock.sub_category);
      } else if (item.title === 'Proveedor') {
        ordenArray.push(Columns.stock.category);
      }
      if (key === arrayOrden.length - 1) {
        orden = {
          columns: ordenArray,
          asc: desc,
        };
      }
    });
    if (page) {
      pages = {
        currentPage: page,
        cantPerPage: cantPerPage || 10,
        order: Columns.prodImg.id_prod,
        asc: true,
      };
      data = await store.list(
        Tables.STOCK,
        [
          ESelectFunct.all,
          `SUM(${Columns.stock.cant}) as total`,
          `SUM(${Columns.stock.costo}) as costoTotal`,
        ],
        filters,
        groupBy,
        pages,
        undefined,
        orden,
      );
      const cant = await store.list(
        Tables.STOCK,
        [`COUNT(${ESelectFunct.all}) AS COUNT`],
        filters,
        groupBy,
      );
      const pagesObj = await getPages(cant.length, 10, Number(page));
      return {
        data,
        pagesObj,
      };
    } else {
      return await store.list(Tables.STOCK, [ESelectFunct.all], filters);
    }
  };

  const getStockProd = async (idProd: number, pvId: number) => {
    let filters: Array<IWhereParams> = [];
    const filter: IWhereParams = {
      mode: EModeWhere.strict,
      concat: EConcatWhere.and,
      items: [
        { column: Columns.stock.pv_id, object: String(pvId < 0 ? 0 : pvId) },
        { column: Columns.stock.id_prod, object: String(idProd) },
      ],
    };
    filters.push(filter);
    const response = await store.list(
      Tables.STOCK,
      [`SUM(${Columns.stock.cant}) as cant`],
      filters,
    );
    try {
      return response[0].cant;
    } catch (error) {
      return 0;
    }
  };

  return {
    list,
    upsert,
    remove,
    get,
    ultimosMovStock,
    moverStock,
    multipleInsertStock,
    ultStockList,
    listaStock,
    getStockProd,
  };
};
