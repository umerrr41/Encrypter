"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("Umer");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not sign in.");
      router.push("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not sign in.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <div>
        <label className="eyebrow mb-2 block" htmlFor="profile">Profile</label>
        <select className="login-field h-12 w-full border border-[var(--line-strong)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--green)]" id="profile" onChange={(event) => setUsername(event.target.value)} value={username}>
          <option value="ADMIN">ADMIN</option>
          <option value="Umer">Umer</option>
          <option value="Saim">Saim</option>
        </select>
      </div>
      <div>
        <label className="eyebrow mb-2 block" htmlFor="password">Password</label>
        <input autoComplete="current-password" className="login-field h-12 w-full border border-[var(--line-strong)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none placeholder:text-[#a7aaa0] focus:border-[var(--green)]" id="password" onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type="password" value={password} />
      </div>
      {error && <p aria-live="polite" className="text-[12px] font-medium text-[var(--orange-dark)]">{error}</p>}
      <button className="flex h-12 w-full items-center justify-between bg-[var(--green)] px-4 text-[13px] font-bold text-white transition hover:bg-[var(--green-dark)] disabled:cursor-wait disabled:opacity-60" disabled={working} type="submit">
        {working ? "Signing in..." : "Continue to Glyph"}<span aria-hidden="true">→</span>
      </button>
    </form>
  );
}