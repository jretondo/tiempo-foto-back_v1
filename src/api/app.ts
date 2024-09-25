import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
});
import { errorTrhow } from '../network/errors';
import user from './components/user/network';
import auth from './components/auth/network';
import test from './components/test';
import permissions from './components/permissions/network';
import routesApp from './components/routes/network';
import ptosVta from './components/ptosVta/network';
import products from './components/products/network';
import proveedores from './components/proveedores/network';
import clientes from './components/clientes/network';
import stock from './components/stock/network';
import invoices from './components/invoices/network';

export class App {
  app: Application;
  constructor(private port: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
  }

  private settings() {
    this.app.set('port', this.port);
    this.app.set('views', path.join('views'));
    this.app.set('view engine', 'ejs');
  }

  private middlewares() {
    this.app.use(
      cors({
        exposedHeaders: ['Content-Disposition'],
      }),
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private routes() {
    this.app.use(
      '/static',
      express.static(path.join(__dirname, '..', '..', 'public')),
    );
    this.app.use('/api', test);
    this.app.use('/api/user', user);
    this.app.use('/api/auth', auth);
    this.app.use('/api/permissions', permissions);
    this.app.use('/api/routes', routesApp);
    this.app.use('/api/ptosVta', ptosVta);
    this.app.use('/api/products', products);
    this.app.use('/api/proveedores', proveedores);
    this.app.use('/api/clientes', clientes);
    this.app.use('/api/stock', stock);
    this.app.use('/api/invoices', invoices);
    this.app.use(errorTrhow);
  }

  listenTest(): void {
    this.app.listen(this.app.get('port'));
    console.log(`Conectado al puerto ${this.app.get('port')}`);
  }

  listenProd(): void {
    var options = {
      key: fs.readFileSync(
        path.join('/etc/letsencrypt/live/nekoadmin.com.ar-0001/privkey.pem'),
        'utf8',
      ),
      cert: fs.readFileSync(
        path.join('/etc/letsencrypt/live/nekoadmin.com.ar-0001/fullchain.pem'),
        'utf8',
      ),
    };
    https.createServer(options, this.app).listen(this.app.get('port'), () => {
      console.log(`Conectado al puerto ${this.app.get('port')}`);
    });
  }
}
