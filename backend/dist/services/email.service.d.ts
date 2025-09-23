declare class EmailService {
    private static instance;
    private transporter;
    private constructor();
    static getInstance(): EmailService;
    sendEmail(to: string, subject: string, html: string): Promise<void>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=email.service.d.ts.map