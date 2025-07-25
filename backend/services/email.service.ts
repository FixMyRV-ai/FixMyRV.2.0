import nodemailer, { TransportOptions } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    } as TransportOptions);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM_ADDRESS,
        to,
        subject,
        html,
      });
      console.log("Email sent successfully");
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new Error(`Error sending email: ${error.message}`);
    }
  }
}

export default EmailService.getInstance();
