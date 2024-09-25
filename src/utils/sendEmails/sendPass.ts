import path from 'path';
import ejs from 'ejs';
import sendEmail from './sendmail';
import Colors from '../data/Colors.json';
import Links from '../data/Links.json';
import Names from '../data/Names.json';
import { IEmailSendPass } from '../../interfaces/IEmails';

export const sendPass = async (
    user: string,
    newPass: string,
    email: string,
    subject: string,
    newUser: boolean,
    view: boolean
): Promise<any> => {
    if (view) {

        return new Promise((resolve, reject) => {
            resolve(ejs.render(path.join("emails", "Templates", "ForgotPass.ejs")));
        })
    } else {

        let welcome: Array<string>;
        if (newUser) {
            welcome = [`Usted es nuevo usuario del sistema de Administración de ${Names[0].productName}`];
        } else {
            welcome = [`¿Te olvidaste la contraseña? No te preocupes, a continuación te pasamos los nuevos datos de acceso a ${Names[0].productName}`];
        }

        const datos: IEmailSendPass = {
            Colors,
            Links,
            Names,
            titlePage: subject,
            titleHead: "Hola Retondo Javier",
            parrafosHead: welcome,
            titleButton: "A continuación le pasamos los datos de ingreso al mismo:",
            textCall: `Usuario: ${user}`,
            textCall2: `Contraseña: ${newPass}`,
            textFoother: `Útilice esta información para poder ingresar al sistema: <br> <a href='${Links[0].linkApp}' target='_blank'>Aplicación de Administración</a>. El sistema le va a pedir una nueva contraseña segura que usted recuerde.`
        };

        return new Promise((resolve, reject) => {
            ejs.renderFile(path.join("views", "emails", "Templates", "ForgotPass.ejs"), datos, async (err, data) => {
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