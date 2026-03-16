import readline from "node:readline";
export function createRL() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}
export function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}
//# sourceMappingURL=readline.js.map