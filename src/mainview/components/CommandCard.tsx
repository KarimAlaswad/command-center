import { useState, useRef, useEffect } from "react";
import rpc  from "../rpc";

type OutputLine = { data: string; type: "stdout" | "stderr" };
type CommandCardProps = {
  id: string;
  name: string;
  description: string;
  command: string;
  cwd: string;
  defaultCwd: string;
  output: OutputLine[];
  isRunning: boolean;
  exitCode: number | null;
  onUpdate: (
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      command: string;
      cwd: string;
    }>,
  ) => void;
  onRun: (id: string) => void;
  onKill: (id: string) => void;
  onDelete: (id: string) => void;
};

type EditableField = "name" | "description" | "command" | "cwd" | null;
export default function CommandCard({
  id,
  name,
  description,
  command,
  cwd,
  defaultCwd,
  output,
  isRunning,
  exitCode,
  onUpdate,
  onRun,
  onKill,
  onDelete,
}: CommandCardProps) {
  const [editing, setEditing] = useState<EditableField>(null);
  const [editValue, setEditValue] = useState("");
  const [outputVisible, setOutputVisible] = useState(true);
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      requestAnimationFrame(() => {
        if (!outputRef.current) return;
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      });
    }
  }, [output]);

  function startEdit(field: EditableField, current: string) {
    setEditing(field);
    setEditValue(current);
  }
  function saveEdit() {
    if (editing) onUpdate(id, { [editing]: editValue });
    setEditing(null);
  }
  function handleDelete() {
    if (confirm(`Delete "${name}"?`)) onDelete(id);
  }

  function renderEditable(
    field: EditableField,
    value: string,
    className: string,
    multiline = false,
  ) {
    if (editing === field) {
      return multiline ? (
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) saveEdit();
          }}
          className={`w-full bg-gray-700 text-white rounded px-1 resize-none ${className}`}
          rows={2}
        />
      ) : (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
          }}
          className={`w-full bg-gray-700 text-white rounded px-1 ${className}`}
        />
      );
    }

    return (
      <span
        onDoubleClick={() => startEdit(field, value)}
        className={`cursor-pointer hover:bg-gray-700/50 rounded px-0.5 ${className}`}
      >
        {value}
      </span>
    );
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg w-80 flex flex-col border border-gray-700"
      tabIndex={0}
      onKeyDown={ e => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onRun(id);
      }}>
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b border-gray-700">
        <div className="flex-1 min-w-0 mr-2">
          {renderEditable("name", name, "text-lg font-semibold text-white")}
        </div>
        <div className="flex gap-1 shrink-0">
          {isRunning ? (
            <button
              onClick={() => onKill(id)}
              className="text-red-400 animate-pulse hover:text-red-300 text-lg"
              title="Kill"
            >
              ■
            </button>
          ) : (
            <button
              onClick={() => onRun(id)}
              className="text-green-400 hover:text-green-300 text-lg"
              title="Run"
            >
              ▶
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-400 text-lg"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
      {/* Description */}
      <div className="px-3 pt-2">
        {renderEditable("description", description, "text-sm text-gray-400")}
      </div>
      {/* Command */}
      <div className="px-3 pb-2 pt-1">
        <span className="text-xs text-green-400 font-mono">$ </span>
        {renderEditable(
          "command",
          command,
          "text-xs text-green-400 font-mono inline",
          true,
        )}
      </div>
      <div className="px-3 pb-1">
        <span className="text-xs text-gray-500">cwd: </span>
        {renderEditable("cwd", cwd || defaultCwd, "text-xs text-gray-400 font-mono")}
      </div>
      {/* Collapse toggle */}
      {output.length > 0 && (
        <button 
          onClick={() => setOutputVisible(v => !v)}
          className="px-3 text-xs text-gray-500 hover:text-gray-300 text-left"
        >
          {outputVisible ? "▼" : "▶"} Output
        </button>
      )}

      {/* Terminal Output */}
      {outputVisible && output.length > 0 && (
        <div className="px-3 pb-3 flex-1">
          <pre
            ref={outputRef}
            className="bg-gray-950 text-green-300 font-mono text-xs rounded p-2 min-h-40 overflow-y-auto whitespace-pre-wrap break-all resize-y"
          >
            {output.map((line, i) => (
              <span
                key={i}
                className={line.type === "stderr" ? "text-red-400" : ""}
              >
                {line.data}
              </span>
            ))}
          </pre>
        </div>
      )}

      {/* Exit code display */}
      {exitCode !== null && !outputVisible && (
        <div className="px-3 pb-2">
          <span className={exitCode === 0 ? "text-green-400" : "text-red-400"}>
            {exitCode === 0 ? "✓ Exited 0" : `✕ Exit ${exitCode}`}
          </span>
        </div>
      )}
      {isRunning && (
        <div className="px-3 pb-2 flex gap-1">
          <input
            placeholder="Type input and press Enter..."
            className="flex-1 bg-gray-950 text-green-300 font-mono text-xs rounded px-2 py-1 border border-gray-700 placeholder-gray-600 outline-none focus:border-green-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const input = e.currentTarget.value;
                if (input) {
                  (rpc as any).request.sendStdin({ id, data: input + "\n" });
                }
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
