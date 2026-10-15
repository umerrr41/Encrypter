import LoginForm from "@/app/login/login-form";

export const metadata = {
  title: "Sign in | Glyph",
};

export default function LoginPage() {
  return (
    <main className="login-page flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <section className="login-panel w-full max-w-[440px] border border-[var(--line-strong)] bg-[var(--panel)] p-6 shadow-[0_22px_60px_rgba(30,40,28,0.09)] sm:p-9">
        <a className="mb-12 inline-flex items-center gap-3" href="/login">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--ink)] font-serif text-xl italic text-[var(--lime)]">g</span>
          <span className="text-[19px] font-bold text-[var(--ink)]">glyph<span className="text-[var(--orange)]">.</span></span>
        </a>
        <p className="eyebrow text-[var(--green)]">Private text studio</p>
        <h1 className="mt-2 text-[36px] font-semibold leading-tight text-[var(--ink)]">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Choose your profile to continue to Glyph.</p>
        <LoginForm />
      </section>
      <p className="login-note absolute bottom-7 text-[10px] font-semibold uppercase text-[var(--muted)]">AES-256-GCM <span className="px-2 text-[var(--orange)]">/</span> Personal access</p>
    </main>
  );
}