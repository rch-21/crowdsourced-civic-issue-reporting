import { useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 90;

type Recording = { blob: Blob; mimeType: string; url: string; durationSeconds: number };

/**
 * Records a short voice note (mic capture via MediaRecorder) and, where the browser
 * supports it, live-transcribes speech to text so the citizen can insert it into the
 * report description without typing. The recording itself is offered as an attachment;
 * transcription is best-effort and always editable, never auto-submitted silently.
 */
export function VoiceRecorder({
  onRecordingChange,
  onTranscript,
  disabled
}: {
  onRecordingChange: (recording: { blob: Blob; mimeType: string } | null) => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}) {
  const [supported] = useState(() => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined');
  const [speechSupported] = useState(() => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<Recording | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => () => stopEverything(), []);

  function stopEverything() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function pickMimeType(): string {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return candidates.find((c) => window.MediaRecorder.isTypeSupported?.(c)) ?? '';
  }

  async function start() {
    setError('');
    if (!supported) { setError('Voice recording is not supported in this browser.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
        setClip({ blob, mimeType: finalMimeType, url, durationSeconds });
        onRecordingChange({ blob, mimeType: finalMimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next >= MAX_SECONDS) stop();
          return next;
        });
      }, 1000);
      startSpeechRecognition();
    } catch {
      setError('Microphone access was denied or is unavailable. You can still type the description.');
    }
  }

  function startSpeechRecognition() {
    if (!speechSupported) return;
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    let finalText = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${piece} `;
        else interim += piece;
      }
      setTranscript(`${finalText}${interim}`.trim());
    };
    recognition.onerror = () => { /* transcription is best-effort; recording continues regardless */ };
    try { recognition.start(); recognitionRef.current = recognition; } catch { /* ignore start failures, recording still works */ }
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function clear() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    setTranscript('');
    setElapsed(0);
    onRecordingChange(null);
  }

  function insertTranscript() {
    if (transcript) onTranscript?.(transcript);
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(1, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="voice-recorder-wrap">
      <div className="voice-recorder">
        {!recording && !clip && (
          <button type="button" disabled={disabled || !supported} onClick={start}>
            🎙️ Record voice note
          </button>
        )}
        {recording && (
          <button type="button" className="recording" onClick={stop}>
            ⏹ Stop ({minutes}:{seconds})
          </button>
        )}
        {clip && !recording && (
          <>
            <audio controls src={clip.url} />
            <span className="muted">{clip.durationSeconds}s</span>
            <button type="button" onClick={clear}>Remove</button>
          </>
        )}
      </div>
      {!supported && <p className="muted">Voice recording isn't supported in this browser, but you can still type the description.</p>}
      {supported && !speechSupported && <p className="muted">Live transcription isn't available in this browser, but the recording will still be attached as evidence.</p>}
      {error && <div className="notice" role="alert">{error}</div>}
      {transcript && (
        <div className="location-readout">
          <p className="muted">Live transcript: {transcript}</p>
          {!recording && <button type="button" className="link-button" onClick={insertTranscript}>Insert transcript into description</button>}
        </div>
      )}
    </div>
  );
}
