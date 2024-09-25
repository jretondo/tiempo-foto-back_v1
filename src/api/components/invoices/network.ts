import { Router, NextFunction, Response, Request } from 'express';
import { file, success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';
import factuMiddel from '../../../utils/facturacion/middleFactu';
import { fiscalMiddle } from '../../../utils/facturacion/middleFiscal';
import { invoicePDFMiddle } from '../../../utils/facturacion/middlePDFinvoice';
import { sendFactMiddle } from '../../../utils/facturacion/middleSendFact';
import dataFactMiddle from '../../../utils/facturacion/middleDataFact';
import devFactMiddle from '../../../utils/facturacion/middleDevFact';
import factuMiddelDevPart from '../../../utils/facturacion/middleFactuDevPart';

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.query.pvId),
        Number(req.query.fiscal),
        Number(req.query.cbte),
        Number(req.params.page),
        String(req.query.search),
        Number(req.query.cantPerPage)
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
};

const get = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.get(Number(req.params.id))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
};

const getLast = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.lastInvoice(Number(req.query.pvId), Boolean(req.query.fiscal), Number(req.query.tipo), Boolean(req.query.entorno))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
};

const newInvoice = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.newInvoice(req.body.pvData, req.body.newFact, req.body.dataFiscal, req.body.productsList, req.body.fileName, req.body.filePath, req.body.timer, req.body.user, req.body.variosPagos, next)
        .then((dataFact) => {
            file(req, res, dataFact.filePath, 'application/pdf', dataFact.fileName, dataFact);
        })
        .catch(next)
};

const getDataFactPDF = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.query.sendEmail) {
        success({ req, res })
    } else {
        Controller.getDataFact(req.body.fileName, req.body.filePath)
            .then(dataFact => {
                file(req, res, dataFact.filePath, 'application/pdf', dataFact.fileName, dataFact);
            })
            .catch(next)
    }
};

const getFiscalDataInvoice = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getFiscalDataInvoice(
        Number(req.query.ncbte),
        Number(req.query.pvId),
        Boolean(req.query.fiscal),
        Number(req.query.tipo),
        Boolean(req.query.entorno)
    )
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
};

const cajaList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.cajaList(
        false,
        Number(req.query.userId),
        Number(req.query.ptoVta),
        String(req.query.desde),
        String(req.query.hasta),
        Number(req.params.page),
        Number(req.query.cantPerPage)
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

const cajaListPDF = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.cajaList(
        true,
        Number(req.query.userId),
        Number(req.query.ptoVta),
        String(req.query.desde),
        String(req.query.hasta)
    )
        .then((dataFact) => {
            file(req, res, dataFact.filePath, 'application/pdf', dataFact.fileName, dataFact);
        })
        .catch(next)
};

const changePayType = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.changePayType(Number(req.params.id), req.body.idType)
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

const getDummy = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.dummyServers(
        String(req.query.certFile),
        String(req.query.keyFile),
        Number(req.query.cuit)).then(data => {
            success({ req, res, message: data });
        }).catch(next)
}

const timeoutProuf = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    setTimeout(() => {
        success({ req, res, message: "ok" })
    }, 5000);
}

const correctorNC = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.correctorNC().then(data => {
        success({ req, res, message: data });
    }).catch(next)
}

const detFact = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getDetFact(Number(req.params.id)).then(data => {
        success({ req, res, message: data });
    }).catch(next)
}

const generarCodDescuento = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.codigoVerificacionDescuento(req.body.total, req.body.descuentoPorcentaje, req.body.descuento, req.body.cliente).then(data => {
        success({ req, res, message: data });
    }).catch(next)
}

const verificaCodigoDescuento = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.verificaCodigo(req.body.codigo).then(data => {
        success({ req, res, message: data });
    }).catch(next)
}

router.get("/details/:id", secure(EPermissions.ventas), get)
    .get("/cajaList/:page", secure(EPermissions.ventas), cajaList)
    .get("/cajaListPDF", secure(EPermissions.ventas), cajaListPDF)
    .get("/factDataPDF/:id", secure(EPermissions.ventas), dataFactMiddle(), invoicePDFMiddle(), sendFactMiddle(), getDataFactPDF)
    .get("/last", secure(EPermissions.ventas), getLast)
    .get("/detFact/:id", secure(EPermissions.ventas), detFact)
    .get("/dummy", secure(EPermissions.ventas), getDummy)
    .get("/timeout", secure(EPermissions.ventas), timeoutProuf)
    .get("/afipData", secure(EPermissions.ventas), getFiscalDataInvoice)
    .get("/:page", secure(EPermissions.ventas), list)
    .post("/codigoDescuento", secure(EPermissions.ventas), generarCodDescuento)
    .post("/verificaCodigo", secure(EPermissions.ventas), verificaCodigoDescuento)
    .post("/notaCred", secure(EPermissions.ventas), devFactMiddle(), fiscalMiddle(), invoicePDFMiddle(), sendFactMiddle(), newInvoice)
    .post("/notaCredPart", secure(EPermissions.ventas), factuMiddelDevPart(), fiscalMiddle(), invoicePDFMiddle(), sendFactMiddle(), newInvoice)
    .post("/", secure(EPermissions.ventas), factuMiddel(), fiscalMiddle(), invoicePDFMiddle(), sendFactMiddle(), newInvoice)
    .delete("/:id", secure(EPermissions.ventas), remove)
    .put("/paytype/:id", secure(EPermissions.ventas), changePayType)

export = router;