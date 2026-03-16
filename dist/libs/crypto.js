/**
 * Cryptography Module — AES-256-GCM
 *
 * Uses the AES (Advanced Encryption Standard) algorithm with a 256-bit key
 * in GCM (Galois/Counter Mode), which provides both confidentiality and
 * data authentication/integrity (AEAD).
 *
 * Passwords are turned into a 256 character key by hashing it 100k times with a random salt
 *
 * Encrypted file structure (base64-encoded):
 *   - Salt (16 bytes): used to derive the key from the password
 *   - IV (12 bytes): unique initialization vector per operation
 *   - Auth Tag (16 bytes): GCM authentication tag
 *   - Ciphertext (variable length)
 *
 * [ Salt: 16 bytes ][ IV: 12 bytes ][ Auth Tag: 16 bytes ][ Ciphertext: variable ]
 */
import crypto from "node:crypto";
// CONSTANTS
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits 
const SALT_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100_000; // iterations for key derivation
const PBKDF2_DIGEST = "sha512";
// DERIVE KEY
/**
 * Derives a 256-bit cryptographic key from a password
 * using PBKDF2 (Password-Based Key Derivation Function 2).
 *
 * The salt ensures the same password produces different keys each time.
 */
export function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}
/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * Flow:
 * 1. Generate a random salt
 * 2. Derive the key from password + salt (PBKDF2)
 * 3. Generate a random IV (Initialization Vector)
 * 4. Encrypt the text with AES-256-GCM
 * 5. Concatenate salt + iv + authTag + ciphertext
 */
export function encrypt(plaintext, password) {
    // 1. Generate random salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    // 2. Derive key from password
    const key = deriveKey(password, salt);
    // 3. Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    // 4. Encrypt with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    const encryptedData = Buffer.concat([
        cipher.update(plaintext, "utf-8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // 5. Concatenate: salt | iv | authTag | ciphertext
    const combined = Buffer.concat([salt, iv, authTag, encryptedData]);
    return {
        encrypted: combined.toString("base64"),
        saltHex: salt.toString("hex"),
        ivHex: iv.toString("hex"),
    };
}
//  DECRYPT
/**
 * Decrypts a base64-encoded ciphertext using AES-256-GCM.
 *
 * Flow:
 * 1. Decode the base64 string
 * 2. Extract salt, IV, authTag, and ciphertext
 * 3. Derive the key from password + salt
 * 4. Decrypt and verify authenticity with the authTag
 * 5. Return the original plaintext
 *
 * Throws an error if the password is incorrect or data has been tampered with.
 */
export function decrypt(encryptedBase64, password) {
    // 1. Decode base64
    const combined = Buffer.from(encryptedBase64, "base64");
    // Validate minimum size
    const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
    if (combined.length < minLength) {
        throw new Error("Invalid encrypted data: insufficient length. " +
            "The file may be corrupted.");
    }
    // 2. Extract components
    let offset = 0;
    const salt = combined.subarray(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    const iv = combined.subarray(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    const authTag = combined.subarray(offset, offset + AUTH_TAG_LENGTH);
    offset += AUTH_TAG_LENGTH;
    const encryptedData = combined.subarray(offset);
    // 3. Derive key
    const key = deriveKey(password, salt);
    // 4. Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    try {
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ]);
        // 5. Return original plaintext
        return decrypted.toString("utf-8");
    }
    catch {
        throw new Error("Decryption failed. Possible causes:\n" +
            "  • Wrong password\n" +
            "  • Encrypted file has been tampered with or corrupted\n" +
            "  • The file was not encrypted by this program");
    }
}
//  Utilities ─
export function generateRandomPassword(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
}
export function getAlgorithmInfo() {
    return {
        algorithm: ALGORITHM,
        keySize: `${KEY_LENGTH * 8} bits`,
        ivSize: `${IV_LENGTH * 8} bits`,
        saltSize: `${SALT_LENGTH * 8} bits`,
        keyDerivation: "PBKDF2",
        pbkdf2Iterations: PBKDF2_ITERATIONS,
        pbkdf2Digest: PBKDF2_DIGEST,
        authTagSize: `${AUTH_TAG_LENGTH * 8} bits`,
    };
}
//# sourceMappingURL=crypto.js.map