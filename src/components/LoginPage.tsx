import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { getDemoCredentials } from "../data/users";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!login(username, password)) {
      setError("Ungültige Zugangsdaten.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a3352] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <h1 className="text-2xl font-semibold">Kennzahlensystem</h1>
          <p className="text-white/80">Schulische Bildung NRW</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
          <div>
            <label className="mb-1 block text-sm text-slate-600" htmlFor="username">
              Benutzername
            </label>
            <input
              id="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#2d5a8e] py-2.5 text-sm font-medium text-white hover:bg-[#1a3352]"
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="w-full text-xs text-[#2d5a8e] hover:underline"
          >
            {showHelp ? "Demo-Zugänge ausblenden" : "Demo-Zugänge anzeigen"}
          </button>
          {showHelp && (
            <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {getDemoCredentials().map((c) => (
                <div key={c.username}>
                  <strong>{c.role}:</strong> {c.username} / {c.password}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
