import { Router, NextFunction, Response, Request } from 'express';
import { success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.query.idPv),
        Number(req.query.idProd)
    )
        .then((lista: any) => {
            success({
                req,
                res,
                status: 200,
                message: lista
            });
        })
        .catch(next)
};

const ultMov = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.ultimosMovStock(
        Number(req.query.idPv),
        Number(req.query.idProd)
    )
        .then((lista: any) => {
            success({
                req,
                res,
                status: 200,
                message: lista
            });
        })
        .catch(next)
};

const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body, req.body.user, true)
        .then(response => {
            if (response) {
                success({
                    req,
                    res,
                    message: response
                });
            } else {
                next(response);
            }
        })
        .catch(next)
}

const moverStock = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.moverStock(req.body, req.body.user)
        .then(response => {
            if (response) {
                success({
                    req,
                    res
                });
            } else {
                next(response);
            }
        })
        .catch(next)
}

const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.remove(Number(req.params.id))
        .then(() => {
            success({ req, res });
        })
        .catch(next)
}

const ultStockList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.ultStockList(
        String(req.query.desde),
        String(req.query.hasta),
        Number(req.query.prodId),
        Number(req.query.tipoMov),
        Number(req.query.pvId),
        Number(req.query.userId),
        String(req.query.cat),
        String(req.query.subcat),
        Number(req.params.page),
        Number(req.query.cantPerPage)
    )
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

const listaStock = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.listaStock(
        Boolean(req.query.desc),
        String(req.query.order),
        Number(req.query.prodId),
        Number(req.query.pvId),
        String(req.query.cat),
        String(req.query.subcat),
        Number(req.query.group),
        Number(req.params.page),
        Number(req.query.cantPerPage)
    )
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

const getStockProd = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getStockProd(
        Number(req.query.idProd),
        Number(req.query.pvId)
    )
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next)
}

router.get("/", secure(EPermissions.ventas), list);
router.get("/ultMov/", secure(EPermissions.ventas), ultMov);
router.get("/stockProd", secure(EPermissions.stock), getStockProd)
router.get("/ultStockList/:page", secure(EPermissions.stock), ultStockList)
router.get("/listaStock/:page", secure(EPermissions.stock), listaStock)
router.post("/", secure(EPermissions.ventas), upsert);
router.post("/moverStock", secure(EPermissions.ventas), moverStock);
router.delete("/:id", secure(EPermissions.ventas), remove);

export = router;