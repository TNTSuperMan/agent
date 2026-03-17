import { Ollama, type Message } from "ollama";
import { wrap, type YieldData } from "./interface";
import { env } from "bun";
import { sys } from "./sys";

const client = new Ollama;

export const createChatCtx = () => {
    const history: Message[] = [];

    const ask = wrap(async function* (input: string, add_sys = ""): AsyncGenerator<YieldData, string> {
        history.push({
            role: "user",
            content: input,
        });
        yield { type: "log", message: "loading chat" };
        const chat = await client.chat({
            stream: true,
            model: env.OLLAMA_MODEL ?? "qwen3:1.7b",
            messages: [
                ...history,
                {
                    role: "system",
                    content: sys() + add_sys,
                }
            ],
        });
        yield { type: "log", message: "starting think" };
        let state: "think" | "cont" | "comp" = "think";
        let thinking = "";
        let content = "";
        try {
            for await (const stream of chat) {
                if (stream.message.thinking) {
                    thinking += stream.message.thinking;
                    yield { type: "stream", message: stream.message.thinking };
                } else {
                    if (state === "think") {
                        state = "cont";
                        yield { type: "log", message: "starting content" };
                    }
                    content += stream.message.content;
                    yield { type: "stream", message: stream.message.content }
                }
            }
            state = "comp";
        } finally {
            if (state !== "comp") {
                console.log("ABORT");
                chat.abort();
            }
        }
        history.push({
            role: "assistant",
            thinking,
            content,
        });
        return content;
    });

    return { ask };
}
