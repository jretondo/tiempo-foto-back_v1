import { IFormasPago } from './../../interfaces/Itables';
import { NextFunction, Request, Response } from 'express';
import { INewPV } from 'interfaces/Irequests';
import { IDetFactura, IFactura } from 'interfaces/Itables';
import errorSend from '../error';
import ControllerInvoices from '../../api/components/invoices';
import ControllerPtoVta from '../../api/components/ptosVta';
import moment from 'moment';

const dataFactMiddle = () => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const idFact = Number(req.params.id)
            const dataFact: Array<IFactura> = await ControllerInvoices.get(idFact)
            const detFact: Array<IDetFactura> = await ControllerInvoices.getDetails(idFact)
            const pvData: Array<INewPV> = await ControllerPtoVta.get(dataFact[0].pv_id)
            const variosPagos: Array<IFormasPago> = await ControllerInvoices.getFormasPago(idFact)

            if (dataFact[0].fiscal) {
                const dataFiscal: FactInscriptoProd |
                    FactInscriptoServ |
                    FactMonotribProd |
                    FactMonotribServ = await ControllerInvoices.getFiscalDataInvoice(dataFact[0].cbte, dataFact[0].pv_id, true, dataFact[0].t_fact, false)
                req.body.dataFiscal = dataFiscal
                req.body.dataFiscal.CAEFchVto = moment(req.body.dataFiscal.FchVto, "YYYYMMDD")
            }

            req.body.pvData = pvData[0]
            req.body.newFact = dataFact[0]
            req.body.productsList = detFact
            req.body.variosPagos = variosPagos

            next()
        } catch (error) {
            console.error(error)
            next(errorSend("Faltan datos o hay datos erroneos, controlelo!"))
        }
    }
    return middleware
}

export = dataFactMiddle