import path from 'path';
import ejs from 'ejs';
import sendEmail from './sendmail';
import Colors from '../data/Colors.json';
import Links from '../data/Links.json';
import Names from '../data/Names.json';
import { formatMoney } from '../formatMoney';
import { DocTipos } from '..//facturacion/AfipClass';

export const sendInvoice = async (
    filePath: string,
    fileName: string,
    notaCredito: boolean,
    importe: number,
    email: string,
    formaPago: string,
    nombre?: string,
    tdocInt?: number,
    ndoc?: number,
): Promise<any> => {
    let tdoc = "DNI"

    if (tdocInt === DocTipos.CUIT) {
        tdoc = "CUIT"
    } else if (tdocInt === DocTipos.DNI) {
        tdoc = "DNI"
    } else {
        tdoc = 'Sin identificar'
    }

    let asunto = "Factura de compra realizada"

    const attachment = [{
        filename: fileName,
        path: filePath
    }]

    let informationList: Array<any> = []
    let parrafosHead: Array<any> = []

    let datos2 = {
        Colors,
        Links,
        Names,
        //Particular
        //Head
        titlePage: "Envío de Factura",
        titleHead: "Hola " + nombre || "",
        parrafosHead: parrafosHead,

        //InfoForm
        titleInfoForm: "Sus Datos de envío",
        informationList: informationList
    }


    if (notaCredito) {
        asunto = "Compra anulada - Nota de Crédito"
        informationList = [
            {
                col1: 6,
                title1: "Nombre completo",
                content1: nombre || "",
                col2: 6,
                title2: tdocInt === DocTipos['Sin identificar'] ? "" : tdoc || "",
                content2: tdocInt === DocTipos['Sin identificar'] ? "" : ndoc || ""
            },
            {
                col1: 12,
                title1: "Email",
                content1: email,
                col2: 6
            },
            {
                col1: 12,
                title1: "Aclaraciones",
                content1: "La factura que precede a la presente ha sido anulado a través de una nota de crédito. La misma se encuentrra adjunta al presente email."
            }
        ]
        parrafosHead = [
            "En el presente email le adjuntamos la nota de crédito de la cancelación de la compra."
        ]

        datos2 = {
            Colors,
            Links,
            Names,
            //Particular
            //Head
            titlePage: "Confirmar Email",
            titleHead: "Hola " + nombre || "",
            parrafosHead: parrafosHead,

            //InfoForm
            titleInfoForm: "Sus Datos",
            informationList: informationList
        }

    } else {
        asunto = "Factura de compra realizada"
        informationList = [
            {
                col1: 6,
                title1: "Nombre completo",
                content1: nombre || "",
                col2: 6,
                title2: "Total",
                content2: "$ " + formatMoney(importe)
            },
            {
                col1: 6,
                title1: tdocInt === DocTipos['Sin identificar'] ? "" : tdoc || "",
                content1: tdocInt === DocTipos['Sin identificar'] ? "" : ndoc || "",
                col2: 6,
                title2: "Forma de Pago",
                content2: formaPago
            },
            {
                col1: 12,
                title1: "Email",
                content1: email,
            }
        ]


        parrafosHead = [
            "En el presente email le adjuntamos la factura de su compra."
        ]

        datos2 = {
            Colors,
            Links,
            Names,
            //Particular
            //Head
            titlePage: "Confirmar Email",
            titleHead: "Hola " + nombre || "",
            parrafosHead: parrafosHead,

            //InfoForm
            titleInfoForm: "Sus Datos",
            informationList: informationList
        }
    }

    return new Promise((resolve, reject) => {
        ejs.renderFile(path.join("views", "emails", "Templates", "FactEmail.ejs"), datos2, async (err, data) => {
            if (err) {
                console.error(err);
                resolve(false);
            } else {
                try {
                    resolve(await sendEmail(email, asunto, data, attachment))
                } catch (error) {
                    console.error(error);
                    reject(error);
                }
            }
        })
    });
}