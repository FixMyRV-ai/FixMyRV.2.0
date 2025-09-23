import { Request as ExpressRequest, Response } from "express";
declare class ContentController {
    private oauth2Client;
    private isGoogleDriveConfigured;
    private SCOPES;
    private CREDENTIALS_FILE;
    private isGoogleDriveAvailable;
    constructor();
    private cleanContent;
    private processScrapedContent;
    scrape: (req: ExpressRequest, res: Response) => Promise<void>;
    private getRandomUserAgent;
    private extractPageContent;
    private extractMetadata;
    private extractImages;
    fileDelete(fileName: string): void;
    processDocumentAndGenerateVectorStore: (docs: any[], metadata: any, sourceInDB: any) => Promise<number>;
    private extractContentWithFastAPI;
    private generateDocumentsFromPDF;
    uploadPDF: (req: ExpressRequest, res: Response) => Promise<void>;
    getSources: (req: ExpressRequest, res: Response) => Promise<void>;
    deleteSource: (req: ExpressRequest, res: Response) => Promise<void>;
    bulkDeleteSources: (req: ExpressRequest, res: Response) => Promise<void>;
    authorizeGoogleDrive: (req: ExpressRequest, res: Response) => Promise<void>;
    getGoogleDriveFiles: (req: ExpressRequest, res: Response) => Promise<void>;
    uploadFromGoogleDrive: (req: ExpressRequest, res: Response) => Promise<void>;
    bulkUploadFromGoogleDrive: (req: ExpressRequest, res: Response) => Promise<void>;
}
declare const _default: ContentController;
export default _default;
//# sourceMappingURL=content.controller.d.ts.map