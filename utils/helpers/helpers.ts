import moment from "moment";
import {
  FieldError,
  FieldValues,
  Path,
  UseFormSetError,
} from "react-hook-form";
import { ZodError } from "zod";

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractZodErrors(error: ZodError): Record<string, string[]> {
  const errorMap: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errorMap[path]) {
      errorMap[path] = [];
    }
    errorMap[path].push(issue.message);
  }
  return errorMap;
}

export function setMultipleErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: Record<string, string[]>
) {
  for (const key in errors) {
    const messages = errors[key];
    const types = messages.reduce((acc: Record<string, string>, msg, idx) => {
        acc[`rule${idx}`] = msg;
        return acc;
    }, {});

    setError(key as Path<T>, {
      type: "server",
      types: types,
    });
  }
}

export function formatDate(date: Date | string | undefined): string {
  if (!date)
    return '';

  return moment(date).format('DD-MMM-YYYY');
}

export function formattedRemainingDays(date: Date | string | undefined) : string {
  const noOfDays = remainingDays(date);

  if (noOfDays) {
    return (noOfDays > 1) ? `${noOfDays} days` : `< ${noOfDays} day`;
  }
  else {
    return ''
  }
}

export function remainingDays(date: Date | string | undefined) : number | null {
  if (!date)
    return null;

  const targetDate = moment(date);

  // Get the current date
  const today = moment();

  // Calculate the difference in days
  const remainingDays = targetDate.diff(today, 'days') + 1;

  return remainingDays;
}

export async function getCookie(name: string): Promise<string | undefined> {

  if (typeof window === 'undefined') {
    // Server-side
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cookies } = require('next/headers');
    const c = await cookies();

    return c.get(name)?.value;

  } else {
    // Client-side
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value;
  }
}

export function setQueryParam(pathName: string, paramName: string, paramVal?: string) {
  const params = new URLSearchParams(window.location.search);

  if (!paramVal) {
      params.delete(paramName);
  } else {
      params.set(paramName, paramVal);
  }

  const newUrl =
      params.toString().length > 0
          ? `${pathName}?${params.toString()}`
          : pathName;

  window.history.replaceState({}, "", newUrl);
};

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
    }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    output.setInt16(offset, s, true);
    }
}

function interleave(left: Float32Array, right: Float32Array): Float32Array {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let index = 0, inputIndex = 0;
    while (index < length) {
    result[index++] = left[inputIndex];
    result[index++] = right[inputIndex];
    inputIndex++;
    }
    return result;
}

function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitDepth = 16;
    const format = 1; // PCM

    let samples: Float32Array;
    if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    samples = interleave(left, right);
    } else {
    samples = audioBuffer.getChannelData(0);
    }

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true);
    view.setUint16(32, numChannels * bitDepth / 8, true);
    view.setUint16(34, bitDepth, true);

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // PCM samples
    floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
}

export async function convertWebMToWavBlob(webmBlob: Blob): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBufferToWav(audioBuffer);
}
