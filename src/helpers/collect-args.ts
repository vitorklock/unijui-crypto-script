import { Args } from "@/types";
import { makeAsk, makeRl } from "./readline";
import c from "chalk";
import fs from "node:fs";

interface ResolvedArgs {
    input: string;
    output: string;
    password: string;
}

export async function collectArgs(
    mode: "encrypt" | "decrypt",
    args: Args
): Promise<ResolvedArgs> {

    const rl = makeRl();
    const ask = makeAsk(rl);

    try {
        // 1. Input file path
        const inputPrompt =
            mode === "encrypt"
                ? "  📄 File to encrypt path: "
                : "  📄 Encrypted file path (.enc): ";

        const input = args.input ?? (await ask(c.yellow(inputPrompt)));

        if (!fs.existsSync(input)) {
            console.error(c.red(`\n  ❌ File not found: ${input}`));
            process.exit(1);
        }

        // 2. Password
        const passwordPrompt = `\n  🔑 Enter the ${mode}ion password: `;

        const password = args.password ?? (await ask(c.yellow(passwordPrompt)));
        if (!password) {
            console.error(c.red("\n  ❌ Password cannot be empty."));
            process.exit(1);
        }

        // // Confirm password on encrypt (interactive mode only)
        // if (mode === "encrypt" && !args.password) {
        //     const confirm = await ask(c.yellow("  🔑 Confirm password: "));
        //     if (password !== confirm) {
        //         console.error(c.red("\n  ❌ Passwords do not match."));
        //         process.exit(1);
        //     }
        // }

        // 3. Output file path
        const defaultOutput =
            mode === "encrypt"
                ? input + ".enc"
                : input.replace(/\.enc$/, "") || input + ".dec";

        const userOutput =
            args.output ?? (await ask(c.yellow(`\n  💾 Output path [${defaultOutput}]: `)));

        const output = userOutput || defaultOutput;

        return { input, output, password };
    } finally {
        rl.close();
    }
}