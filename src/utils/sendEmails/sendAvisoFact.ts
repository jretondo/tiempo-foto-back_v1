import path from 'path';
import ejs from 'ejs';
import sendEmail from './sendmail';
import Colors from '../data/Colors.json';
import Links from '../data/Links.json';
import Names from '../data/Names.json';
import { formatMoney } from '../formatMoney';
import { DocTipos } from '../facturacion/AfipClass';
import { IUser } from 'interfaces/Itables';

export const sendAvisoFact = async (
    factura: string,
    notaCredito: boolean,
    importe: number,
    email: string,
    formaPago: string,
    user: IUser,
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

    let asunto = "Factura Disponible en el sistema - " + factura

    let informationList: Array<any> = []
    let parrafosHead: Array<any> = []

    let datos2 = {
        Colors,
        Links,
        Names,
        //Particular
        //Head
        titlePage: "Envío de Factura",
        titleHead: "Hola " + user.nombre + " " + user.apellido || "",
        parrafosHead: parrafosHead,

        //InfoForm
        titleInfoForm: "Los datos de la factura",
        informationList: informationList
    }


    if (notaCredito) {
        asunto = "Nota de Crédito Disponible en el sistema - " + factura
        informationList = [
            {
                col1: 6,
                title1: "Nombre completo",
                content1: nombre || "",
                col2: 6,
                title2: tdoc,
                content2: tdocInt === DocTipos['Sin identificar'] ? "" : ndoc || ""
            },
            {
                col1: 12,
                title1: "Nº Nota de Crédito",
                content1: factura,
            },
            {
                col1: 12,
                title1: "Aclaraciones",
                content1: "La factura que precede a la presente ha sido anulado a través de una nota de crédito. La misma se encuentrra adjunta al presente email."
            }
        ]
        parrafosHead = [
            "Le damos aviso que ya se encuentra disponible la Nota de Crédito en el sistema!"
        ]

        datos2 = {
            Colors,
            Links,
            Names,
            //Particular
            //Head
            titlePage: "Envío de Factura",
            titleHead: "Hola " + user.nombre + " " + user.apellido || "",
            parrafosHead: parrafosHead,

            //InfoForm
            titleInfoForm: "Los datos de la Nota de Crédito",
            informationList: informationList
        }

    } else {
        asunto = "Factura Disponible en el sistema - " + factura
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
                title1: tdoc,
                content1: tdocInt === DocTipos['Sin identificar'] ? "" : ndoc || "",
                col2: 6,
                title2: "Forma de Pago",
                content2: formaPago
            },
            {
                col1: 12,
                title1: "Nº Factura",
                content1: factura,
            }
        ]


        parrafosHead = [
            "Le damos aviso que ya se encuentra disponible la factura en el sistema!"
        ]

        datos2 = {
            Colors,
            Links,
            Names,
            //Particular
            //Head
            titlePage: "Envío de Factura",
            titleHead: "Hola " + user.nombre + " " + user.apellido || "",
            parrafosHead: parrafosHead,

            //InfoForm
            titleInfoForm: "Los datos de la factura",
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
                    resolve(await sendEmail(email, asunto, data))
                } catch (error) {
                    console.error(error);
                    reject(error);
                }
            }
        })
    });
}