import { Request, Response } from "express";
declare class TransactionController {
    static getAllTransactions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getTransactionStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default TransactionController;
//# sourceMappingURL=transaction.controller.d.ts.map