import { NextFunction, Request, Response } from "express"
import { INewPV } from "interfaces/Irequests";
import { IDetFactura, IFactura, IUser } from "interfaces/Itables";
import moment from "moment";
import ControllerInvoices from '../../api/components/invoices';
import ControllerPtoVta from '../../api/components/ptosVta';
import { Conceptos, perIvaAlicuotas } from "./AfipClass";

const devFactMiddle = () => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        req.body.timer = Number(new Date())
        const idFact = req.body.id
        const fecha = req.body.fecha
        const dataFact: Array<IFactura> = await ControllerInvoices.get(idFact)
        const detFact: Array<IDetFactura> = await ControllerInvoices.getDetails(idFact)
        const user: IUser = req.body.user
        const pvData: Array<INewPV> = await ControllerPtoVta.get(dataFact[0].pv_id);
        const esFiscal = dataFact[0].fiscal
        const tipoFact = dataFact[0].t_fact
        let tipoNC: number = 0
        let letra: string = "DEV"
        if (esFiscal) {
            switch (tipoFact) {
                case 1:
                    tipoNC = 3
                    letra = "NC A"
                    break;
                case 6:
                    tipoNC = 8
                    letra = "NC B"
                    break;
                case 11:
                    tipoNC = 13
                    letra = "NC C"
                    break;
                case 51:
                    tipoNC = 53
                    letra = "NC M"
                    break;
                default:
                    tipoNC = 0
                    letra = "DEV"
                    break;
            }
        }

        const newFact: IFactura = {
            fecha: fecha,
            pv: dataFact[0].pv,
            cbte: 0,
            letra: letra,
            t_fact: tipoNC,
            cuit_origen: dataFact[0].cuit_origen,
            iibb_origen: dataFact[0].iibb_origen,
            ini_act_origen: dataFact[0].ini_act_origen,
            direccion_origen: dataFact[0].direccion_origen,
            raz_soc_origen: dataFact[0].raz_soc_origen,
            cond_iva_origen: dataFact[0].cond_iva_origen,
            tipo_doc_cliente: dataFact[0].tipo_doc_cliente || 99,
            n_doc_cliente: dataFact[0].n_doc_cliente || 0,
            cond_iva_cliente: dataFact[0].cond_iva_cliente,
            email_cliente: dataFact[0].email_cliente || "",
            nota_cred: true,
            fiscal: esFiscal,
            raz_soc_cliente: dataFact[0].raz_soc_cliente || "",
            user_id: user.id || 0,
            seller_name: `${user.nombre} ${user.apellido}`,
            total_fact: - dataFact[0].total_fact,
            total_iva: - dataFact[0].total_iva,
            total_neto: - dataFact[0].total_neto,
            total_compra: - dataFact[0].total_compra,
            forma_pago: dataFact[0].forma_pago,
            pv_id: dataFact[0].pv_id,
            id_fact_asoc: dataFact[0].id || 0,
            descuento: dataFact[0].descuento
        }
        let newDet: Array<IDetFactura> = []

        new Promise((resolve, reject) => {
            detFact.map((item, key) => {
                const precio_ind = - item.precio_ind
                const total_costo = - item.total_costo
                const total_iva = - item.total_iva
                const total_neto = - item.total_neto
                const total_prod = - item.total_prod
                newDet.push({ ...item, precio_ind, total_costo, total_iva, total_neto, total_prod })
                if (detFact.length - 1 === key) {
                    resolve(detFact)
                }
            })
        })

        let ivaList: Array<IIvaItem> = [];
        let dataFiscal:
            FactInscriptoProd |
            FactInscriptoServ |
            FactMonotribProd |
            FactMonotribServ |
            any = {}

        if (esFiscal) {

            const descuentoPer = ((dataFact[0].descuento / (dataFact[0].total_fact + dataFact[0].descuento)) * 100)

            ivaList = await listaIva(detFact, descuentoPer);
            dataFiscal = {
                CantReg: 1,
                PtoVta: dataFact[0].pv,
                CbteTipo: newFact.t_fact,
                DocTipo: newFact.tipo_doc_cliente,
                DocNro: newFact.n_doc_cliente,
                CbteFch: moment(newFact.fecha, "YYYY-MM-DD").format("YYYYMMDD"),
                ImpTotal: - newFact.total_fact,
                MonCotiz: 1,
                MonId: "PES",
                Concepto: Conceptos.Productos,
                ImpTotConc: 0,
                ImpNeto: - newFact.total_neto,
                ImpOpEx: 0,
                ImpIVA: - newFact.total_iva,
                ImpTrib: 0,
                Iva: ivaList,
                CbtesAsoc: [{
                    Tipo: dataFact[0].t_fact,
                    PtoVta: dataFact[0].pv,
                    Nro: dataFact[0].cbte,
                    Cuit: dataFact[0].n_doc_cliente
                }]
            }
        }
        req.body.newFact = newFact
        req.body.dataFiscal = dataFiscal
        req.body.pvData = pvData[0]
        req.body.productsList = newDet

        next();
    }
    return middleware
}

const listaIva = async (listaProd: Array<IDetFactura>, descuento: number): Promise<Array<IIvaItem>> => {
    listaProd.sort((a, b) => { return a.alicuota_id - b.alicuota_id })
    let ivaAnt = 0;
    let listaIva: Array<IIvaItem> = []
    if (listaProd.length > 0) {
        return new Promise((resolve, reject) => {
            listaProd.map((item, key) => {
                let ivaAux = perIvaAlicuotas.find(e => e.per === item.alicuota_id) || { per: 0, id: 3 };
                const iva = ivaAux.id
                if (iva !== ivaAnt) {
                    if (descuento > 0) {
                        listaIva.push({
                            Id: iva,
                            BaseImp: (item.total_neto - (item.total_neto * (descuento / 100))),
                            Importe: (item.total_iva - (item.total_iva * (descuento / 100)))
                        })

                    } else {
                        listaIva.push({
                            Id: iva,
                            BaseImp: (item.total_neto),
                            Importe: (item.total_iva)
                        })
                    }
                } else {
                    const index = listaIva.length - 1
                    if (descuento > 0) {
                        listaIva[index] = {
                            Id: iva,
                            BaseImp: (listaIva[index].BaseImp + (item.total_neto - (item.total_neto * (descuento / 100)))),
                            Importe: (listaIva[index].Importe + (item.total_iva - (item.total_iva * (descuento / 100))))
                        }
                    } else {
                        listaIva[index] = {
                            Id: iva,
                            BaseImp: (listaIva[index].BaseImp + (item.total_neto)),
                            Importe: (listaIva[index].Importe + (item.total_iva))
                        }
                    }
                }
                ivaAnt = 5;
                if (key === listaProd.length - 1) {
                    const newList: Array<IIvaItem> = []
                    listaIva.map((item, key2) => {
                        newList.push({
                            Id: item.Id,
                            BaseImp: (Math.round(item.BaseImp * 100)) / 100,
                            Importe: (Math.round(item.Importe * 100)) / 100
                        })
                        if (key2 === listaIva.length - 1) {
                            resolve(newList)
                        }
                    })
                }
            })
        })
    } else {
        return listaIva
    }
}

interface IIvaItem {
    Id: AlicuotasIva,
    BaseImp: number,
    Importe: number
}

export = devFactMiddle