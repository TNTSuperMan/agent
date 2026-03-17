import { stdout } from "bun";
import { createInterface } from "readline/promises";
import { createChatCtx } from "./ollama";
//@ts-ignore
import { read } from "./read";
import type { YieldData } from "./interface";
import { notes } from "./note";
import { executeCommand } from "./exec";

export async function* main_gen(first: string): AsyncGenerator<YieldData> {
    const rl = createInterface(process.stdin, process.stdout);
    
    const ctx = createChatCtx();

    let ask_d = ctx.ask(first);

    while (true) {
        const [content, stream] = ask_d;
        yield* stream;
        let prompt = "";
        const ops = [...read(await content)];
        if (ops.length === 0) {
            console.log();
            const ans = await rl.question(`Please respond: `);
            prompt += ans;
            prompt += "\n\n";
        } else for (const op of ops) {
            switch (op.type) {
                case "note_get":
                    yield { type: "log", message: `get note: ${op.title}` };
                    const m = notes.get(op.title);
                    if (!m) {
                        prompt += `NOTE(${op.title}) is not found.`;
                    } else {
                        prompt += `NOTE(${op.title}) is here:\n\`\`\`${m}\n\`\`\``;
                    }
                    prompt += "\n\n";
                    break;
                case "note_set":
                    yield { type: "log", message: `set note: ${op.title}` };
                    notes.set(op.title, op.content);
                    break;
                case "bash":
                    stdout.write("\n");
                    const ans = await rl.question(`Do you allow the command?:\n\n${op.command}\n (y/N): `);
                    if (ans === "y") {
                        const [exec_resp, exec_stream] = executeCommand(op.command);
                        yield* exec_stream;
                        const exec_res = await exec_resp;
                        switch (exec_res.type) {
                            case "timeout":
                                prompt += `\`${op.command}\` has timed out after more than 10 seconds.`;
                                break;
                            case "error":
                                prompt += `\`${op.command}\` made an error. Exit code is ${exec_res.code}. Output is here:\n\`\`\`\n${exec_res.output}\n\`\`\``;
                                break;
                            case "success":
                                prompt += `\`${op.command}\` has been completed successfully.`;
                                if (exec_res.output.trim()) {
                                    prompt += ` Output is here:\n\`\`\`\n${exec_res.output}\n\`\`\``;
                                }
                                break;
                        }
                    } else {
                        prompt += `\`${op.command}\` is denied to execute by owner.`;
                    }
                    break;
            }
        }

        prompt += "Next action, please.";
        ask_d = ctx.ask(prompt);
    }
}

export async function main(publish: (content: string) => void) {
    for await (const data of main_gen("Check note and start action")) {
        publish(JSON.stringify(data));
    }
}
