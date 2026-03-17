type Req =
    | { type: "note_get", title: string }
    | { type: "note_set", title: string, content: string }
    | { type: "bash", command: string }

const note_get = /{NOTE\(([a-zA-Z\x20]+)\)}/;
const note_set = /```note:([a-zA-Z\x20]+)\n(?:(.*)\n)?```/;
const bash = /```bash\n(.*)\n```/;
const all = new RegExp([note_get,note_set,bash].map(e=>`(?:${e.source})`).join("|"), "g");

export function* read(output: string): Generator<Req> {
    for (const [str] of output.matchAll(all)) {
        let reg: RegExpExecArray | null = null;
        if (reg = note_get.exec(str)) {
            yield { type: "note_get", title: reg[1]! };
        } else if (reg = note_set.exec(str)) {
            yield { type: "note_set", title: reg[1]!, content: reg[2]! };
        } else if (reg = bash.exec(str)) {
            yield { type: "bash", command: reg[1]! };
        } else {
            // unreachable
        }
    }
}
