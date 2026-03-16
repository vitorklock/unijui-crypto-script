import readline from "node:readline";

export function makeRl(): readline.Interface {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

export function ask(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer: string) => resolve(answer.trim()));
    });
}

export function makeAsk(rl?: readline.Interface) {
    const _rl = rl || makeRl();
    return (question: string) => ask(_rl, question);
}
