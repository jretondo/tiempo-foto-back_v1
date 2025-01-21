import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

interface IStockList {
  prod_name: string;
  sub_category: string;
  category: string;
  total: number;
  costoTotal: number;
}
export const createProdListStockPDF = async (
  stockProdList: Array<IStockList>,
) => {
  return new Promise(async (resolve, reject) => {
    function base64_encode(file: any) {
      // read binary data
      var bitmap: Buffer = fs.readFileSync(file);
      // convert binary data to base64 encoded string
      return Buffer.from(bitmap).toString('base64');
    }

    const estilo = fs.readFileSync(
      path.join('views', 'reports', 'cajaList', 'styles.css'),
      'utf8',
    );
    const logo = base64_encode(
      path.join('public', 'images', 'invoices', 'logo.png'),
    );

    const dateNow = new Date();

    const fileName = `prodList-${dateNow}.pdf`;
    const location = path.join('public', 'prod-list', fileName);

    const datos = {
      logo: 'data:image/png;base64,' + logo,
      style: '<style>' + estilo + '</style>',
      prodList: stockProdList,
    };

    await ejs.renderFile(
      path.join('views', 'reports', 'stockProdList', 'index.ejs'),
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
