import { useEffect, useState } from "react";
import "./index.css";

export function App() {
  const [data, setData] = useState<[boolean, string][]>([]);

  useEffect(() => {
    const ws = new WebSocket("/ws");
    ws.onmessage = ev => {
      const d = JSON.parse(ev.data) as { type: "log" | "stream", message: string };
      if (d.type === "log") {
        setData(data => [...data, [false, d.message]]);
      } else {
        setData(data => {
          if (!data.at(-1)?.[0]) {
            return [...data, [true, d.message]];
          } else {
            const d2 = [...data];
            d2.at(-1)![1] += d.message;
            if (d.message === ".") {
              d2.push([true, ""]);
            }
            return d2;
          }
        });
      }
    }
    return () => ws.close();
  }, []);

  return (
    <div className="app">
      <h1>Agent watcher</h1>
      {
        data.map(([s, t], i) => s ? <span key={i} translate={i+1 === data.length ? "no" : "yes"}>{t}</span> : <p key={i}>{t}</p>)
      }
      <div className="white"></div>
    </div>
  );
}

export default App;
