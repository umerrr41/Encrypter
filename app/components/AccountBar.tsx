                                                                     "use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Profile = { username: string; role: "admin" | "member" };
type MaintenanceState = { enabled: boolean; progress: number; message: string };

export default function AccountBar() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceState>({ enabled: false, progress: 0, message: "App update in progress" });
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then(async (response) => {
        if (!response.ok) throw new Error("Signed out");
        return (await response.json()) as Profile;
      })
      .then((session) => {
        if (!active) return;
        setProfile(session);
        if (session.role === "admin") {
          fetch("/api/maintenance").then((response) => response.json()).then((data: MaintenanceState) => {
            if (active && typeof data.enabled === "boolean") setMaintenance(data);
          });
        }
      })
      .catch(() => router.push("/login"));
    return () => { active = false; };
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function saveMaintenance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Saving...");
    const response = await fetch("/api/maintenance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maintenance),
    });
    const data = (await response.json()) as MaintenanceState & { error?: string };
    if (!response.ok) {
      setNotice(data.error ?? "Could not save settings.");
      return;
    }
    setMaintenance(data);
    setNotice("Maintenance settings saved");
  }

  if (!profile) return <span className="h-8 w-24" aria-hidden="true" />;

  return (
    <div className="relative flex items-center gap-2">
      {profile.role === "admin" && <button aria-expanded={open} className="h-8 border border-[var(--line-strong)] px-2.5 text-[10px] font-bold uppercase text-[var(--green-dark)] hover:bg-white" onClick={() => setOpen(!open)} type="button">Server maintenance</button>}
      <span className="hidden text-[11px] font-semibold text-[var(--ink)] sm:inline">{profile.username}</span>
      <button aria-label="Sign out" className="h-8 border border-[var(--line-strong)] px-2.5 text-[10px] font-semibold uppercase text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]" onClick={logout} type="button">Sign out</button>
      {open && profile.role === "admin" && (
        <form className="maintenance-panel absolute right-0 top-11 z-20 w-[min(340px,calc(100vw-40px))] border border-[var(--line-strong)] bg-[var(--panel)] p-4 shadow-[0_14px_40px_rgba(30,40,28,0.15)]" onSubmit={saveMaintenance}>
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">Admin controls</p><h2 className="mt-1 text-base font-semibold text-[var(--ink)]">Server maintenance</h2></div>
            <span className={`h-2.5 w-2.5 rounded-full ${maintenance.enabled ? "bg-[var(--orange)]" : "bg-[var(--green)]"}`} />
          </div>
          <label className="mt-4 flex items-center justify-between border-y border-[var(--line)] py-3 text-[12px] font-medium text-[var(--ink)]" htmlFor="maintenance-toggle">
            Maintenance mode
            <input checked={maintenance.enabled} className="h-4 w-4 accent-[var(--green)]" id="maintenance-toggle" onChange={(event) => setMaintenance({ ...maintenance, enabled: event.target.checked })} type="checkbox" />
          </label>
          <label className="eyebrow mt-4 block" htmlFor="update-progress">Update progress <span className="float-right font-mono">{maintenance.progress}%</span></label>
          <input className="mt-2 w-full accent-[var(--green)]" id="update-progress" max="100" min="0" onChange={(event) => setMaintenance({ ...maintenance, progress: Number(event.target.value) })} type="range" value={maintenance.progress} />
          <label className="eyebrow mt-4 block" htmlFor="maintenance-message">Status message</label>
          <input className="mt-2 h-10 w-full border border-[var(--line-strong)] bg-[var(--canvas)] px-2 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--green)]" id="maintenance-message" maxLength={160} onChange={(event) => setMaintenance({ ...maintenance, message: event.target.value })} value={maintenance.message} />
          <div className="mt-4 flex items-center justify-between gap-2">
            <span aria-live="polite" className="text-[10px] text-[var(--muted)]">{notice}</span>
            <button className="h-9 bg-[var(--ink)] px-3 text-[11px] font-bold text-white hover:bg-[var(--green-dark)]" type="submit">Save status</button>
          </div>
        </form>
      )}
    </div>
  );
}