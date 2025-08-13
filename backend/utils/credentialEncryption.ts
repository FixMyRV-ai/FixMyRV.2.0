import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export class CredentialEncryption {
  /**
   * Encrypt sensitive data like API keys and tokens
   */
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    if (!text) return { encrypted: '', iv: '', tag: '' };
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    cipher.setAAD(Buffer.from('twilio-credentials', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    if (!encryptedData.encrypted) return '';
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAAD(Buffer.from('twilio-credentials', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Check if a value appears to be encrypted
   */
  static isEncrypted(value: string): boolean {
    try {
      return value.includes(':') && value.split(':').length === 3;
    } catch {
      return false;
    }
  }

  /**
   * Serialize encrypted data for database storage
   */
  static serialize(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    return `${encryptedData.encrypted}:${encryptedData.iv}:${encryptedData.tag}`;
  }

  /**
   * Deserialize encrypted data from database
   */
  static deserialize(serialized: string): { encrypted: string; iv: string; tag: string } {
    const parts = serialized.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    return {
      encrypted: parts[0],
      iv: parts[1],
      tag: parts[2]
    };
  }
}

/**
 * Environment variable helper for encryption key
 */
export function getEncryptionKey(): string {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  ENCRYPTION_KEY not set in environment. Using random key (data will not persist across restarts)');
    console.warn('💡 Add ENCRYPTION_KEY to your .env file for production use');
  }
  return ENCRYPTION_KEY;
}

export default CredentialEncryption;
