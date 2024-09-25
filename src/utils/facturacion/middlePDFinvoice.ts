import { NextFunction, Request, Response } from 'express';
import { INewPV } from 'interfaces/Irequests';
import { IDetFactura, IFactura } from 'interfaces/Itables';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import utf8 from 'utf8';
import base64 from 'base-64';
import ejs from 'ejs';
import { zfill } from '../cerosIzq';
import moment from 'moment';
import {
  CbteTipos,
  condFiscalIva,
  FactInscriptoProd,
  FactInscriptoServ,
  FactMonotribProd,
  FactMonotribServ,
} from './AfipClass';
import { formatMoney } from '../formatMoney';
import puppeteer from 'puppeteer';

export const invoicePDFMiddle = () => {
  const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const pvData: INewPV = req.body.pvData;
      const newFact: IFactura = req.body.newFact;
      const productsList: Array<IDetFactura> = req.body.productsList;
      const variosPagos = req.body.variosPagos;
      const dataFiscal:
        | FactInscriptoProd
        | FactInscriptoServ
        | FactMonotribProd
        | FactMonotribServ
        | any = req.body.dataFiscal;

      let urlQr = '';
      function base64_encode(file: any) {
        // read binary data
        var bitmap: Buffer = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return Buffer.from(bitmap).toString('base64');
      }
      const pvStr = zfill(newFact.pv, 5);
      const nroStr = zfill(newFact.cbte, 8);
      const logo64 = base64_encode(
        path.join('public', 'images', 'invoices', 'logo.png'),
      );
      let encabezado = {
        factNro: pvStr + '-' + nroStr,
        fechaFact: moment(newFact.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY'),
        letra: newFact.letra,
        codFact: 'NO VÁLIDO COMO COMPROBANTE FISCAL',
      };
      let cbteAsoc = false || '';

      let footer = {
        logo: 'data:image/png;base64,' + logo64,
        logoAfip1: '',
        logoAfip2: '',
        codQR: '',
        caeNro: '',
        caeVto: '',
        vendedor: newFact.seller_name || '',
      };

      if (newFact.fiscal) {
        const factData = {
          ver: 1,
          fecha: newFact.fecha,
          cuit: pvData.cuit,
          ptoVta: pvData.pv,
          tipoCmp: newFact.t_fact,
          nroCmp: newFact.cbte,
          importe: newFact.total_fact,
          moneda: 'PES',
          ctz: 0,
          tipoDocRec: newFact.tipo_doc_cliente,
          nroDocRec: newFact.n_doc_cliente,
          tipoCodAut: 'E',
          codAut: newFact.cae,
        };

        const factDataStr = JSON.stringify(factData);
        var text = factDataStr;
        var bytes = utf8.encode(text);
        var encoded = base64.encode(bytes);
        const paraAfip = 'https://www.afip.gob.ar/fe/qr/?p=' + encoded;

        const lAfip1 = base64_encode(
          path.join('public', 'images', 'invoices', 'AFIP1.png'),
        );
        const lAfip2 = base64_encode(
          path.join('public', 'images', 'invoices', 'AFIP2.png'),
        );

        urlQr = await new Promise((resolve, reject) => {
          QRCode.toDataURL(paraAfip, function (err, url) {
            if (err) {
              throw new Error('Algo salio mal');
            }
            resolve(url);
          });
        });
        encabezado = {
          factNro: pvStr + '-' + nroStr,
          fechaFact: moment(newFact.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY'),
          letra: newFact.letra,
          codFact: zfill(dataFiscal.CbteTipo, 2),
        };
        if (
          dataFiscal.CbteTipo === CbteTipos['Nota de Crédito A'] ||
          dataFiscal.CbteTipo === CbteTipos['Nota de Crédito B'] ||
          dataFiscal.CbteTipo === CbteTipos['Nota de Crédito C'] ||
          dataFiscal.CbteTipo === CbteTipos['Nota de Crédito M']
        ) {
          const cbteAsocObj = dataFiscal.CbtesAsoc.CbtesAsoc || [
            { PtoVta: 0 },
            { Nro: 0 },
          ];
          cbteAsoc =
            `${zfill(cbteAsocObj[0].PtoVta || 0, 5)} - ${zfill(
              cbteAsocObj[0].Nro || 0,
              8,
            )}` || '';
        }

        footer = {
          logo: 'data:image/png;base64,' + logo64,
          logoAfip1: 'data:image/png;base64,' + lAfip1,
          logoAfip2: 'data:image/png;base64,' + lAfip2,
          codQR: urlQr,
          caeNro: dataFiscal.CAE || '',
          caeVto: moment(dataFiscal.CAEFchVto, 'YYYY-MM-DD').format(
            'DD/MM/YYYY',
          ),
          vendedor: newFact.seller_name,
        };
      }

      const myCss = fs.readFileSync(
        path.join('public', 'css', 'style.css'),
        'utf8',
      );

      let condIvaStr = '';
      let condIvaStrCliente = '';

      if (pvData.cond_iva === condFiscalIva['IVA Responsable Inscripto']) {
        condIvaStr = 'IVA Responsable Inscripto';
      } else if (pvData.cond_iva === condFiscalIva['IVA Sujeto Exento']) {
        condIvaStr = 'IVA Sujeto Exento';
      } else if (pvData.cond_iva === condFiscalIva['Responsable Monotributo']) {
        condIvaStr = 'Responsable Monotributo';
      }

      if (
        newFact.cond_iva_cliente === condFiscalIva['IVA Responsable Inscripto']
      ) {
        condIvaStrCliente = 'IVA Responsable Inscripto';
      } else if (
        newFact.cond_iva_cliente === condFiscalIva['IVA Sujeto Exento']
      ) {
        condIvaStrCliente = 'IVA Sujeto Exento';
      } else if (
        newFact.cond_iva_cliente === condFiscalIva['Responsable Monotributo']
      ) {
        condIvaStrCliente = 'Responsable Monotributo';
      } else if (
        newFact.cond_iva_cliente === condFiscalIva['Consumidor Final']
      ) {
        condIvaStrCliente = 'Consumidor Final';
      }

      const ptoVta = {
        razSocOrigen: pvData.raz_soc,
        direccionOrigen: pvData.direccion,
        condIvaOrigen: condIvaStr,
        emailOrigen: pvData.email,
        cuitOrigen: pvData.cuit,
        iibbOrigen: pvData.iibb,
        iniAct: moment(pvData.ini_act, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      };
      const cliente = {
        clienteEmail: newFact.email_cliente || '',
        clienteName: newFact.raz_soc_cliente || 'Consumidor Final',
        clienteNro: newFact.n_doc_cliente || '',
        tipoDoc: newFact.tipo_doc_cliente === 80 ? 'CUIT' : 'DNI',
        condIvaCliente: condIvaStrCliente,
      };

      const totales = {
        subTotal: formatMoney(
          (newFact.total_neto < 0 ? -newFact.total_neto : newFact.total_neto) +
            (newFact.descuento < 0 ? -newFact.descuento : newFact.descuento),
        ),
        subTotalNoFiscal: formatMoney(
          (newFact.total_neto < 0 ? -newFact.total_neto : newFact.total_neto) +
            (newFact.total_iva < 0 ? -newFact.total_iva : newFact.total_iva) +
            (newFact.descuento < 0 ? -newFact.descuento : newFact.descuento),
        ),
        totalIva: formatMoney(
          newFact.total_iva < 0 ? -newFact.total_iva : newFact.total_iva,
        ),
        totalFact: formatMoney(
          newFact.total_fact < 0 ? -newFact.total_fact : newFact.total_fact,
        ),
        totalDesc: formatMoney(newFact.descuento),
      };
      let formapagoStr = '';
      switch (newFact.forma_pago) {
        case 0:
          formapagoStr = 'EFECTIVO';
          break;
        case 1:
          formapagoStr = 'MERCADO PAGO';
          break;
        case 2:
          formapagoStr = 'DEBITO';
          break;
        case 3:
          formapagoStr = 'CREDITO';
          break;
        case 4:
          formapagoStr = 'CUENTA CORRIENTE';
          break;
        default:
          formapagoStr = 'OTROS';
          break;
      }

      const formaPago = {
        string: formapagoStr,
        code: newFact.forma_pago,
      };
      const listaItems = productsList;

      const datos2 = {
        myCss: `<style>${myCss}</style>`,
        listaItems,
        cbteAsoc,
        formaPago,
        variosPagos,
        ...encabezado,
        ...ptoVta,
        ...cliente,
        ...totales,
        ...footer,
      };

      let ejsPath = 'Factura.ejs';
      if (!newFact.fiscal) {
        ejsPath = 'FacturaNoFiscal.ejs';
      }

      ejs.renderFile(
        path.join('views', 'invoices', ejsPath),
        datos2,
        async (err, data) => {
          if (err) {
            console.log('err', err);
            throw new Error('Algo salio mal');
          }

          const fileName = newFact.letra + ' ' + pvStr + '-' + nroStr + '.pdf';
          const filePath = path.join('public', 'invoices', fileName);
          req.body.fileName = fileName;
          req.body.filePath = filePath;
          req.body.formapagoStr = formapagoStr;

          const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath:
              process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
          });
          const page = await browser.newPage();
          await page.setContent(data, { waitUntil: 'networkidle0' });
          await page.pdf({
            path: filePath,
            format: 'A4',
            landscape: false,
            scale: 0.8,
            displayHeaderFooter: false,
            margin: {
              top: '0.5cm',
              bottom: '2cm',
            },
          });
          await browser.close();
          next();
        },
      );
    } catch (error) {
      console.error(error);
      next(new Error('Faltan datos o hay datos erroneos, controlelo!'));
    }
  };
  return middleware;
};
