import { App } from './app';
import { config } from '../config';

const main = () => {
    const app = new App(config.api.port);
    if (process.env.MACHINE === "LOCAL") {
        app.listenTest();
    } else {
        app.listenProd();
    }
}

main();