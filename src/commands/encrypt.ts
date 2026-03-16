import { ensureDir, collectArgs, printPreview } from "@/helpers";
import { encrypt } from "@/libs";
import { Args } from "@/types";
import c from "chalk";
import fs from "node:fs";

export async function handleEncrypt(args: Args): Promise<void> {
    const { input, output, password } = await collectArgs('encrypt', args);

    // Read file contents
    const plaintext = fs.readFileSync(input, "utf-8");
    console.log(c.dim(`\n  File read: ${plaintext.length} characters`));

    // Encrypt
    console.log(c.cyan("\n  ⏳ Encrypting..."));
    const startTime = performance.now();
    const result = encrypt(plaintext, password);
    const elapsed = (performance.now() - startTime).toFixed(2);

    // Save encrypted file
    ensureDir(output);
    fs.writeFileSync(output, result.encrypted, "utf-8");

    // Result
    const encSize = Buffer.byteLength(result.encrypted, "utf-8");
    const origSize = Buffer.byteLength(plaintext, "utf-8");

    console.log(c.green("\n  ✅ File encrypted successfully!"));
    console.log(c.dim(`\n  Operation details:`));
    console.log(c.dim(`    Original file:      ${input} (${origSize} bytes)`));
    console.log(c.dim(`    Encrypted file:     ${output} (${encSize} bytes)`));
    console.log(c.dim(`    Salt (hex):         ${result.saltHex}`));
    console.log(c.dim(`    IV (hex):           ${result.ivHex}`));
    console.log(c.dim(`    Execution time:     ${elapsed} ms`));

    const preview = result.encrypted.substring(0, 80);
    printPreview(preview);
}