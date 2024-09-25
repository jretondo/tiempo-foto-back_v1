import { roundNumber } from './../roundNumb';
import { NextFunction, Request, Response } from 'express';
import { INewFactura, INewProduct, INewPV } from 'interfaces/Irequests';
import { IDetFactura, IFactura, IUser } from 'interfaces/Itables';
import ptosVtaController from '../../api/components/ptosVta';
import prodController from '../../api/components/products';
import {
    AlicuotasIva,
    Conceptos,
    FactInscriptoProd,
    FactInscriptoServ,
    FactMonotribProd,
    FactMonotribServ,
    perIvaAlicuotas
} from './AfipClass';
import moment from 'moment';
import errorSend from '../error';
import ControllerInvoices from '../../api/components/invoices';

const factuMiddelDevPart = () => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            req.body.timer = Number(new Date())
            const idFact = req.body.idFact
            const fecha = req.body.fecha
            const detDelete: Array<IDetFactura> = req.body.prodList
            const dataFact: Array<IFactura> = await ControllerInvoices.get(idFact)

            let listProd: Array<{
                id_prod: number,
                cant_prod: number,
                price: number
            }> = []

            detDelete.map(item => {
                listProd.push({
                    id_prod: item.id_prod,
                    cant_prod: item.cant_prod,
                    price: item.total_prod
                })
            })

            const body: INewFactura = {
                fecha: fecha,
                pv_id: dataFact[0].pv_id,
                t_fact: dataFact[0].t_fact,
                fiscal: dataFact[0].fiscal,
                cond_iva: dataFact[0].cond_iva_cliente,
                forma_pago: dataFact[0].forma_pago,
                enviar_email: false,
                descuentoPerc: ((dataFact[0].descuento) / (dataFact[0].total_fact)),
                lista_prod: listProd,
                cliente_bool: Number(dataFact[0].n_doc_cliente) !== 0 ? true : false,
                cliente_tdoc: dataFact[0].tipo_doc_cliente,
                cliente_ndoc: dataFact[0].n_doc_cliente,
                cliente_email: dataFact[0].email_cliente,
                cliente_name: dataFact[0].raz_soc_cliente,
                det_rbo: dataFact[0].det_rbo,
            }
            const user: IUser = req.body.user
            const pvId = body.pv_id;
            const pvData: Array<INewPV> = await ptosVtaController.get(pvId);

            const fiscalBool = req.body.fiscal
            const variosPagos = body.variosPagos
            let montoCtaCte = 0
            let costo = 0
            let costoImputar = 0
            let comision = 0
            let comisionImputar = 0
            let porcPago = 0

            if (parseInt(fiscalBool) === 0) {
                body.fiscal = false
            }
            let cliente = {
                cliente_tdoc: 99,
                cliente_ndoc: 0
            }

            if (body.cliente_bool) {
                cliente = {
                    cliente_tdoc: body.cliente_tdoc || 99,
                    cliente_ndoc: body.cliente_ndoc || 0
                }
            }
            let tipoNC: number = 0
            let letra: string = "DEV"
            if (body.fiscal) {
                switch (dataFact[0].t_fact) {
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

            const productsList: IfactCalc = await calcProdLista(body.lista_prod);

            if (body.t_fact === 6 && productsList.totalFact < 10000 && body.cliente_tdoc === 99) {
                body.cliente_ndoc = 0
            }

            const descuento: number = body.descuentoPerc
            let descuentoNumber: number = 0
            let descuentoPer = 0

            if (descuento > 0) {
                descuentoNumber = Math.round(((productsList.totalFact * (descuento / 100)) * 100)) / 100
                descuentoPer = descuento
                productsList.totalFact = (productsList.totalFact) - (productsList.totalFact * (descuento / 100))
                productsList.totalIva = (productsList.totalIva) - (productsList.totalIva * (descuento / 100))
                productsList.totalNeto = (productsList.totalNeto) - (productsList.totalNeto * (descuento / 100))
            }

            if (Number(body.forma_pago) === 4) {
                montoCtaCte = productsList.totalFact
            } else if (Number(body.forma_pago) === 5) {
                variosPagos?.map(item => {
                    if (Number(item.tipo) === 4) {
                        montoCtaCte = Number(montoCtaCte) + Number(item.importe)
                    }
                })
            }

            porcPago = (productsList.totalFact - montoCtaCte) / productsList.totalFact
            costo = productsList.totalCosto * porcPago
            costoImputar = productsList.totalCosto - costo


            const newFact: IFactura = {
                fecha: body.fecha,
                pv: pvData[0].pv,
                cbte: 0,
                letra: letra,
                t_fact: tipoNC,
                cuit_origen: pvData[0].cuit,
                iibb_origen: pvData[0].iibb,
                ini_act_origen: pvData[0].ini_act,
                direccion_origen: pvData[0].direccion,
                raz_soc_origen: pvData[0].raz_soc,
                cond_iva_origen: pvData[0].cond_iva,
                tipo_doc_cliente: body.cliente_tdoc || 99,
                n_doc_cliente: body.cliente_ndoc || 0,
                cond_iva_cliente: body.cond_iva,
                email_cliente: body.cliente_email || "",
                nota_cred: false,
                fiscal: body.fiscal,
                raz_soc_cliente: body.cliente_name || "",
                user_id: user.id || 0,
                seller_name: `${user.nombre} ${user.apellido}`,
                total_fact: - (Math.round((productsList.totalFact) * 100)) / 100,
                total_iva: pvData[0].cond_iva === 1 ? - (Math.round((productsList.totalIva) * 100)) / 100 : 0,
                total_neto: pvData[0].cond_iva === 1 ? -(Math.round((productsList.totalNeto) * 100)) / 100 : (Math.round((productsList.totalFact) * 100)) / 100,
                total_compra: -(Math.round((costo) * 100)) / 100,
                forma_pago: body.forma_pago,
                pv_id: body.pv_id,
                id_fact_asoc: 0,
                descuento: - descuentoNumber,
            }

            let newDet: Array<IDetFactura> = []

            new Promise((resolve, reject) => {
                detDelete.map((item, key) => {
                    const precio_ind = - item.precio_ind
                    const total_costo = - item.total_costo
                    const total_iva = - item.total_iva
                    const total_neto = - item.total_neto
                    const total_prod = - item.total_prod
                    newDet.push({ ...item, precio_ind, total_costo, total_iva, total_neto, total_prod })
                    if (detDelete.length - 1 === key) {
                        resolve(detDelete)
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

            if (body.fiscal) {
                console.log('body.t_fact :>> ', body.t_fact);
                if (Number(body.t_fact) === 1 || Number(body.t_fact) === 6) {
                    ivaList = await listaIva(productsList.listaProd, descuentoPer);
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
                } else {
                    ivaList = await listaIva(productsList.listaProd, descuentoPer);
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
                        ImpIVA: 0,
                        ImpTrib: 0,
                        CbtesAsoc: [{
                            Tipo: dataFact[0].t_fact,
                            PtoVta: dataFact[0].pv,
                            Nro: dataFact[0].cbte,
                            Cuit: dataFact[0].n_doc_cliente
                        }]
                    }
                }

            }
            req.body.newFact = newFact
            req.body.dataFiscal = dataFiscal
            req.body.pvData = pvData[0]
            req.body.productsList = newDet
            next();
        } catch (error) {
            console.error(error)
            next(errorSend("Faltan datos o hay datos erroneos, controlelo!"))
        }
    }
    return middleware
}

const calcProdLista = (productsList: INewFactura["lista_prod"]): Promise<IfactCalc> => {
    let dataAnt: Array<INewProduct> = [];
    let idAnt: number = 0;
    productsList.sort((a, b) => { return a.id_prod - b.id_prod })
    return new Promise((resolve, reject) => {
        let factura: IfactCalc = {
            listaProd: [],
            totalFact: 0,
            totalIva: 0,
            totalNeto: 0,
            totalCosto: 0
        }
        productsList.map(async (prod, key) => {
            let dataProd: Array<INewProduct> = [];
            if (prod.id_prod === idAnt) {
                dataProd = dataAnt
            } else {
                dataProd = await (await prodController.getPrincipal(prod.id_prod)).productGral
            }
            idAnt = prod.id_prod
            dataAnt = dataProd

            const totalCosto = (dataProd[0].precio_compra * prod.cant_prod);
            const totalProd = (dataProd[0].vta_price * prod.cant_prod);
            const totalNeto = (totalProd / (1 + (dataProd[0].iva / 100)));
            const totalIva = (totalNeto * (dataProd[0].iva / 100));

            const newProdFact: IDetFactura = {
                nombre_prod: dataProd[0].name,
                cant_prod: prod.cant_prod,
                unidad_tipo_prod: dataProd[0].unidad,
                id_prod: prod.id_prod,
                total_prod: roundNumber(totalProd),
                total_iva: (totalIva),
                alicuota_id: dataProd[0].iva,
                total_costo: roundNumber(totalCosto),
                total_neto: (totalNeto),
                precio_ind: dataProd[0].vta_price
            }

            factura.listaProd.push(newProdFact);
            factura.totalFact = (Math.round((factura.totalFact + (totalProd)) * 100)) / 100;
            factura.totalIva = (factura.totalIva + (totalIva));
            factura.totalNeto = (factura.totalNeto + (totalNeto));
            factura.totalCosto = (Math.round((factura.totalCosto + (totalCosto)) * 100)) / 100;

            if (key === productsList.length - 1) {
                factura.totalIva = (Math.round((factura.totalIva) * 100)) / 100;
                factura.totalNeto = (Math.round((factura.totalNeto) * 100)) / 100;
                resolve(factura)
            }
        })
    })
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
interface IfactCalc {
    listaProd: Array<IDetFactura>,
    totalFact: number,
    totalIva: number,
    totalNeto: number,
    totalCosto: number
}
interface IIvaItem {
    Id: AlicuotasIva,
    BaseImp: number,
    Importe: number
}
export = factuMiddelDevPart