import { file } from './../../../network/response';
import { Router, NextFunction, Response, Request } from 'express';
import { success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';
import uploadFile from '../../../utils/multer';
import { staticFolders } from '../../../enums/EStaticFiles';

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.params.page),
        String(req.query.query),
        Number(req.query.cantPerPage),
        Boolean(req.query.advanced),
        String(req.query.name),
        String(req.query.provider),
        String(req.query.brand)
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

const PDFList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.printPDF(
        String(req.query.query),
        Boolean(req.query.advanced),
        String(req.query.name),
        String(req.query.provider),
        String(req.query.brand)
    )
        .then((dataFact: any) => {
            file(req, res, dataFact.filePath, 'application/pdf', dataFact.fileName, dataFact);
        })
        .catch(next)
};

const varCost = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.varCost(
        Boolean(req.body.aumento),
        Number(req.body.porc),
        Number(req.body.round),
        Boolean(req.body.roundBool),
        Boolean(req.body.fixAmount),
        String(req.query.query),
        Boolean(req.query.advanced),
        String(req.query.name),
        String(req.query.provider),
        String(req.query.brand)
    )
        .then(() => {
            success({
                req,
                res
            });
        })
        .catch(next)
};

const updateList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.updateList(
        req.body.marcaUpdate,
        req.body.proveedorUpdate,
        req.body.costoUpdate,
        req.body.ventaUpdate,
        String(req.query.query),
        Boolean(req.query.advanced),
        String(req.query.name),
        String(req.query.provider),
        String(req.query.brand)
    )
        .then(() => {
            success({
                req,
                res
            });
        })
        .catch(next)
};

const aplicatePorcGan = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.aplicatePorcGan(
        Number(req.body.porc),
        String(req.query.query)
    )
        .then(() => {
            success({
                req,
                res
            });
        })
        .catch(next)
};

const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body, req.body.imagenEliminada)
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

const get = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.get(Number(req.params.id))
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

const getCategorys = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getCategory()
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

const getSubCategorys = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getSubCategory()
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

const updateCodBarras = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.asignarCodBarra(Number(req.params.id), req.body.codBarras)
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

const updateCost = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.updateCost(Number(req.params.id), req.body.cost)
        .then(data => {
            success({ req, res, message: data });
        })
        .catch(next);
}

router.get("/details/:id", secure(EPermissions.productos), get);
router.get("/getCat", secure(EPermissions.productos), getCategorys);
router.get("/pdf", secure(EPermissions.productos), PDFList);
router.get("/getGetSubCat", secure(EPermissions.productos), getSubCategorys);
router.get("/:page", secure(), list);
router.put("/updateList", secure(EPermissions.productos), updateList);
router.post("/varCost", secure(EPermissions.productos), varCost);
router.post("/changePorc", secure(EPermissions.productos), aplicatePorcGan);
router.put("/cost/:id", secure(EPermissions.productos), updateCost);
router.post("/", secure(EPermissions.productos), uploadFile(staticFolders.products, ["product"]), upsert);
router.put("/", secure(EPermissions.productos), uploadFile(staticFolders.products, ["product"]), upsert);
router.delete("/:id", secure(EPermissions.productos), remove);
router.put("/codBarra/:id", secure(EPermissions.productos), updateCodBarras)

export = router;