import { ensureDir, collectArgs, printPreview } from "@/helpers";
import { decrypt } from "@/libs";
import { Args } from "@/types";
import c from "chalk";
import fs from "node:fs";

export async function handleDecrypt(args: Args): Promise<void> {

    const { input, output, password } = await collectArgs('decrypt', args);

    if (!fs.existsSync(input)) {
        console.error(c.red(`\n  ❌ File not found: ${input}`));
        process.exit(1);
    }

    // Read encrypted content
    const encryptedContent = fs.readFileSync(input, "utf-8");
    console.log(
        c.dim(`\n  Encrypted file read: ${encryptedContent.length} characters (base64)`)
    );

    // Decrypt
    console.log(c.cyan("\n  ⏳ Decrypting..."));
    const startTime = performance.now();

    let decrypted: string = "";
    try {
        decrypted = decrypt(encryptedContent, password);
    } catch (err) {
        console.error(c.red(`\n  ❌ ${(err as Error).message}`));
        process.exit(1);
    }

    const elapsed = (performance.now() - startTime).toFixed(2);

    // Save decrypted file
    ensureDir(output);
    fs.writeFileSync(output, decrypted, "utf-8");

    // Result
    console.log(c.green("\n  ✅ File decrypted successfully!"));
    console.log(c.dim(`\n  Operation details:`));
    console.log(c.dim(`    Encrypted file:     ${input}`));
    console.log(c.dim(`    Decrypted file:     ${output}`));
    console.log(c.dim(`    Recovered size:     ${decrypted.length} characters`));
    console.log(c.dim(`    Execution time:     ${elapsed} ms`));

    const preview = decrypted.substring(0, 200);
    printPreview(preview);
}