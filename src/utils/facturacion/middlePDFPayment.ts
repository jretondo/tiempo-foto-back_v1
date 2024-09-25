import { NextFunction, Request, Response } from 'express';
import { INewPV } from 'interfaces/Irequests';
import { IFactura } from 'interfaces/Itables';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { zfill } from '../cerosIzq';
import { condFiscalIva } from './AfipClass';
import { formatMoney } from '../formatMoney';
import puppeteer from 'puppeteer';

export const paymentPDFMiddle = () => {
  const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const pvData: INewPV = req.body.pvData;
      const newFact: IFactura = req.body.newFact;

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
        case 0:
          formapagoStr = 'MERCADO PAGO';
          break;
        case 0:
          formapagoStr = 'DEBITO';
          break;
        case 0:
          formapagoStr = 'CREDITO';
          break;
        case 0:
          formapagoStr = 'CUENTA CORRIENTE';
          break;
        default:
          break;
      }

      const formaPago = {
        formaPago: formapagoStr,
      };

      const datos2 = {
        myCss: `<style>${myCss}</style>`,
        cbteAsoc,
        detalle: newFact.det_rbo,
        ...encabezado,
        ...ptoVta,
        ...cliente,
        ...totales,
        ...formaPago,
        ...footer,
      };

      const ejsPath = 'Recibo.ejs';

      ejs.renderFile(
        path.join('views', 'invoices', ejsPath),
        datos2,
        async (err, data) => {
          if (err) {
            console.log('err', err);
            throw new Error('Algo salio mal');
          }
          let options = {
            height: '16.5in', // allowed units: mm, cm, in, px
            width: '12in', //
            border: {
              right: '0.5cm',
              left: '0.5cm',
            },
          };

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

          await page.pdf({ path: filePath, ...options });

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
