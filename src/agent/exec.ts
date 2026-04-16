import { sleep, spawn, type Subprocess } from "bun";
import { wrap, type YieldData } from "./interface";

type ExecuteResult =
  | {
      type: "timeout";
      task: Subprocess<Blob, "pipe", 1>;
    }
  | {
      type: "error";
      code: number;
      output: string;
    }
  | {
      type: "success";
      output: string;
    };

export const executeCommand = wrap(async function* (
  command: string,
): AsyncGenerator<YieldData, ExecuteResult> {
  yield { type: "log", message: `executing ${command}` };
  const task = spawn({
    cmd: ["bash"],
    stdin: new Blob([command]),
    stdout: "pipe",
    stderr: 1,
  });

  const code = await Promise.race([task.exited, sleep(10000)]);
  const output = await new Response(task.stdout).text();
  yield { type: "stream", message: output };
  if (code === undefined) {
    yield { type: "log", message: "timeout" };
    task.kill();
    return { type: "timeout", task };
  }
  yield { type: "log", message: `executed, exit code: ${code}` };
  if (code === 0) {
    return { type: "success", output };
  } else {
    return { type: "error", code, output };
  }
});
