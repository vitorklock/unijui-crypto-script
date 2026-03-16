import { getAlgorithmInfo } from "@/libs";
import c from "chalk";

export function handleInfo() {
    const info = getAlgorithmInfo();
    console.log(c.dim("  Algorithm configuration:"));
    for (const [key, value] of Object.entries(info)) {
        console.log(c.dim(`    ${key}: ${value}`));
    }
}