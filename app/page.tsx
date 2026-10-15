"use client";

import { useState } from "react";

type Mode = "encrypt" | "decrypt";

type IconName = "arrow" | "copy" | "lock" | "refresh" | "spark";

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
      </>
    ),
    spark: <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [inputText, setInputText] = useState("");
  const [resultText, setResultText] = useState("");
  const [key, setKey] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function transformText() {
    setIsWorking(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/cipher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, text: inputText, key }),
      });
      const data = (await response.json()) as { result?: string; key?: string; error?: string };

      if (!response.ok || typeof data.result !== "string") {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      setResultText(data.result);
      if (data.key) setKey(data.key);
      setNotice(mode === "encrypt" ? "Message encrypted" : "Message decrypted");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong. Please try again.");
      setResultText("");
    } finally {
      setIsWorking(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied`);
      setError("");
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  function loadResultAsInput() {
    setInputText(resultText);
    setResultText("");
    setMode(mode === "encrypt" ? "decrypt" : "encrypt");
    setError("");
    setNotice("");
  }

  const inputLimit = mode === "encrypt" ? 10_000 : 80_056;

  return (
    <main className="min-h-screen px-5 pb-10 pt-5 sm:px-8 sm:pt-7 lg:px-12">
      <div className="mx-auto max-w-[1240px]">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <a aria-label="Glyph home" className="group flex items-center gap-3" href="#top">
            <span className="brand-mark flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--ink)] text-[var(--lime)] transition-transform group-hover:rotate-[-7deg]">
              <Icon className="h-[21px] w-[21px]" name="spark" />
            </span>
            <span className="text-[19px] font-bold tracking-[-0.04em] text-[var(--ink)]">glyph<span className="text-[var(--orange)]">.</span></span>
          </a>
          <div className="hidden items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--green)] shadow-[0_0_0_4px_rgba(55,112,75,0.1)]" />
            AES-256-GCM <span className="px-1 text-[var(--line-strong)]">/</span> processed on request
          </div>
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)] sm:hidden">
            <Icon className="h-4 w-4 text-[var(--green)]" name="lock" />
            AES-256
          </span>
        </header>

        <section className="hero-grid relative flex flex-col justify-between gap-7 py-10 sm:py-14 lg:flex-row lg:items-end lg:gap-12" id="top">
          <div className="hero-copy max-w-[720px]">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--green)]">
              <span className="h-px w-6 bg-[var(--green)]" />
              A little privacy goes a long way
            </div>
            <h1 className="max-w-[700px] text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.93] tracking-[-0.065em] text-[var(--ink)]">
              Say it in <span className="serif-accent font-normal italic text-[var(--green)]">symbols.</span>
            </h1>
            <p className="mt-5 max-w-[490px] text-[15px] leading-7 text-[var(--muted)] sm:text-base">
              Turn a message into a private little puzzle. Only the matching key can turn it back.
            </p>
          </div>
          <div className="hero-stamp flex w-fit items-center gap-3 border-l-2 border-[var(--orange)] py-1 pl-4 lg:mb-2">
            <span className="font-mono text-[11px] font-medium leading-5 text-[var(--muted)]">01 / ENCRYPT<br />02 / DECRYPT</span>
            <span className="h-10 w-10 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] p-[9px] text-[var(--orange)]">
              <Icon className="h-full w-full" name="refresh" />
            </span>
          </div>
        </section>

        <section aria-label="Message encryption workspace" className="workspace-shell overflow-hidden rounded-[8px] border border-[var(--line-strong)] bg-[var(--panel)] shadow-[0_22px_60px_rgba(30,40,28,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex w-fit items-center gap-1 rounded-[6px] bg-[var(--canvas)] p-1" role="tablist" aria-label="Choose a mode">
              <button
                aria-selected={mode === "encrypt"}
                className={`mode-tab flex h-10 items-center gap-2 rounded-[4px] px-4 text-[13px] font-semibold transition-colors ${mode === "encrypt" ? "bg-[var(--ink)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                onClick={() => changeMode("encrypt")}
                role="tab"
                type="button"
              >
                <Icon className="h-4 w-4" name="lock" /> Encrypt
              </button>
              <button
                aria-selected={mode === "decrypt"}
                className={`mode-tab flex h-10 items-center gap-2 rounded-[4px] px-4 text-[13px] font-semibold transition-colors ${mode === "decrypt" ? "bg-[var(--ink)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                onClick={() => changeMode("decrypt")}
                role="tab"
                type="button"
              >
                <Icon className="h-4 w-4" name="refresh" /> Decrypt
              </button>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              <span className="font-mono text-[var(--ink)]">{mode === "encrypt" ? "01" : "02"}</span>
              <span className="px-2 text-[var(--line-strong)]">/</span>
              {mode === "encrypt" ? "Create a cipher" : "Unlock a message"}
            </p>
          </div>

          <div className="grid lg:grid-cols-2">
            <section className="source-pane border-b border-[var(--line)] p-5 sm:p-7 lg:border-b-0 lg:border-r" aria-labelledby="source-heading">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{mode === "encrypt" ? "Your message" : "Ciphertext"}</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.035em] text-[var(--ink)]" id="source-heading">
                    {mode === "encrypt" ? "Write something worth keeping." : "Paste the symbol string."}
                  </h2>
                </div>
                <span className="mt-1 rounded-[4px] border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--muted)]">UTF-8</span>
              </div>
              <label className="sr-only" htmlFor="source-text">{mode === "encrypt" ? "Message to encrypt" : "Ciphertext to decrypt"}</label>
              <textarea
                className="message-input min-h-[224px] w-full resize-y rounded-[5px] border border-[var(--line)] bg-[var(--canvas)] p-4 font-mono text-[13px] leading-6 text-[var(--ink)] outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[rgba(55,112,75,0.12)] placeholder:text-[#a7aaa0]"
                id="source-text"
                maxLength={inputLimit}
                onChange={(event) => setInputText(event.target.value)}
                placeholder={mode === "encrypt" ? "Type or paste your message here..." : "Paste your encrypted symbols here..."}
                spellCheck={mode === "encrypt"}
                value={inputText}
              />
              <div className="mt-2 flex min-h-5 items-center justify-between gap-3">
                <span className="text-[11px] text-[var(--muted)]">{mode === "encrypt" ? "Your text is never saved." : "Symbols are case-sensitive."}</span>
                <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">{inputText.length.toLocaleString()} / {inputLimit.toLocaleString()}</span>
              </div>

              {mode === "decrypt" && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="eyebrow" htmlFor="secret-key">Decryption key</label>
                    <span className="font-mono text-[10px] text-[var(--muted)]">43 CHARACTERS</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-[5px] border border-[var(--line)] bg-[var(--canvas)] px-3 focus-within:border-[var(--green)]">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--green)]" name="lock" />
                    <input
                      autoComplete="off"
                      className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[12px] text-[var(--ink)] outline-none placeholder:text-[#a7aaa0]"
                      id="secret-key"
                      onChange={(event) => setKey(event.target.value)}
                      placeholder="Paste the key from encryption"
                      spellCheck={false}
                      value={key}
                    />
                    {key && <button aria-label="Clear decryption key" className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]" onClick={() => setKey("")} type="button">Clear</button>}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  className="primary-action flex h-12 w-full items-center justify-center gap-3 rounded-[5px] bg-[var(--green)] px-5 text-[13px] font-bold text-white transition hover:bg-[var(--green-dark)] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-[190px]"
                  disabled={isWorking || inputText.length === 0 || (mode === "decrypt" && key.length === 0)}
                  onClick={transformText}
                  type="button"
                >
                  {isWorking ? "Working..." : mode === "encrypt" ? "Encrypt message" : "Decrypt message"}
                  {!isWorking && <Icon className="h-[17px] w-[17px]" name="arrow" />}
                </button>
                {notice && <span aria-live="polite" className="text-[12px] font-medium text-[var(--green)]">{notice}</span>}
              </div>
              {error && <p aria-live="assertive" className="mt-3 text-[12px] font-medium text-[var(--orange-dark)]">{error}</p>}
            </section>

            <section className="result-pane flex min-h-[390px] flex-col p-5 sm:p-7" aria-labelledby="result-heading">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{mode === "encrypt" ? "Your ciphertext" : "Your message"}</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.035em] text-[var(--ink)]" id="result-heading">
                    {resultText ? (mode === "encrypt" ? "Ready to travel." : "Back in plain sight.") : "The result will appear here."}
                  </h2>
                </div>
                {resultText && (
                  <button aria-label="Copy result" className="icon-action flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-[var(--line-strong)] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-white" onClick={() => copyText(resultText, "Result")} title="Copy result" type="button">
                    <Icon className="h-[17px] w-[17px]" name="copy" />
                  </button>
                )}
              </div>

              <div className={`result-well flex min-h-[224px] flex-1 rounded-[5px] border border-dashed border-[var(--line-strong)] p-4 ${resultText ? "items-start bg-[var(--canvas)]" : "items-center justify-center bg-[var(--canvas)]/65"}`}>
                {resultText ? (
                  <output aria-live="polite" className={`block w-full whitespace-pre-wrap break-all ${mode === "encrypt" ? "font-mono text-[12px] leading-[1.85] text-[var(--ink)]" : "text-[15px] leading-7 text-[var(--ink)]"}`}>
                    {resultText}
                  </output>
                ) : (
                  <div className="max-w-[250px] text-center">
                    <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--green)]">
                      <Icon className="h-[18px] w-[18px]" name="spark" />
                    </span>
                    <p className="text-[12px] leading-5 text-[var(--muted)]">{mode === "encrypt" ? "Your encrypted message will land right here." : "Your decrypted message will land right here."}</p>
                  </div>
                )}
              </div>

              {mode === "encrypt" && key && resultText && (
                <div className="key-row mt-4 rounded-[5px] border border-[#d7ddc6] bg-[#f3f6e9] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow text-[var(--green-dark)]">One-time decryption key</p>
                    <button className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--green-dark)] hover:underline" onClick={() => copyText(key, "Key")} type="button">
                      <Icon className="h-3.5 w-3.5" name="copy" /> Copy key
                    </button>
                  </div>
                  <p className="mt-2 break-all font-mono text-[11px] leading-5 text-[var(--ink)]">{key}</p>
                  <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">Keep this key separate from your message. It cannot be recovered if lost.</p>
                </div>
              )}

              {resultText && (
                <button className="mt-4 flex w-fit items-center gap-2 text-[11px] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]" onClick={loadResultAsInput} type="button">
                  <Icon className="h-3.5 w-3.5" name="refresh" />
                  Use result as {mode === "encrypt" ? "ciphertext" : "new message"}
                </button>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--line)] bg-[#f8f8f3] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="flex items-start gap-2 text-[10px] leading-4 text-[var(--muted)] sm:items-center">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--orange)] sm:mt-0" name="lock" />
              AES-256-GCM encryption. Messages are processed in memory and never stored.
            </p>
            <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">YOUR KEY. YOUR MESSAGE.</span>
          </div>
        </section>

        <footer className="flex flex-col gap-2 py-5 text-[10px] leading-4 text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>Glyph turns encrypted bytes into a custom alphabet of symbols.</p>
          <p className="max-w-[550px] sm:text-right">Encryption protects the message; the symbol mapping is only its visual format. Keep your key private.</p>
        </footer>
      </div>
    </main>
  );
}