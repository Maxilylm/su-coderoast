"use client";

import { useState, useRef, useCallback } from "react";

const PLACEHOLDER_CODE = `function doStuff(x, y, z, a, b, c) {
  var temp = x + y;
  var temp2 = temp * z;
  if (temp2 > 100) {
    return true;
  } else if (temp2 < 100) {
    return false;
  } else {
    return null;
  }
}`;

function FireMeter({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-2 mt-6">
      <div className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
        Cringe Score
      </div>
      <div className="flex gap-1 text-3xl" aria-label={`Cringe score: ${score} out of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={
              i < score ? "fire-active" : "opacity-20 grayscale"
            }
            role="img"
            aria-hidden="true"
          >
            {"\uD83D\uDD25"}
          </span>
        ))}
      </div>
      <div className="text-2xl font-bold text-[var(--accent)]">{score}/10</div>
    </div>
  );
}

export default function Home() {
  const [code, setCode] = useState("");
  const [roast, setRoast] = useState("");
  const [loading, setLoading] = useState(false);
  const [cringeScore, setCringeScore] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleRoast = useCallback(async () => {
    if (!code.trim() || loading) return;

    setLoading(true);
    setRoast("");
    setCringeScore(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setRoast(`Error: ${err.error || "Something went wrong"}`);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setRoast(fullText);
      }

      // Extract cringe score
      const scoreMatch = fullText.match(/CRINGE_SCORE:\s*(\d+)\s*\/\s*10/i);
      if (scoreMatch) {
        setCringeScore(Math.min(10, Math.max(1, parseInt(scoreMatch[1], 10))));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setRoast("Failed to get roast. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [code, loading]);

  return (
    <main className="flex-1 spotlight">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight mb-2">
            <span className="text-[var(--accent)]">Code</span>Roast
          </h1>
          <p className="text-neutral-400 text-lg">
            The Syntax Error Comedy Club{" "}
            <span role="img" aria-label="microphone">
              {"\uD83C\uDFA4"}
            </span>
          </p>
          <p className="text-neutral-500 text-sm mt-1">
            Paste your code. Get brutally roasted by AI. No feelings spared.
          </p>
        </header>

        {/* Code Input */}
        <div className="stage-glow rounded-xl p-1">
          <textarea
            className="code-input w-full h-64 rounded-lg p-4 font-mono text-sm text-neutral-200 resize-none placeholder-neutral-600"
            placeholder={PLACEHOLDER_CODE}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            maxLength={4000}
          />
        </div>

        <div className="flex items-center justify-between mt-3 mb-6">
          <span className="text-xs text-neutral-600">
            {code.length}/4000 characters
          </span>
          <button
            onClick={handleRoast}
            disabled={loading || !code.trim()}
            className="btn-roast bg-[var(--accent)] hover:bg-orange-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Roasting...
              </span>
            ) : (
              <>{"\uD83D\uDD25"} Roast My Code</>
            )}
          </button>
        </div>

        {/* Roast Output */}
        {roast && (
          <div className="roast-text bg-[#111] border border-neutral-800 rounded-xl p-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[var(--accent)] text-xl">{"\uD83C\uDFA4"}</span>
              <span className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
                The Roast
              </span>
            </div>
            <div className="whitespace-pre-wrap text-neutral-200 leading-relaxed font-mono text-sm">
              {roast.replace(/CRINGE_SCORE:\s*\d+\s*\/\s*10/gi, "").trim()}
            </div>
            {cringeScore !== null && <FireMeter score={cringeScore} />}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 text-neutral-600 text-xs">
          <p>
            CodeRoast roasts code, not coders. All in good fun.{" "}
            {"\u2764\uFE0F"}{" "}
            Powered by Groq + Llama
          </p>
        </footer>
      </div>
    </main>
  );
}
