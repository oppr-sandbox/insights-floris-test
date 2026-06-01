"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, FileAudio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFeedbackForm } from "../hooks/useFeedbackForm";
import { EmptyState } from "@/components/ui/empty-state";
import { convertWebMToWavBlob } from "@/utils/helpers/helpers";
import { useUserDetails } from "@/providers/UserContextProvider";

export default function VoiceChannel() {

    const {
        formData,
        feedback,
        isActive,
        handleChange,
    } = useFeedbackForm()
    
    const { tenant } = useUserDetails();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState<number | null>(null);

    const formatTime = (duration: number | null | undefined): string => {
        if (!duration || duration <= 0 || isNaN(duration)) return "0s";

        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);

        if (minutes === 0) return `${seconds}s`;
        if (seconds === 0) return `${minutes}m`;
        return `${minutes}m ${seconds}s`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });
                const url = URL.createObjectURL(audioBlob);
                // const file = new File([audioBlob], "recording.webm");
                const wavBlob = await convertWebMToWavBlob(audioBlob);

                // Prepare FormData and send WAV to API
                const formData = new FormData();
                formData.append('audio', wavBlob, 'recording.wav');

                // const formData = new FormData();
                // formData.append("audio", file);

                setIsTranscribing(true);

                const res = await fetch("/api/transcribe", {
                    method: "POST",
                    body: formData,
                    headers: { 
                        'X-Tenant': tenant
                    },
                });

                const data = await res.json();

                handleChange('transcript', data.transcript || "Error during transcription");
                handleChange('audio', audioBlob);

                setIsTranscribing(false);
                setAudioUrl(url);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone", err);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const clearRecording = () => {
        setAudioUrl(null);
        setDuration(null);
        audioChunksRef.current = [];

        handleChange('transcript', '');
        handleChange('audio', null);
    };

    useEffect(() => {
        if (feedback?.audio) {
            setAudioUrl(feedback.audio.url);
        }
    }, [feedback])

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleMetadata = () => {
            if (audio.duration === Infinity) {
                // Force seeking to a large time to trigger duration correction
                audio.currentTime = 1e101;
                audio.ontimeupdate = () => {
                    audio.ontimeupdate = null;
                    setDuration(audio.duration);
                    audio.currentTime = 0; // reset
                };
            } else {
                setDuration(audio.duration);
            }
        };

        audio.addEventListener("loadedmetadata", handleMetadata);

        return () => {
            audio.removeEventListener("loadedmetadata", handleMetadata);
        };
    }, [audioUrl]);

    return (
        <Card className="mb-2">
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent bg-opacity-10 rounded-lg">
                            <Mic />
                        </div>
                        <h3 className="font-semibold leading-none tracking-tight text-h3">
                            Voice Memo &amp; Transcription
                        </h3>
                    </div>
                </div>
                <div className="mt-4 space-y-4">
                    {isActive && (isRecording ? (
                        <>
                            <Button variant="destructive" onClick={stopRecording}>
                                <MicOff />
                                Stop Recording
                            </Button>
                            <div className="text-center py-4">
                                <div className="w-4 h-4 bg-destructive rounded-full mx-auto mb-2 animate-pulse"></div>
                                <p className="text-small text-medium-grey">
                                    Recording in progress...
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={startRecording} disabled={isTranscribing} variant={isTranscribing ? "ghost" : "default"}>
                                <Mic />
                                Record Voice Memo
                            </Button>
                            {audioUrl && (
                                <Button size="sm" variant="outline" onClick={clearRecording}>
                                    Clear Recording
                                </Button>
                            )}
                        </div>
                    ))}
                    {audioUrl && (
                        <div className="p-4 bg-accent rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <FileAudio />
                                <span className="text-small text-dark-grey">
                                    Voice Recording ({formatTime(duration ?? 0)})
                                </span>
                            </div>
                            <audio
                                ref={audioRef}
                                preload="metadata"
                                controls
                                src={audioUrl}
                                className="w-full"
                            ></audio>
                        </div>
                    )}
                    {!isActive && !audioUrl ?
                        <EmptyState
                            title="No Voice Memo"
                            description="This feedback has no uploaded voice memo."
                            className="p-4"
                            icons={[Mic]}
                        />
                        :
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="transcription">Transcribed Text {isActive && '(Editable)'}</Label>
                            <Textarea
                                readOnly={!isActive}
                                placeholder={
                                    isTranscribing
                                        ? "Transcribing..."
                                        : "Your voice memo will be transcribed here. You can edit and refine the text as needed."
                                }
                                value={formData.transcribeText}
                                onChange={(e) => handleChange('transcript', e.currentTarget.value)}
                            ></Textarea>
                        </div>
                    }
                </div>
            </CardContent>
        </Card >
    );
}
