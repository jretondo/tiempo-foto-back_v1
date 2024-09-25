import { error } from './response';
import { ErrorRequestHandler } from 'express';

export const errorTrhow: ErrorRequestHandler = (err, req, res, next) => {
    console.error('[error]', err);
    const message = 'Error interno';
    const status = 500;
    error({
        req: req,
        res: res,
        status: status,
        message: message
    });
}