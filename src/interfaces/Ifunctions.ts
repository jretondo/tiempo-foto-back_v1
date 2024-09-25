import { EConcatWhere, EModeWhere, ETypesJoin } from "enums/EfunctMysql";
import { INewStock } from "./Irequests";

export interface IWhere {
    column: string,
    object: string
}
export interface IWhereParams {
    mode: EModeWhere,
    concat: EConcatWhere,
    items: Array<IWhere>
}
export interface Ipages {
    currentPage: number,
    order: string,
    cantPerPage: number,
    asc: boolean
}
export interface Iorder {
    columns: string[],
    asc: boolean
}

export interface ILike {
    columns: Array<string>,
    item: string
}

export interface IMultipleInsert {
    headers: Array<string>,
    rows: Array<any>
}
export interface IObjectFiles {
    fieldName: string,
    path: string
}
export interface IJoin {
    table: string,
    colJoin: string,
    colOrigin: string,
    type: ETypesJoin
}
export interface IJoinMysql {
    tableJoin: string,
    columnOrigin: string,
    columnJoin: string
}
export interface IChangeStock {
    origen: INewStock,
    destino: INewStock
}

export interface INewInsert {
    fieldCount: number,
    affectedRows: number,
    insertId: number,
    serverStatus: number,
    warningCount: number,
    message: string,
    protocol41: boolean,
    changedRows: number
}