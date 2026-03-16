import c from "chalk"


export function printPreview(text: string) {
    console.log();
    console.log(c.dim("─────────────── Preview ───────────────"));
    console.log(c.dim(text) + '...');
    console.log(c.dim("────────────────────────────────────────"));
    console.log();
} 