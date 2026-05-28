import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";

const DATA_DIR = `${process.cwd()}/data`;
const DATA_FILE = `${DATA_DIR}/cards.json`;

// Ensure data dir exists
try { Bun.spawnSync(["mkdir", "-p", DATA_DIR]); } catch {}

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const runningProcesses = new Map<string, import("bun").Subprocess>();
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log(
        "Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
      );
    }
  }
  return "views://mainview/index.html";
}
// No generic parameter — we'll cast rpc.send instead
const rpc = BrowserView.defineRPC({
  handlers: {
    requests: {
      async executeCommand({ id, command, cwd }: { id: string; command: string; cwd: string }) {
				const resolvedCwd = cwd || process.env.HOME || process.cwd();
        const proc = Bun.spawn(["bash", "-c", command], {
					cwd: resolvedCwd,
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env },
        });
        runningProcesses.set(id, proc);
        const readStream = async (
          stream: ReadableStream<Uint8Array>,
          type: "stdout" | "stderr",
        ) => {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = decoder.decode(value, { stream: true });
              if (text) {
                (rpc as any).send.commandOutput({ id, data: text, type });
              }
            }
          } finally {
            reader.releaseLock();
          }
        };
        await Promise.all([
          readStream(proc.stdout, "stdout"),
          readStream(proc.stderr, "stderr"),
        ]);
        const code = await proc.exited;
        runningProcesses.delete(id);
        (rpc as any).send.commandExit({ id, code });
        return { success: true };
      },
			async loadCards() {
				try {
					const file = Bun.file(DATA_FILE);
					const text = await file.text();
					return { cards: JSON.parse(text) };
				} catch {
					return { cards: [] };
				}
			},
			
			async saveCards({ cards }) {
				await Bun.write(DATA_FILE, JSON.stringify(cards, null, 2));
				return { success: true };
			},
      killCommand({ id }: { id: string }) {
        const proc = runningProcesses.get(id);
        if (proc) {
          proc.kill();
          runningProcesses.delete(id);
          return { success: true };
        }
        return { success: false };
      },
    },
  },
});

const url = await getMainViewUrl();
const mainWindow = new BrowserWindow({
  title: "Command Runner",
  transparent: true,
  url,
  rpc,
  frame: {
    width: 900,
    height: 700,
    x: 200,
    y: 200,
  },
});
