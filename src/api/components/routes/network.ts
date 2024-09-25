import { NextFunction, Request, Response, Router } from 'express';
import { success } from '../../../network/response';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';
const router = Router();

const responseSuccess = (req: Request, res: Response, next: NextFunction) => {
    success({ req, res });
}

//Routes
router.get("/dashboard", secure(), responseSuccess)
    .get("/changePass", secure(), responseSuccess)
    .get("/clientes", secure(EPermissions.clientes), responseSuccess)
    .get("/productos", secure(EPermissions.productos), responseSuccess)
    .get("/proveedores", secure(EPermissions.proveedores), responseSuccess)
    .get("/ptosVta", secure(EPermissions.ptosVta), responseSuccess)
    .get("/stock", secure(EPermissions.ventas), responseSuccess)
    .get("/userAdmin", secure(EPermissions.userAdmin), responseSuccess)

export = router;