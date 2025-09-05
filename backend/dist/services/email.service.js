import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
        });
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    async sendEmail(to, subject, html) {
        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM_ADDRESS,
                to,
                subject,
                html,
            });
            console.log("Email sent successfully");
        }
        catch (error) {
            console.error("Error sending email:", error);
            throw new Error(`Error sending email: ${error.message}`);
        }
    }
}
export default EmailService.getInstance();
//# sourceMappingURL=email.service.js.map