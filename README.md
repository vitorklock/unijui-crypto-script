# Unijui Crypto Script — AES-256-GCM

Uses the AES (Advanced Encryption Standard) algorithm with a 256-bit key in GCM (Galois/Counter Mode), which provides both confidentiality and data authentication/integrity (AEAD).

## AEAD - Authenticated Encryption with Associated Data
> Galois/Counter Mode

### Counter Mode
Ciphers in streams, adding a counter (0, 1, 2...) to each chunk, combined with the IV.  
Each block is encrypted independently.

### Galois Authentication
"Hashes" a key over the whole file, if a single bit changed, an error is thrown.

## Usage

The output will always be a `.enc` text file.

Commands can be run with parameters such as -i (input) and -o (output).  
Or interactively, without inputs.

### Help menu

```bash
 $ npm run          # help
 $ npm run help     # help
```

### Encryption

```bash
 $ npm run encrypt  # Run encryption on interactive mode
 $ npm run encrypt -i ./lorem.txt  # Run with set input
 $ npm run encrypt -o ./lorem.txt.enc  # Run with set output
 $ npm run encrypt -i ./lorem.txt -o ./lorem.txt.enc  # Run with both
```

### Decryption

```bash
 $ npm run decrypt  # Run decryption on interactive mode
 $ npm run decrypt -i ./lorem.txt.enc  # Run with set input
 $ npm run decrypt -o ./lorem-decrypted.txt  # Run with set output
 $ npm run decrypt -i ./lorem.txt.enc -o ./lorem-decrypted.txt  # Run with both
```

## Implementation

Passwords are turned into a 256 character key by hashing it 100k times with a random salt.  

Encrypted file structure (base64-encoded):
  - Salt (16 bytes): used to derive the key from the password
  - IV (12 bytes): unique initialization vector per operation
  - Auth Tag (16 bytes): GCM authentication tag
  - Ciphertext (variable length)

```
[ Salt: 16 bytes ][ IV: 12 bytes ][ Auth Tag: 16 bytes ][ Ciphertext: variable ]
```