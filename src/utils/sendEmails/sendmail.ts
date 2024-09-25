import nodemailer from 'nodemailer';
import { config } from '../../config';

const sendEmail = async (recepter: string, subject: string, msg: string, attachment?: Array<{ filename: string | undefined, path: string | undefined }>) => {
    const tranporter = nodemailer.createTransport({
        host: config.sendmail.host,
        port: config.sendmail.port,
        secure: config.sendmail.secure,
        auth: {
            user: config.sendmail.auth.user,
            pass: config.sendmail.auth.pass
        }
    })
    if (attachment) {
        return await tranporter.sendMail({
            from: config.sendmail.from,
            to: recepter,
            subject: subject,
            attachments: attachment,
            html: msg
        })
    } else {
        return await tranporter.sendMail({
            from: config.sendmail.from,
            to: recepter,
            subject: subject,
            html: msg
        })
    }
}

export = sendEmail
