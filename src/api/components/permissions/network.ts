import { NextFunction, Request, Response, Router } from 'express';
import { success } from '../../../network/response';
import Controller from './index';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';
const router = Router();

//internal Functions
const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body)
        .then(() => {
            success({ res, req, status: 201, message: "Permisos creados!" })
        })
        .catch(next)
}

const get = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.get(req.body.user.id)
        .then((permisos: any) => {
            success({ req, res, message: permisos })
        })
        .catch(next)
}

const getOther = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.get2(Number(req.params.id))
        .then((permisos: any) => {
            success({ req, res, message: permisos })
        })
        .catch(next)
}

const getPermissions = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getPermissions()
        .then((permisos: any) => {
            success({ req, res, message: permisos })
        })
        .catch(next)
}

//Routes
router.post("/", secure(EPermissions.userAdmin), upsert);
router.put("/", secure(EPermissions.userAdmin), upsert);
router.get("/", secure(), get);
router.get("/list", secure(EPermissions.userAdmin), getPermissions);
router.get("/:id", secure(EPermissions.userAdmin), getOther)

export = router;