import { IJoinMysql, IWhereParams } from 'interfaces/Ifunctions';
import {
  EModeWhere,
  EConcatWhere,
  ESelectFunct,
} from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';

export = (injectedStore: typeof StoreType) => {
  let store = injectedStore;

  const upsert = async (body: any) => {
    if (body.permisos.length > 0) {
      await store.remove(Tables.USER_PERMISSIONS, { id_user: body.idUser });

      const headers = [
        Columns.userPemissions.id_permission,
        Columns.userPemissions.id_user,
      ];

      const permissions: Promise<Array<Array<number>>> = new Promise(
        (resolve, reject) => {
          let prov: Array<any> = [];
          body.permisos.map((item: any, key: number) => {
            prov.push([item.idPermiso, body.idUser]);
            if (key === body.permisos.length - 1) {
              resolve(prov);
            }
          });
        },
      );

      return await store.mInsert(Tables.USER_PERMISSIONS, {
        headers: headers,
        rows: await permissions,
      });
    } else {
      return await store.remove(Tables.USER_PERMISSIONS, {
        id_user: body.idUser,
      });
    }
  };

  const getPermision = async (idUser: number, idPermission: number) => {
    let filters: Array<IWhereParams> | undefined = [];
    const filter: IWhereParams = {
      mode: EModeWhere.strict,
      concat: EConcatWhere.and,
      items: [
        {
          column: Columns.userPemissions.id_user,
          object: String(idUser),
        },
        {
          column: Columns.userPemissions.id_permission,
          object: String(idPermission),
        },
      ],
    };
    filters.push(filter);
    return await store.list(
      Tables.USER_PERMISSIONS,
      [ESelectFunct.all],
      filters,
      undefined,
      undefined,
    );
  };

  const get2 = async (idUser: number) => {
    const join: IJoinMysql = {
      tableJoin: Tables.PERMISSIONS,
      columnOrigin: Columns.userPemissions.id_permission,
      columnJoin: Columns.permissions.id,
    };
    let filters: Array<IWhereParams> | undefined = [];
    const filter: IWhereParams = {
      mode: EModeWhere.dif,
      concat: EConcatWhere.and,
      items: [
        {
          column: Columns.permissions.id,
          object: String(8),
        },
      ],
    };
    filters.push(filter);
    const allPermissions = await store.list(
      Tables.PERMISSIONS,
      ['*'],
      filters,
      undefined,
      undefined,
      undefined,
    );

    const userPermissions = await store.query(
      Tables.USER_PERMISSIONS,
      { id_user: idUser },
      join,
      [Columns.userPemissions.id_permission],
    );

    const permisos: Array<any> = await new Promise((resolve, reject) => {
      const lista: Array<any> = [];
      allPermissions.map((item: any, key: number) => {
        const idPermiso = item.id;
        const found = userPermissions.find(
          (element: any) => element.id_permission === idPermiso,
        );
        if (!found) {
          lista.push(item);
        }
        if (key === allPermissions.length - 1) {
          resolve(lista);
        }
      });
    });

    return {
      userPermissions,
      permisos,
    };
  };

  const get = async (idUser: number) => {
    return await store.query(
      Tables.USER_PERMISSIONS,
      { id_user: idUser },
      undefined,
      [Columns.userPemissions.id_permission],
    );
  };

  const getPermissions = async () => {
    return await store.list(
      Tables.PERMISSIONS,
      ['*'],
      undefined,
      undefined,
      undefined,
      undefined,
    );
  };

  return {
    upsert,
    getPermision,
    get,
    get2,
    getPermissions,
  };
};
