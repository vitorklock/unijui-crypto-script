
/**
 * CLI — Text File Encryption
 *
 * Usage:
 *   npm run                → help menu
 *   npm run encrypt start  → interactive encryption mode
 *   npm run decrypt        → interactive decryption mode
 *   npm run encrypt -i <file> -p <password> [-o <output>]
 *   npm run decrypt -i <file> -p <password> [-o <output>]
 */

import fs from "node:fs";
import c from "chalk";
import { encrypt, decrypt, getAlgorithmInfo } from "./libs";
import { ask, createRL, ensureDir } from "./helpers";
import { Args } from "./types";
import { handleEncrypt } from "./commands";

// PRINTS

function printBanner(): void {
    console.log();
    console.log(c.cyan("╔════════════════════════════════════════════════════╗"));
    console.log(c.cyan("║") + c.bold("   🔐 Crypto Script — Criptografia AES-256-GCM      ") + c.cyan("║"));
    console.log(c.cyan("╚════════════════════════════════════════════════════╝"));
    console.log();
}


function printAlgorithmInfo(): void {
    const info = getAlgorithmInfo();
    console.log(c.dim("  Algorithm configuration:"));
    for (const [key, value] of Object.entries(info)) {
        console.log(c.dim(`    ${key}: ${value}`));
    }
    console.log();
}

// PARSING ARGS


function parseArgs(): Args {
    const argv = process.argv.slice(2);
    const command = (argv[0] ?? "help") as Args["command"];

    if (!["encrypt", "decrypt", "info", "help"].includes(command)) {
        return { command: "help" };
    }

    const args: Args = { command: command as Args["command"] };

    for (let i = 1; i < argv.length; i++) {
        switch (argv[i]) {
            case "-i":
            case "--input":
                args.input = argv[++i];
                break;
            case "-o":
            case "--output":
                args.output = argv[++i];
                break;
            case "-p":
            case "--password":
                args.password = argv[++i];
                break;
        }
    }

    return args;
}

// ── Command: Encrypt ────────────────────────────────────────────────────────



// ── Command: Decrypt ────────────────────────────────────────────────────────

async function handleDecrypt(args: Args): Promise<void> {
    const rl = createRL();

    try {
        // Get encrypted file path
        const inputPath =
            args.input ?? (await ask(rl, c.yellow("  📄 Path to the encrypted file (.enc): ")));

        if (!fs.existsSync(inputPath)) {
            console.error(c.red(`\n  ❌ File not found: ${inputPath}`));
            process.exit(1);
        }

        // Read encrypted content
        const encryptedContent = fs.readFileSync(inputPath, "utf-8");
        console.log(
            c.dim(`\n  Encrypted file read: ${encryptedContent.length} characters (base64)`)
        );

        // Get password
        const password =
            args.password ?? (await ask(rl, c.yellow("\n  🔑 Enter the decryption password: ")));

        if (!password) {
            console.error(c.red("\n  ❌ Password cannot be empty."));
            process.exit(1);
        }

        // Set output path
        const defaultOutput = inputPath.replace(/\.enc$/, "") || inputPath + ".dec";
        const userOutput =
            args.output ?? (await ask(rl, c.yellow(`\n  💾 Output path [${defaultOutput}]: `)));
        const outputPath = userOutput || defaultOutput;

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
        ensureDir(outputPath);
        fs.writeFileSync(outputPath, decrypted, "utf-8");

        // Result
        console.log(c.green("\n  ✅ File decrypted successfully!"));
        console.log(c.dim(`\n  Operation details:`));
        console.log(c.dim(`    Encrypted file:     ${inputPath}`));
        console.log(c.dim(`    Decrypted file:     ${outputPath}`));
        console.log(c.dim(`    Recovered size:     ${decrypted.length} characters`));
        console.log(c.dim(`    Execution time:     ${elapsed} ms`));

        // Show recovered content preview
        const preview = decrypted.substring(0, 200);
        console.log(c.dim(`    Preview:            "${preview}${decrypted.length > 200 ? "..." : ""}"`));
        console.log();
    } finally {
        rl.close();
    }
}

// ── Command: Info ───────────────────────────────────────────────────────────

function handleInfo(): void {
    printAlgorithmInfo();
}

// ── Command: Help ───────────────────────────────────────────────────────────

function printHelp(): void {
    console.log(c.bold("  Usage:"));
    console.log(`    tsx src/script.ts ${c.green("<command>")} [options]`);
    console.log();
    console.log(c.bold("  Commands:"));
    console.log(`    ${c.green("encrypt")}    Encrypt a text file`);
    console.log(`    ${c.green("decrypt")}    Decrypt an encrypted file`);
    console.log(`    ${c.green("info")}       Show algorithm information`);
    console.log(`    ${c.green("help")}       Show this help message`);
    console.log();
    console.log(c.bold("  Options:"));
    console.log(`    ${c.yellow("-i, --input")}      Input file path`);
    console.log(`    ${c.yellow("-o, --output")}     Output file path`);
    console.log(`    ${c.yellow("-p, --password")}   Encryption/decryption password`);
    console.log();
    console.log(c.bold("  Examples:"));
    console.log(c.dim("    # Interactive mode"));
    console.log(`    tsx src/script.ts encrypt`);
    console.log(`    tsx src/script.ts decrypt`);
    console.log();
    console.log(c.dim("    # With arguments"));
    console.log(`    tsx src/script.ts encrypt -i document.txt -p mypassword123`);
    console.log(`    tsx src/script.ts decrypt -i document.txt.enc -p mypassword123`);
    console.log();
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    printBanner();

    const args = parseArgs();

    switch (args.command) {
        case "encrypt":
            await handleEncrypt(args);
            break;
        case "decrypt":
            await handleDecrypt(args);
            break;
        case "info":
            handleInfo();
            break;
        case "help":
        default:
            printHelp();
            break;
    }
}

main().catch((err) => {
    console.error(c.red(`\n  ❌ Unexpected error: ${err.message}`));
    process.exit(1);
});