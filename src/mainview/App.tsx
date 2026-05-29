import { useState, useEffect } from "react";
import CommandCard from "./components/CommandCard";
import AddCommandCard from "./components/AddCommandCard";
import rpc from "./rpc";
type OutputLine = { data: string; type: "stdout" | "stderr" };
type CardData = {
  id: string;
  name: string;
  description: string;
  command: string;
  cwd: string;
  output: OutputLine[];
  isRunning: boolean;
  exitCode: number | null;
};

export default function App() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [defaultCwd, setDefaultCwd] = useState("");
  // Listen for streaming output and exit from Bun
  useEffect(() => {
    const onOutput = (payload: {
      id: string;
      data: string;
      type: "stdout" | "stderr";
    }) => {
      const lines = payload.data.split("\n");
      if (lines[lines.length -1] === "") lines.pop();
      setCards((prev) =>
        prev.map((c) =>
          c.id === payload.id
            ? {
                ...c,
                output: [
                  ...c.output,
                  ...lines.map((line) => ({
                    data: line,
                    type: payload.type,
                  })),
                ],
              }
            : c,
          ),
        );
    };

    const onExit = (payload: { id: string; code: number }) => {
      setCards((prev) =>
        prev.map((c) => (c.id === payload.id ? { ...c, isRunning: false, exitCode: payload.code } : c)),
      );
    };
    rpc.addMessageListener("commandOutput", onOutput);
    rpc.addMessageListener("commandExit", onExit);
    return () => {
      rpc.removeMessageListener("commandOutput", onOutput);
      rpc.removeMessageListener("commandExit", onExit);
    };
  }, []);

  useEffect(() => {
    (rpc as any).request.getDefaultCwd().then((result: { cwd: string }) => {
      if (result.cwd) setDefaultCwd(result.cwd);
    });
  }, []);

  useEffect(() => {
    (rpc as any).request.loadCards().then((result: { cards: CardData[] }) => {
      if (result.cards?.length) setCards(result.cards);
    });
  }, []);

  useEffect(() => {
    if (cards.length === 0) return;
    const timer = setTimeout(() => {
      (rpc as any).request.saveCards({ cards });
    }, 500);
    return () => clearTimeout(timer);
  }, [cards]);

  function handleAdd(card: {
    name: string;
    description: string;
    command: string;
    cwd: string;
  }) {
    setCards((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: card.name,
        description: card.description,
        command: card.command,
        cwd: card.cwd,
        output: [],
        isRunning: false,
        exitCode: null,
      },
    ]);
  }
  function handleUpdate(
    id: string,
    updates: Partial<Pick<CardData, "name" | "description" | "command" | "cwd">>,
  ) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }
  function handleRun(id: string) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isRunning: true, output: [], exitCode: null } : c,
      ),
    );
    (rpc as any).request.executeCommand({ id, command: card.command, cwd: card.cwd });
  }
  function handleKill(id: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isRunning: false } : c)),
    );
    (rpc as any).request.killCommand({ id });
  }
  function handleDelete(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Command Runner</h1>
      <div className="flex flex-wrap gap-4 items-start">
        {cards.map((card) => (
          <CommandCard
            key={card.id}
            {...card}
            defaultCwd={defaultCwd}
            onUpdate={handleUpdate}
            onRun={handleRun}
            onKill={handleKill}
            onDelete={handleDelete}
          />
        ))}
        <AddCommandCard onAdd={handleAdd} />
      </div>
    </div>
  );
}
