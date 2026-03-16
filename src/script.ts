
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

import c from "chalk";
import { Args } from "./types";
import { handleDecrypt, handleEncrypt, handleHelp, handleInfo } from "./commands";

// PRINTS

function printBanner(): void {
    console.log();
    console.log(c.cyan("╔════════════════════════════════════════════════╗"));
    console.log(c.cyan("║") + c.bold("     🔐 Unijui Crypto Script — AES-256-GCM      ") + c.cyan("║"));
    console.log(c.cyan("╚════════════════════════════════════════════════╝"));
    console.log();
}

// PARSING ARGSprintHelp


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
            handleHelp();
            break;
    }
}

main().catch((err) => {
    console.error(c.red(`\n  ❌ Unexpected error: ${err.message}`));
    process.exit(1);
});