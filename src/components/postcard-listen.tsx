"use client";

import { useEffect, useRef, useState } from "react";
import { speechChunks } from "@/lib/postcard-reading";
import styles from "./postcard.module.css";

// Higher-quality voices most devices ship (Apple enhanced/premium and Siri, Edge/Windows "Natural", Chrome's Google voices).
const NICE_VOICE = /natural|neural|premium|enhanced|siri|samantha|ava|google us english|aria|jenny/i;

/**
 * The calm voice: Kokoro-82M (Apache-2.0, https://github.com/hexgrad/kokoro) with its warm "af_heart" voice,
 * running in the browser. It's loaded from a CDN only when someone presses play, so it isn't in the bundle,
 * and the browser caches the model after the first time (about 90 MB).
 */
const KOKORO_URL = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_VOICE = "af_heart";
/** A touch slower than default, for an unhurried read. */
const KOKORO_SPEED = 0.95;
const VOICE_KEY = "lately-voice";

type Voice = "calm" | "device";
type State = "idle" | "loading" | "playing" | "paused";

interface RawAudio {
  audio: Float32Array;
  sampling_rate: number;
}
interface KokoroTTS {
  generate(text: string, options: { voice: string; speed?: number }): Promise<RawAudio>;
}
type ProgressEvent = { status?: string; progress?: number; file?: string };

// One model per page visit; later plays (and other postcards) reuse it.
let kokoro: Promise<KokoroTTS> | null = null;

function loadKokoro(onProgress: (percent: number) => void): Promise<KokoroTTS> {
  if (!kokoro) {
    // A runtime import of a URL the bundler leaves alone.
    const importUrl = new Function("url", "return import(url)") as (url: string) => Promise<{
      KokoroTTS: { from_pretrained(model: string, options: Record<string, unknown>): Promise<KokoroTTS> };
    }>;
    const files = new Map<string, number>();
    kokoro = importUrl(KOKORO_URL).then(({ KokoroTTS }) =>
      KokoroTTS.from_pretrained(KOKORO_MODEL, {
        dtype: "q8",
        device: "wasm",
        progress_callback: (event: ProgressEvent) => {
          if (event.status !== "progress" || !event.file || event.progress === undefined) return;
          files.set(event.file, event.progress);
          const values = [...files.values()];
          onProgress(Math.round(values.reduce((a, b) => a + b, 0) / values.length));
        },
      }),
    );
    // A failed load can be retried later.
    kokoro.catch(() => {
      kokoro = null;
    });
  }
  return kokoro;
}

/** Picks the most natural English voice available, or undefined to keep the browser default. */
function bestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((voice) => voice.lang.startsWith("en"));
  return english.find((voice) => NICE_VOICE.test(voice.name) && voice.lang === "en-US")
    ?? english.find((voice) => NICE_VOICE.test(voice.name))
    ?? english.find((voice) => voice.lang === "en-US");
}

function savedVoice(): Voice {
  try {
    return localStorage.getItem(VOICE_KEY) === "device" ? "device" : "calm";
  } catch {
    return "calm";
  }
}

export function PostcardListen({ text }: { text: string }) {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [loadPercent, setLoadPercent] = useState(0);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState<Voice>("calm");
  const run = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const minutes = Math.max(1, Math.ceil(text.split(/\s+/).length / 155));

  // The saved choice is read after mount so the server and first client render match.
  useEffect(() => {
    const saved = savedVoice();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only preference
    if (saved !== "calm") setVoice(saved);
  }, []);

  useEffect(() => () => {
    run.current++;
    if (utterance.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
    void audio.current?.close();
  }, []);

  function chooseVoice(next: Voice) {
    stop();
    setVoice(next);
    setError("");
    try {
      localStorage.setItem(VOICE_KEY, next);
    } catch {
      // Private browsing: the choice just isn't remembered.
    }
  }

  function stop() {
    run.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utterance.current = null;
    void audio.current?.close();
    audio.current = null;
    setState("idle");
    setProgress(0);
  }

  function toggle() {
    if (state === "loading") return;
    if (state === "playing") {
      if (audio.current) void audio.current.suspend();
      else window.speechSynthesis.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      if (audio.current) void audio.current.resume();
      else window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    if (voice === "calm" && typeof WebAssembly === "object" && "AudioContext" in window) void playCalm();
    else playDevice();
  }

  /** Reads with the Kokoro voice, preparing each sentence while the one before it plays. */
  async function playCalm() {
    const token = ++run.current;
    const chunks = speechChunks(text);
    if (!chunks.length) return;
    // Created inside the tap, so phones allow it to play.
    const context = new AudioContext();
    audio.current = context;
    setError("");
    setProgress(0);
    setState("loading");
    try {
      const tts = await loadKokoro((percent) => {
        if (token === run.current) setLoadPercent(percent);
      });
      if (token !== run.current) return;
      setState(context.state === "suspended" ? "paused" : "playing");
      let at = context.currentTime + 0.1;
      let next = tts.generate(chunks[0]!, { voice: KOKORO_VOICE, speed: KOKORO_SPEED });
      for (let i = 0; i < chunks.length; i++) {
        const sound = await next;
        if (token !== run.current) return;
        if (i + 1 < chunks.length) next = tts.generate(chunks[i + 1]!, { voice: KOKORO_VOICE, speed: KOKORO_SPEED });
        const buffer = context.createBuffer(1, sound.audio.length, sound.sampling_rate);
        buffer.copyToChannel(new Float32Array(sound.audio), 0);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        at = Math.max(at, context.currentTime + 0.05);
        source.start(at);
        // A short breath between sentences.
        at += buffer.duration + 0.18;
        const done = i + 1;
        source.onended = () => {
          if (token !== run.current) return;
          setProgress((done / chunks.length) * 100);
          if (done === chunks.length) {
            void context.close();
            audio.current = null;
            setState("idle");
          }
        };
      }
    } catch {
      if (token !== run.current) return;
      // The calm voice couldn't load (offline, an old browser, low memory): fall back to the device's voice.
      void context.close();
      audio.current = null;
      setError("The calm voice couldn't load, so this uses your device's voice.");
      playDevice(true);
    }
  }

  /** Reads with the browser's built-in speech. */
  function playDevice(keepError = false) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setError("Audio isn't available in this browser. The full postcard is below.");
      setState("idle");
      return;
    }
    const synth = window.speechSynthesis;
    const token = ++run.current;
    const chunks = speechChunks(text);
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (!length) return;
    let completed = 0;
    synth.cancel();
    synth.resume();
    if (!keepError) setError("");
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
      const best = bestVoice(synth.getVoices());
      if (best) current.voice = best;
      current.rate = 0.95;
      current.onboundary = (event) => {
        if (token === run.current) setProgress(Math.min(100, ((completed + event.charIndex) / length) * 100));
      };
      current.onend = () => {
        if (token !== run.current) return;
        completed += chunks[index]!.length;
        setProgress((completed / length) * 100);
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

  const label = state === "playing" ? "Pause postcard" : state === "paused" ? "Resume postcard" : state === "loading" ? "Preparing the voice" : "Listen to postcard";
  const detail =
    error ||
    (state === "loading"
      ? `Getting the calm voice ready${loadPercent ? ` · ${loadPercent}%` : "…"}`
      : state === "playing"
        ? "Reading your postcard aloud"
        : state === "paused"
          ? "Paused — whenever you're ready"
          : `About ${minutes} min`);

  return (
    <div className={styles.audio}>
      <button className={styles.play} type="button" onClick={toggle} aria-label={label} aria-busy={state === "loading"}>
        {state === "loading" ? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="animate-spin"><path d="M10 3a7 7 0 1 0 7 7" /></svg>
        ) : state === "playing" ? (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 4h3v12H5zm7 0h3v12h-3z" /></svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m6 3 11 7-11 7z" /></svg>
        )}
      </button>
      <div className={styles.audioCopy}>
        <span className={styles.audioTitle}>Listen to this recap</span>
        <span className={styles.audioDetail} role="status">{detail}</span>
      </div>
      {state === "idle" ? (
        <button
          className={styles.stop}
          type="button"
          onClick={() => chooseVoice(voice === "calm" ? "device" : "calm")}
          title={voice === "calm" ? "Calm voice (Kokoro, open source). Tap for your device's voice." : "Your device's voice. Tap for the calm voice."}
        >
          {voice === "calm" ? "Calm voice" : "Device voice"}
        </button>
      ) : (
        <button className={styles.stop} type="button" onClick={stop}>Stop</button>
      )}
      <progress className={styles.audioProgress} value={progress} max={100} aria-label="Postcard listening progress" />
    </div>
  );
}
