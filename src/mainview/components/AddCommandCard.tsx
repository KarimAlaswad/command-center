import { useState } from "react";
type AddCommandCardProps = {
  onAdd: (card: { name: string; description: string; command: string; cwd: string; }) => void;
};
export default function AddCommandCard({ onAdd }: AddCommandCardProps) {
  const [open, setOpen] = useState(false);
  const [cwd, setCwd] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [command, setCommand] = useState("");
  function handleSubmit() {
    if (!name.trim()) return;
    onAdd({ name, description, command, cwd });
    setName("");
    setDescription("");
    setCommand("");
    setOpen(false);
  }
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-800/50 border-2 border-dashed border-gray-600 hover:border-gray-400 
                   rounded-lg w-80 flex flex-col items-center justify-center gap-2 
                   transition-colors min-h-[320px] cursor-pointer"
      >
        <span className="text-4xl text-gray-400">+</span>
        <span className="text-gray-400 text-sm">Add Card</span>
      </button>
    );
  }
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg w-80 flex flex-col border border-gray-700 p-4 gap-3">
      <input
        autoFocus
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-gray-700 text-white rounded px-2 py-1 text-sm placeholder-gray-500"
      />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-gray-700 text-white rounded px-2 py-1 text-sm placeholder-gray-500"
      />
      <textarea
        placeholder="Command (e.g. ls -la)"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        className="bg-gray-700 text-white rounded px-2 py-1 text-sm font-mono placeholder-gray-500 resize-none"
        rows={2}
      />
      <input
        placeholder="Working dir (default: home)"
        value={cwd}
        onChange={(e) => setCwd(e.target.value)}
        className="bg-gray-700 text-white rounded px-2 py-1 text-sm font-mono placeholder-gray-500"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded py-1 text-sm transition-colors"
        >
          Add
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded py-1 text-sm transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
