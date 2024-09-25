import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { IFactura } from 'interfaces/Itables';
import ControllerPtoVta from '../../../api/components/ptosVta';
import ControllerUsers from '../../../api/components/user';
import moment from 'moment';
import { formatMoney } from '../../../utils/formatMoney';
import { zfill } from '../../../utils/cerosIzq';
import puppeteer from 'puppeteer';

export const createListSellsPDF = async (
  userId: number,
  ptoVtaId: number,
  desde: string,
  hasta: string,
  totales: Array<{
    SUMA: number;
    forma_pago: number;
  }>,
  totales2: Array<{
    SUMA: number;
    tipo: number;
  }>,
  data: Array<IFactura>,
) => {
  return new Promise(async (resolve, reject) => {
    function base64_encode(file: any) {
      // read binary data
      var bitmap: Buffer = fs.readFileSync(file);
      // convert binary data to base64 encoded string
      return Buffer.from(bitmap).toString('base64');
    }

    const desdeStr = moment(desde, 'YYYY-MM-DD').format('DD/MM/YYYY');
    const hastaStr = moment(hasta, 'YYYY-MM-DD').format('DD/MM/YYYY');

    const estilo = fs.readFileSync(
      path.join('views', 'reports', 'cajaList', 'styles.css'),
      'utf8',
    );
    const logo = base64_encode(
      path.join('public', 'images', 'invoices', 'logo.png'),
    );

    const dataPV = await ControllerPtoVta.get(ptoVtaId);
    const dataUser = await ControllerUsers.getUser(userId);

    const fileName = `${dataPV[0].raz_soc} (${dataPV[0].cuit}) - ${dataUser[0].nombre} ${dataUser[0].apellido} desde ${desde} al ${hasta}.pdf`;
    const location = path.join('public', 'caja-lists', fileName);

    const totaleslista: Array<{
      tipoStr: string;
      totalStr: string;
    }> = [];

    const listaVtas: Array<{
      fecha: string;
      cliente: string;
      factura: string;
      formaPago: string;
      totalStr: string;
    }> = [];

    const metodos = [
      {
        typeNumber: 0,
        typeStr: 'Efectivo',
      },
      {
        typeNumber: 1,
        typeStr: 'Mercado Pago',
      },
      {
        typeNumber: 2,
        typeStr: 'Débito',
      },
      {
        typeNumber: 3,
        typeStr: 'Crédito',
      },
      {
        typeNumber: 4,
        typeStr: 'Cuenta Corriente',
      },
    ];

    metodos.map((metodo, key) => {
      const tot1Filtr1 = totales
        .filter(
          (total) => Number(total.forma_pago) === Number(metodo.typeNumber),
        )
        .filter((total) => total.forma_pago !== null);
      const tot1Filtr2 = totales2
        .filter((total) => Number(total.tipo) === Number(metodo.typeNumber))
        .filter((total) => total.tipo !== null);

      const totalTipo =
        (tot1Filtr1.length > 0 ? tot1Filtr1[0].SUMA : 0) +
        (tot1Filtr2.length > 0 ? tot1Filtr2[0].SUMA : 0);
      totaleslista.push({
        tipoStr: metodo.typeStr,
        totalStr: String(formatMoney(totalTipo)),
      });
    });

    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      const fecha =
        moment(current.create_time).format('DD/MM/YYYY HH:mm') + ' hs';
      const clienteName = current.raz_soc_cliente;
      let cliente = '';
      if (clienteName === '') {
        cliente = 'Consumidor Final';
      } else {
        cliente = `${clienteName} (${
          current.tipo_doc_cliente === 80 ? 'CUIT: ' : 'DNI: '
        } ${current.n_doc_cliente})`;
      }
      const factura = `${current.letra} ${zfill(current.pv, 5)} - ${zfill(
        current.cbte,
        8,
      )}`;
      let formaPagoStr = '';
      switch (current.forma_pago) {
        case 0:
          formaPagoStr = 'Efectivo';
          break;
        case 1:
          formaPagoStr = 'Mercado Pago';
          break;
        case 2:
          formaPagoStr = 'Débito';
          break;
        case 3:
          formaPagoStr = 'Crédito';
          break;
        case 4:
          formaPagoStr = 'Cuenta Corriente';
          break;
        case 5:
          formaPagoStr = 'Varios Metodos';
          break;
        default:
          formaPagoStr = 'Efectivo';
          break;
      }
      const importe = formatMoney(current.total_fact);

      listaVtas.push({
        fecha: fecha,
        cliente: cliente,
        factura: factura,
        formaPago: formaPagoStr,
        totalStr: importe || '0.00',
      });
    }
    const datos = {
      logo: 'data:image/png;base64,' + logo,
      style: '<style>' + estilo + '</style>',
      ptoVtaStr: `(P.V.: ${dataPV[0].pv}) ${dataPV[0].direccion}`,
      usuarioStr: `(Usuario: ${dataUser[0].usuario}) ${dataUser[0].nombre} ${dataUser[0].apellido}`,
      desdeStr: desdeStr,
      hastaStr: hastaStr,
      totaleslista: totaleslista,
      listaVtas: listaVtas,
    };

    await ejs.renderFile(
      path.join('views', 'reports', 'cajaList', 'index.ejs'),
      datos,
      async (err, data) => {
        if (err) {
          console.log('err', err);
          throw new Error('Algo salio mal');
        }

        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath:
            process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        });

        const page = await browser.newPage();
        await page.setContent(data, {
          waitUntil: 'networkidle0',
        });

        await page.pdf({
          path: location,
          format: 'A4',
          landscape: true,
          scale: 0.8,
          displayHeaderFooter: true,
          margin: {
            top: '0.5cm',
            bottom: '2cm',
          },
          footerTemplate:
            "<div style='font-size: 14px; text-align: center; width: 100%;'>Página&nbsp;<span class='pageNumber'></span>&nbsp;de&nbsp;<span class='totalPages'></span></div>",
          headerTemplate: '<div></div>',
        });
        await browser.close();

        const dataFact = {
          filePath: location,
          fileName: fileName,
        };

        return resolve(dataFact);
      },
    );
  });
};
