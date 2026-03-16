
export interface Args {
    command: "encrypt" | "decrypt" | "info" | "help";
    input?: string;
    output?: string;
    password?: string;
}