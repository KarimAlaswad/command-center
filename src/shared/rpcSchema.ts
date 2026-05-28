export type BunRequests = {
  executeCommand: {
    params: { id: string; command: string; cwd: string };
    response: { success: boolean };
  };
  killCommand: {
    params: { id: string };
    response: { success: boolean };
  };
  loadCards: {
    params: Record<string, never>;
    response: { cards: unknown[] };
  };
  saveCards: {
    params: { cards: unknown[] };
    response: { success: boolean };
  };
};
export type BunMessages = {
  commandOutput: { id: string; data: string; type: "stdout" | "stderr" };
  commandExit: { id: string; code: number };
};
