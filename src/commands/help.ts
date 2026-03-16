
import c from "chalk";

export function handleHelp(): void {
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