'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveAudioId, setActiveAudio, subscribeActiveAudio } from "./audio-bus";

const BAR_COUNT = 48;

// Deterministic bar heights derived from the feedback id, so each note has a
// stable, distinct "waveform" shape without decoding the actual audio.
function barHeights(seed: string): number[] {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return Array.from({ length: BAR_COUNT }, () => {
        h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
        return 0.22 + (h / 0xffffffff) * 0.78;
    });
}

function fmt(t: number): string {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({ id, src, className }: { id: string; src: string; className?: string }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const barsRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const heightsRef = useRef<number[]>(barHeights(id));

    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);

    const activeId = useSyncExternalStore(subscribeActiveAudio, getActiveAudioId, getActiveAudioId);

    // When another player takes over, stop this one.
    useEffect(() => {
        if (activeId !== id && playing) {
            audioRef.current?.pause();
        }
    }, [activeId, id, playing]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => {
            if (audio.duration === Infinity) {
                audio.currentTime = 1e101;
                audio.ontimeupdate = () => {
                    audio.ontimeupdate = null;
                    setDuration(audio.duration);
                    audio.currentTime = 0;
                    setReady(true);
                };
            } else {
                setDuration(audio.duration);
                setReady(true);
            }
        };
        const onTime = () => setCurrent(audio.currentTime);
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        const onEnded = () => {
            setPlaying(false);
            setCurrent(0);
            if (getActiveAudioId() === id) setActiveAudio(null);
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("play", onPlay);
            audio.removeEventListener("pause", onPause);
            audio.removeEventListener("ended", onEnded);
        };
    }, [id]);

    const toggle = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            setActiveAudio(id);
            void audio.play();
        } else {
            audio.pause();
        }
    }, [id]);

    const replay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        setCurrent(0);
    }, []);

    const seekToClientX = useCallback((clientX: number) => {
        const el = barsRef.current;
        const audio = audioRef.current;
        if (!el || !audio || !duration) return;
        const rect = el.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        audio.currentTime = ratio * duration;
        setCurrent(ratio * duration);
    }, [duration]);

    const onPointerDown = (e: React.PointerEvent) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekToClientX(e.clientX);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (draggingRef.current) seekToClientX(e.clientX);
    };
    const stopDrag = () => {
        draggingRef.current = false;
    };

    const progress = duration ? current / duration : 0;
    const playhead = Math.round(progress * (BAR_COUNT - 1));

    return (
        <div className={cn("flex items-center gap-3 rounded-lg bg-muted p-3", className)}>
            <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

            <Button
                onClick={toggle}
                disabled={!ready}
                size="icon"
                className="size-9 shrink-0 rounded-full"
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing
                    ? <Pause className="size-4 fill-current" />
                    : <Play className="size-4 fill-current" />}
            </Button>

            <div
                ref={barsRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(current)}
                tabIndex={0}
                className={cn(
                    "flex h-10 flex-1 touch-none items-center gap-[2px]",
                    ready ? "cursor-pointer" : "cursor-default opacity-60",
                )}
            >
                {heightsRef.current.map((hgt, i) => {
                    const played = i <= playhead;
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 rounded-full transition-[height,background-color] duration-150",
                                played ? "bg-primary" : "bg-muted-foreground/30",
                                playing && i === playhead && "animate-pulse bg-primary",
                            )}
                            style={{ height: `${Math.round(hgt * 100)}%` }}
                        />
                    );
                })}
            </div>

            <span className="w-[5.5rem] shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {fmt(current)} / {fmt(duration)}
            </span>

            <Button
                onClick={replay}
                disabled={!ready}
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-full"
                aria-label="Replay from start"
            >
                <RotateCcw className="size-4" />
            </Button>
        </div>
    );
}
