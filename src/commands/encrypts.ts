import { ask, makeRl, ensureDir } from "@/helpers";
import { encrypt } from "@/libs";
import { Args } from "@/types";
import c from "chalk";
import fs from "node:fs";

export async function handleEncrypt(args: Args): Promise<void> {
    const rl = makeRl();

    try {
        // Get file path
        const inputPath =
            args.input ?? (await ask(rl, c.yellow("  📄 Input file path: ")));

        if (!fs.existsSync(inputPath)) {
            console.error(c.red(`\n  ❌ File not found: ${inputPath}`));
            process.exit(1);
        }

        // Read file contents
        const plaintext = fs.readFileSync(inputPath, "utf-8");
        console.log(c.dim(`\n  File read: ${plaintext.length} characters`));

        // Show content preview
        const preview = plaintext.substring(0, 200);
        console.log(c.dim(`  Preview: "${preview}${plaintext.length > 200 ? "..." : ""}"`));

        // Get password
        const password =
            args.password ?? (await ask(rl, c.yellow("\n  🔑 Enter the encryption password: ")));

        if (!password) {
            console.error(c.red("\n  ❌ Password cannot be empty."));
            process.exit(1);
        }

        // Confirm password (interactive mode only)
        if (!args.password) {
            const confirm = await ask(rl, c.yellow("  🔑 Confirm password: "));
            if (password !== confirm) {
                console.error(c.red("\n  ❌ Passwords do not match."));
                process.exit(1);
            }
        }

        // Set output path
        const defaultOutput = inputPath + ".enc";
        const userOutput =
            args.output ?? (await ask(rl, c.yellow(`\n  💾 Output path [${c.dim(defaultOutput)}]: `)));
        const outputPath = userOutput || defaultOutput;

        // Encrypt
        console.log(c.cyan("\n  ⏳ Encrypting..."));
        const startTime = performance.now();
        const result = encrypt(plaintext, password);
        const elapsed = (performance.now() - startTime).toFixed(2);

        // Save encrypted file
        ensureDir(outputPath);
        fs.writeFileSync(outputPath, result.encrypted, "utf-8");

        // Result
        const encSize = Buffer.byteLength(result.encrypted, "utf-8");
        const origSize = Buffer.byteLength(plaintext, "utf-8");

        console.log(c.green("\n  ✅ File encrypted successfully!"));
        console.log(c.dim(`\n  Operation details:`));
        console.log(c.dim(`    Original file:      ${inputPath} (${origSize} bytes)`));
        console.log(c.dim(`    Encrypted file:     ${outputPath} (${encSize} bytes)`));
        console.log(c.dim(`    Salt (hex):         ${result.saltHex}`));
        console.log(c.dim(`    IV (hex):           ${result.ivHex}`));
        console.log(c.dim(`    Execution time:     ${elapsed} ms`));

        // Show encrypted content preview
        const encPreview = result.encrypted.substring(0, 80);
        console.log(c.dim(`    Encrypted preview:  ${encPreview}...`));
        console.log();
    } finally {
        rl.close();
    }
}