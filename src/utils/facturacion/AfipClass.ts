//Se importa el módulo jretondo-afip-ws 
import Afip from 'ts-afip-ws';
import { staticFolders } from '../../enums/EStaticFiles';

enum resStatus {
    ok = 200,
    error = 500
}
//Yo recomiendo útilizar clases para crear el objeto con todos los métodos como más le convenga
//En este ejemplo solamente útilizaremos la consulta del padrón A5, ya que es la más útilizada
//Y también la creación de facturas y consultas de último número de factura
export class AfipClass {
    afip: Afip;
    constructor(
        private CUIT: number,
        private cert: string,
        private key: string,
        private production: boolean,
    ) {
        this.afip = new Afip({
            CUIT: this.CUIT,
            res_folder: staticFolders.certAfip,
            cert: this.cert,
            key: this.key,
            ta_folder: staticFolders.tokenAfip,
            production: this.production
        })
    }

    setParams(newCuit: number, newCert: string, newKey: string) {
        this.CUIT = newCuit;
        this.cert = newCert;
        this.key = newKey;
    }

    async getServerStatusDataCUIT(): Promise<{
        status: resStatus,
        data: string
    }> {
        const status = await this.afip.RegisterScopeFive.getServerStatus();
        if (status.appserver === "OK" && status.authserver === "OK" && status.dbserver === "OK") {
            const response = {
                status: resStatus.ok,
                data: "Servidores online"
            }
            return response;
        } else {
            const response = {
                status: resStatus.error,
                data: "Servidores fuera de servicio"
            }
            return response;
        }
    }
    async getServerStatusFact(): Promise<{
        status: resStatus,
        data: string
    }> {
        const status: any = await this.afip.ElectronicBilling.getServerStatus();
        if (status.AppServer === "OK" && status.DbServer === "OK" && status.AuthServer === "OK") {
            const response = {
                status: resStatus.ok,
                data: "Servidores online"
            }
            return response;
        } else {
            const response = {
                status: resStatus.error,
                data: "Servidores fuera de servicio"
            }
            return response;
        }
    }
    async getDataCUIT(cuit_cons: number): Promise<{
        status: resStatus,
        data: DataCUIT | null
    }> {
        const dataCUIT = await this.afip.RegisterScopeFive.getTaxpayerDetails(cuit_cons);
        if (dataCUIT === null) {
            const response = {
                status: resStatus.error,
                data: null
            }
            return response;
        } else {
            const response = {
                status: resStatus.ok,
                data: dataCUIT
            }
            return response;
        }
    }
    async lastFact(pv: number, tipo: CbteTipos | any): Promise<{
        status: resStatus,
        data: number | string
    }> {
        try {
            const ultFact = await this.afip.ElectronicBilling.getLastVoucher(pv, tipo);
            const response = {
                status: resStatus.ok,
                data: ultFact
            }
            return response;
        } catch (error) {
            const response = {
                status: resStatus.error,
                data: String(error)
            }
            return response;
        }
    }
    async newFact(data:
        FactMonotribProd
        | FactMonotribServ
        | FactMonotribProdNC
        | FactMonotribServNC
        | FactInscriptoProd
        | FactInscriptoServ
        | FactInscriptoProdNC
        | FactInscriptoServNC): Promise<{
            status: resStatus,
            data: FactMonotribProd
            | FactMonotribServ
            | FactInscriptoProd
            | FactInscriptoServ
            | string | any
        }> {
        const nfact = await this.lastFact(data.PtoVta, data.CbteTipo);
        if (nfact.status === 200) {
            data.CbteDesde = Number(nfact.data) + 1;
            data.CbteHasta = data.CbteDesde
            const dataFact = await this.afip.ElectronicBilling.createVoucher(data);
            data.CAE = dataFact.CAE;
            data.CAEFchVto = dataFact.CAEFchVto;
            const response = {
                status: resStatus.ok,
                data: data
            }
            return response;
        } else {
            const response = {
                status: resStatus.error,
                data: "Punto de venta o tipo de factura incorrecta."
            }
            return response;
        }
    }
    async getInvoiceInfo(ncbte: number, pv: number, tipo: CbteTipos): Promise<{
        status: resStatus,
        data: FactMonotribProd
        | FactMonotribServ
        | FactMonotribProdNC
        | FactMonotribServNC
        | FactInscriptoProd
        | FactInscriptoServ
        | FactInscriptoProdNC
        | FactInscriptoServNC
        | any
    }> {
        try {
            const dataFact = await this.afip.ElectronicBilling.getVoucherInfo(ncbte, pv, tipo);
            const response = {
                status: resStatus.ok,
                data: dataFact
            }
            return response;
        } catch (error) {
            const response = {
                status: resStatus.error,
                data: String(error)
            }
            return response;
        }
    }
}

export enum CbteTipos {
    "Factura A" = 1,
    "Nota de Débito A" = 2,
    "Nota de Crédito A" = 3,
    "Factura B" = 6,
    "Nota de Débito B" = 7,
    "Nota de Crédito B" = 8,
    "Recibos A" = 4,
    "Recibos B" = 9,
    "Factura C" = 11,
    "Nota de Débito C" = 12,
    "Nota de Crédito C" = 13,
    "Recibo C" = 15,
    "Factura M" = 51,
    "Nota de Débito M" = 52,
    "Nota de Crédito M" = 53,
    "Recibo M" = 54
}
export enum TiposTributo {
    "Impuestos nacionales" = 1,
    "Impuestos provinciales" = 2,
    "Impuestos municipales" = 3,
    "Impuestos Internos" = 99
}
export enum Conceptos {
    "Productos" = 1,
    "Servicios" = 2,
    "Productos y Servicios" = 3
}
export enum DocTipos {
    "CUIT" = 80,
    "DNI" = 96,
    "Sin identificar" = 99
}
export enum AlicuotasIva {
    "0%" = 3,
    "10,5%" = 4,
    "21%" = 5,
    "27%" = 6,
    "5%" = 8,
    "2,5%" = 9
}
export const perIvaAlicuotas: Array<{
    per: number,
    id: number
}> = [
        {
            per: 0,
            id: 3
        },
        {
            per: 10.5,
            id: 4
        },
        {
            per: 21,
            id: 5
        },
        {
            per: 27,
            id: 6
        },
        {
            per: 5,
            id: 8
        },
        {
            per: 2.5,
            id: 9
        }
    ]
export enum DataFactRes {
    "CAE" = "CAE",
    "CAEFchVto" = "CAEFchVto"
}

export enum condFiscalIva {
    "IVA Responsable Inscripto" = 1,
    "IVA Responsable no Inscripto" = 2,
    "IVA no Responsable" = 3,
    "IVA Sujeto Exento" = 4,
    "Consumidor Final" = 5,
    "Responsable Monotributo" = 6,
    "Sujeto no Categorizado" = 7,
    "Proveedor del Exterior" = 8,
    "Cliente del Exterior" = 9,
    "IVA Liberado Ley Nº 19.640" = 10,
    "IVA Responsable Inscripto Agente de Percepción" = 11,
    "Pequeño Contribuyente Eventual" = 12,
    "Monotributista Social" = 13,
    "Pequeño Contribuyente Eventual Social" = 14,
}

interface datosGenerales {
    domicilioFiscal: {
        codPostal: string,
        descripcionProvincia: string,
        direccion: string,
        idProvincia: number,
        tipoDomicilio: string,
        localidad?: string,
    },
    estadoClave: string,
    idPersona: number,
    mesCierre: number,
    tipoClave: string,
    tipoPersona: "FISICA" | "JURIDICA"
}
interface datGenPerFisica extends datosGenerales {
    apellido: string,
    nombre: string
}
interface datGenPerJuridica extends datosGenerales {
    fechaContratoSocial: string,
    razonSocial: string
}
export interface DataCUIT {
    datosGenerales: datGenPerFisica | datGenPerJuridica,
    datosRegimenGeneral?: {
        actividad?: Array<{
            descripcionActividad: string,
            idActividad: number,
            nomenclador: number,
            orden: number,
            periodo: number
        }>,
        impuesto?: Array<{
            descripcionImpuesto: string,
            idImpuesto: number,
            periodo: number
        }>,
        regimen?: Array<{
            descripcionRegimen: string,
            idImpuesto: number,
            idRegimen: number,
            periodo: number,
            tipoRegimen?: string
        }>
    },
    datosMonotributo?: {
        actividad: Array<{
            descripcionActividad: string,
            idActividad: number,
            nomenclador: number,
            orden: number,
            periodo: number
        }>,
        actividadMonotributista: {
            descripcionActividad: string,
            idActividad: number,
            nomenclador: number,
            orden: number,
            periodo: number
        },
        categoriaMonotributo: {
            descripcionCategoria: string,
            idCategoria: number,
            idImpuesto: number,
            periodo: number
        },
        impuesto?: Array<{
            descripcionImpuesto: string,
            idImpuesto: number,
            periodo: number
        }>
    }
}
interface FactBase {
    CantReg: number,
    PtoVta: number,
    CbteTipo: CbteTipos,
    DocTipo: DocTipos,
    DocNro: number,
    CbteFch: string,
    ImpTotal: number,
    MonCotiz: 1,
    MonId: "PES",
    CbteDesde?: number,
    CbteHasta?: number,
    CAE?: string,
    CAEFchVto?: string,
    CbtesAsoc?: Array<{
        Tipo: CbteTipos,
        PtoVta: number,
        Nro: number,
        Cuit: number
    }>
}
interface FactServicios {
    Concepto: Conceptos.Servicios,
    FchServDesde: string,
    FchServHasta: string,
    FchVtoPago: string
}
interface FactProductos {
    Concepto: Conceptos.Productos
}
interface FactMonotrib {
    ImpTotConc: 0,
    ImpNeto: number,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0
}

interface FactInscriptos {
    ImpTotConc: number,
    ImpNeto: number,
    ImpOpEx: number,
    ImpIVA: number,
    ImpTrib: number,
    Tributos?: Array<{
        id: TiposTributo,
        BaseImp: number,
        Alic: number,
        Importe: number,
        Desc?: string,
    }>,
    Iva?: Array<{
        Id: AlicuotasIva,
        BaseImp: number,
        Importe: number
    }>
}

export interface FactMonotribProd extends FactBase, FactMonotrib, FactProductos {
}
export interface FactMonotribServ extends FactBase, FactMonotrib, FactServicios {
}

export interface FactInscriptoProd extends FactBase, FactInscriptos, FactProductos {
}
export interface FactInscriptoServ extends FactBase, FactInscriptos, FactServicios {

}