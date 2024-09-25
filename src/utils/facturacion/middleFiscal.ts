import ControllerInvoices from '../../api/components/invoices';
import { NextFunction, Request, Response } from 'express';
import { INewPV } from 'interfaces/Irequests';
import { IFactura } from 'interfaces/Itables';
import { AfipClass } from './AfipClass';

export const fiscalMiddle = () => {
  const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      let asociado = null;
      const pvData: INewPV = req.body.pvData;
      const newFact: IFactura = req.body.newFact;
      const dataFiscal:
        | FactInscriptoProd
        | FactInscriptoProdNC
        | FactInscriptoServ
        | FactInscriptoServNC
        | FactMonotribProd
        | FactMonotribProdNC
        | FactMonotribServ
        | FactMonotribServNC
        | any = req.body.dataFiscal;
      if (dataFiscal.CbtesAsoc) {
        asociado = dataFiscal.CbtesAsoc;
        try {
          if (
            Number(asociado[0].Cuit) === 0 &&
            Number(newFact.n_doc_cliente) !== 0
          ) {
            asociado[0].Cuit = newFact.n_doc_cliente;
          } else {
            asociado[0] = {
              Tipo: asociado[0].Tipo,
              PtoVta: asociado[0].PtoVta,
              Nro: asociado[0].Nro,
            };
          }
        } catch (error) {}
      }

      if (newFact.fiscal) {
        let certDir = 'drop_test.crt';
        let keyDir = 'drop.key';
        let entornoAlt = false;

        if (process.env.ENTORNO === 'PROD') {
          certDir = pvData.cert_file || 'drop_test.crt';
          keyDir = pvData.key_file || 'drop.key';
          entornoAlt = true;
        }
        console.log('newFact.cuit_origen :>> ', newFact.cuit_origen);
        const afip = new AfipClass(
          newFact.cuit_origen,
          certDir,
          keyDir,
          entornoAlt,
        );
        const newDataFiscal = await afip.newFact(dataFiscal);
        req.body.dataFiscal = newDataFiscal.data;
        req.body.dataFiscal.CbteTipo = String(newFact.t_fact);
        req.body.newFact.cbte = req.body.dataFiscal.CbteDesde;
        if (asociado) {
          req.body.dataFiscal.CbtesAsoc = asociado;
        }

        next();
      } else {
        const lastInvoice = await ControllerInvoices.lastInvoice(
          pvData.id || 0,
          false,
          0,
          false,
        );
        newFact.cbte;
        req.body.newFact.cbte = lastInvoice.lastInvoice + 1;
        next();
      }
    } catch (error) {
      console.error(error);
      console.log('dataFiscal :>> ', req.body.dataFiscal);
      console.log('dataFiscal :>> ', req.body.dataFiscal.Iva);
      console.log('newFact :>> ', req.body.newFact);
      next(new Error('Faltan datos o hay datos erroneos, controlelo!'));
    }
  };
  return middleware;
};
