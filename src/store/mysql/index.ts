import mysql from 'mysql';
import { Tables } from '../../enums/EtablesDB';
import { config } from '../../config';
import {
  multipleInsert,
  selectContructor,
  updateConstructor,
} from './functions';
import {
  IJoin,
  IJoinMysql,
  IMultipleInsert,
  Iorder,
  Ipages,
  IWhere,
  IWhereParams,
} from 'interfaces/Ifunctions';

const dbConf = {
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
};

let connection: any;

let isAttemptingReconnect = false;

const handleCon = () => {
  if (isAttemptingReconnect) {
    return;
  }
  isAttemptingReconnect = true;

  connection = mysql.createConnection(dbConf);

  connection.connect((err: any) => {
    if (err) {
      console.error('[db] ', err);
      setTimeout(() => {
        isAttemptingReconnect = false;
        handleCon();
      }, 2000);
    } else {
      console.log('DB Connected');
      isAttemptingReconnect = false;
    }
  });

  connection.on('error', (err: any) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      isAttemptingReconnect = false;
      handleCon();
    } else {
      console.error('[db] ', err);
      throw err;
    }
  });
};

handleCon();

const insert = async (table: Tables, data: object): Promise<any> => {
  let query = ` INSERT INTO ${table} SET ? `;

  return new Promise((resolve, reject) => {
    connection.query(query, data, (err: Error, result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const mInsert = async (table: Tables, data: IMultipleInsert): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const query = await multipleInsert(data.headers, data.rows);
    connection.query(
      ` INSERT INTO ${table} ${query} `,
      (err: Error, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );
  });
};

const update = async (
  table: Tables,
  data: object,
  id: number,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    connection.query(
      ` UPDATE ${table} SET ? WHERE id = ? `,
      [data, id],
      (err: Error, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );
  });
};

const remove = async (table: Tables, data: object) => {
  return new Promise((resolve, reject) => {
    connection.query(
      ` DELETE FROM ${table} WHERE ? `,
      [data],
      (err: Error, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );
  });
};

const query = async (
  table: Tables,
  query: any,
  join?: IJoinMysql,
  groupBy?: Array<string>,
): Promise<any> => {
  let joinQuery: string = '';
  if (join) {
    const tableJoin = join.tableJoin;
    const columnJoin = join.columnJoin;
    const columnOrigin = join.columnOrigin;

    joinQuery = ` JOIN ${tableJoin} ON ${table}.${columnOrigin} = ${tableJoin}.${columnJoin} `;
  }
  let query2 = ` SELECT * FROM ${table} ${joinQuery} WHERE ${table}.? `;
  if (groupBy) {
    query2 = `${query2} GROUP BY `;
    groupBy.map((item, key) => {
      if (key === groupBy.length - 1) {
        query2 = `${query2} ${item}`;
      } else {
        query2 = `${query2} ${item}, `;
      }
    });
  }
  return new Promise((resolve, reject) => {
    connection.query(query2, query, (err: Error, res: any) => {
      if (err) return reject(err);
      resolve(res || null);
    });
  });
};

const get = async (table: Tables, id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    connection.query(
      ` SELECT * FROM ${table} WHERE id = '${id}' `,
      (err: Error, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      },
    );
  });
};
const getAnyCol = async (table: Tables, data: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    connection.query(
      ` SELECT * FROM ${table} WHERE ? `,
      [data],
      (err: Error, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      },
    );
  });
};

const list = (
  table: Tables,
  colSelect: Array<string>,
  whereParams?: Array<IWhereParams>,
  groupBy?: Array<string>,
  pages?: Ipages,
  join?: IJoin,
  order?: Iorder,
): Promise<any> => {
  const query = selectContructor(
    table,
    colSelect,
    whereParams,
    groupBy,
    pages,
    join,
    order,
  );
  return new Promise((resolve, reject) => {
    connection.query(query, (err: Error, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const updateWhere = (
  table: Tables,
  colSelect: Array<IWhere>,
  whereParams?: Array<IWhereParams>,
): Promise<any> => {
  const query = updateConstructor(table, colSelect, whereParams);

  return new Promise((resolve, reject) => {
    connection.query(query, (err: Error, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

export = {
  insert,
  update,
  remove,
  query,
  get,
  mInsert,
  list,
  updateWhere,
  getAnyCol,
};
