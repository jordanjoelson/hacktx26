"use client";

import { useEffect, useRef, useState } from "react";
import { speechChunks } from "@/lib/postcard-reading";
import styles from "./postcard.module.css";

// Higher-quality voices most devices ship (Apple enhanced/premium and Siri, Edge/Windows "Natural", Chrome's Google voices).
const NICE_VOICE = /natural|neural|premium|enhanced|siri|samantha|ava|google us english|aria|jenny/i;

/** Picks the most natural English voice available, or undefined to keep the browser default. */
function bestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((voice) => voice.lang.startsWith("en"));
  return english.find((voice) => NICE_VOICE.test(voice.name) && voice.lang === "en-US")
    ?? english.find((voice) => NICE_VOICE.test(voice.name))
    ?? english.find((voice) => voice.lang === "en-US");
}

export function PostcardListen({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const run = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const minutes = Math.max(1, Math.ceil(text.split(/\s+/).length / 155));

  useEffect(() => () => {
    run.current++;
    if (utterance.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function stop() {
    run.current++;
    window.speechSynthesis.cancel();
    utterance.current = null;
    setState("idle");
    setProgress(0);
  }

  function toggle() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setError("Audio isn't available in this browser. The full postcard is below.");
      return;
    }
    const synth = window.speechSynthesis;
    if (state === "playing") {
      synth.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }

    const token = ++run.current;
    const chunks = speechChunks(text);
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (!length) return;
    let completed = 0;
    synth.cancel();
    synth.resume();
    setError("");
    setProgress(0);
    setState("playing");

    function speak(index: number) {
      if (token !== run.current) return;
      if (index >= chunks.length) {
        utterance.current = null;
        setState("idle");
        setProgress(100);
        return;
      }
      const current = new SpeechSynthesisUtterance(chunks[index]);
      utterance.current = current;
      current.lang = "en-US";
      const voice = bestVoice(synth.getVoices());
      if (voice) current.voice = voice;
      current.rate = 1;
      current.onboundary = (event) => {
        if (token === run.current) setProgress(Math.min(100, (completed + event.charIndex) / length * 100));
      };
      current.onend = () => {
        if (token !== run.current) return;
        completed += chunks[index].length;
        setProgress(completed / length * 100);
        speak(index + 1);
      };
      current.onerror = () => {
        if (token !== run.current) return;
        run.current++;
        utterance.current = null;
        setState("idle");
        setProgress(0);
        setError("Audio couldn't start. Try again, or read the postcard below.");
      };
      synth.speak(current);
    }
    speak(0);
  }

  const label = state === "playing" ? "Pause postcard" : state === "paused" ? "Resume postcard" : "Listen to postcard";
  return (
    <div className={styles.audio}>
      <button className={styles.play} type="button" onClick={toggle} aria-label={label}>
        {state === "playing" ? (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 4h3v12H5zm7 0h3v12h-3z" /></svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m6 3 11 7-11 7z" /></svg>
        )}
      </button>
      <div className={styles.audioCopy}>
        <span className={styles.audioTitle}>Listen to this recap</span>
        <span className={styles.audioDetail} role="status">
          {error || (state === "playing" ? "Reading your postcard aloud" : state === "paused" ? "Paused — whenever you're ready" : `About ${minutes} min`)}
        </span>
      </div>
      {state !== "idle" && (
        <button className={styles.stop} type="button" onClick={stop}>Stop</button>
      )}
      <progress className={styles.audioProgress} value={progress} max={100} aria-label="Postcard listening progress" />
    </div>
  );
}
