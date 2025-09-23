export declare class CredentialEncryption {
    /**
     * Encrypt sensitive data like API keys and tokens
     */
    static encrypt(text: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt sensitive data
     */
    static decrypt(encryptedData: {
        encrypted: string;
        iv: string;
        tag: string;
    }): string;
    /**
     * Check if a value appears to be encrypted
     */
    static isEncrypted(value: string): boolean;
    /**
     * Serialize encrypted data for database storage
     */
    static serialize(encryptedData: {
        encrypted: string;
        iv: string;
        tag: string;
    }): string;
    /**
     * Deserialize encrypted data from database
     */
    static deserialize(serialized: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
}
/**
 * Environment variable helper for encryption key
 */
export declare function getEncryptionKey(): string;
export default CredentialEncryption;
//# sourceMappingURL=credentialEncryption.d.ts.map