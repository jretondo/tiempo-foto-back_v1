import path from 'path';
import ejs from 'ejs';
import sendEmail from './sendmail';
import Colors from '../data/Colors.json';
import Links from '../data/Links.json';
import Names from '../data/Names.json';
import { IEmailDendCode } from '../../interfaces/IEmails';

export const sendCode = async (
    total: string,
    descuentoPorcentaje: string,
    descuento: number,
    cliente: string,
    codigo: number,
    email: string,
    subject: string,
    view: boolean
): Promise<any> => {
    if (view) {

        return new Promise((resolve, reject) => {
            resolve(ejs.render(path.join("emails", "Templates", "ForgotPass.ejs")));
        })
    } else {
        const datos: IEmailDendCode = {
            Colors,
            Links,
            Names,
            titlePage: subject,
            titleHead: "Hola Florencia!",
            parrafosHead: ["Se solicitó un código para aplicar un descuento", `El cliente: ${cliente}`, `Total de la factura: $${total}`, `Descuento: ${descuentoPorcentaje}%`, `Total con descuento: $${descuento}`],
            titleButton: "Código de aprobación:",
            textCall: `${codigo}`,
            textFoother: `Útilice esta información para poder ingresar al sistema: <br> <a href='${Links[0].linkApp}' target='_blank'>Aplicación de Administración</a>. El sistema le va a pedir una nueva contraseña segura que usted recuerde.`
        };

        return new Promise((resolve, reject) => {
            ejs.renderFile(path.join("views", "emails", "Templates", "SendCode.ejs"), datos, async (err, data) => {
                if (err) {
                    console.error(err);
                    resolve(false);
                } else {
                    try {
                        resolve(await sendEmail(email, subject, data))
                    } catch (error) {
                        console.error(error);
                        reject(error);
                    }
                }
            })
        });
    }
}