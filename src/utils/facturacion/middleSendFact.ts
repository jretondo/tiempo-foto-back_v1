import { NextFunction, Request, Response } from "express"
import { IFactura } from "interfaces/Itables"
import { sendInvoice } from "../sendEmails/sendInvoice"

export const sendFactMiddle = () => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const newFact: IFactura = req.body.newFact
            if (req.query.sendEmail) {
                sendInvoice(
                    String(req.body.filePath),
                    String(req.body.fileName),
                    newFact.nota_cred,
                    newFact.total_fact,
                    String(req.query.email),
                    req.body.formapagoStr,
                    newFact.raz_soc_cliente,
                    newFact.tipo_doc_cliente,
                    newFact.n_doc_cliente
                )
                next()
            } else {

                if (newFact.email_cliente !== "") {
                    sendInvoice(
                        String(req.body.filePath),
                        String(req.body.fileName),
                        newFact.nota_cred,
                        newFact.total_fact,
                        newFact.email_cliente,
                        req.body.formapagoStr,
                        newFact.raz_soc_cliente,
                        newFact.tipo_doc_cliente,
                        newFact.n_doc_cliente
                    )
                    next()
                } else {
                    next()
                }
            }
        } catch (error) {
            console.error(error)
            next(new Error("Faltan datos o hay datos erroneos, controlelo!"))
        }
    }
    return middleware
}