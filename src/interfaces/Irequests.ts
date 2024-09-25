import { MetodosPago } from './../enums/EtablesDB';
import { IObjectFiles } from "./Ifunctions";

export interface INewUser {
    id?: number,
    nombre: string,
    apellido: string
    email: string,
    usuario: string,
    pv: number
}
export interface INewPermissions {
    permisos: Array<INewPermission>,
    idUser: number
}

export interface INewPermission {
    idPermiso: number
}

export interface INewPV {
    id?: number,
    cuit: number,
    raz_soc: string,
    ini_act: Date,
    pv: number,
    direccion: string,
    iibb: string,
    cond_iva: number,
    cat_mono: number,
    stock_ind: boolean,
    filesName?: Array<IObjectFiles>,
    key_file?: string,
    cert_file?: string,
    fact_m?: boolean,
    email: string
}

export interface INewProduct {
    id?: number,
    name: string,
    short_descr: string,
    category: string,
    subcategory: string,
    unidad: number,
    precio_compra: number,
    porc_minor: number,
    cod_barra: string,
    round: number,
    iva: number,
    id_prov: number,
    vta_price: number,
    vta_fija: boolean,
    filesName?: Array<IObjectFiles>
}
export interface INewStock {
    arrayBool: boolean,
    nvoStockSingle: number,
    pv_id: number,
    idProd: number,
    obs: string,
    costo: number,
    iva: number,
    id_user: number,
    precio_compra: number,
    porc_minor: number,
    round: number,
    vta_price: number,
    vta_fija: boolean,
    prod_name: string,
    pv_descr: string,
    category: string,
    sub_category: string,
    fact_id?: number
}
export interface INewFactura {
    fecha: Date,
    pv_id: number,
    t_fact: CbteTipos,
    fiscal: boolean,
    cond_iva: number,
    forma_pago: number,
    enviar_email: boolean,
    descuentoPerc: number,
    lista_prod: Array<{
        id_prod: number,
        cant_prod: number,

    }>,
    cliente_bool: boolean,
    cliente_tdoc?: number,
    cliente_ndoc?: number,
    cliente_email?: string,
    cliente_name?: string,
    det_rbo?: string,
    variosPagos?: Array<{
        tipo: MetodosPago,
        tipo_txt: string,
        importe: number
    }>
}