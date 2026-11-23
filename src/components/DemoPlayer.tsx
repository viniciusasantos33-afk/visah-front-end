import { useEffect, useRef, useState, type CSSProperties } from 'react';
import placeholderAudioUrl from '../assets/placeholder.wav';
import type { Track } from '../types/catalog';
import { Icon } from './Icon';

function formatTime(seconds: number) {
  const time = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
}

export function DemoPlayer({ track }: { track: Track | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(6);
  const totalTime = track?.durationSeconds || duration || 6;

  useEffect(() => {
    progressRef.current = 0;
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [track?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playing) return;
    let frame = 0;
    let lastFrameTime = performance.now();
    const syncProgress = () => {
      const now = performance.now();
      const elapsed = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      const nextTime = progressRef.current + elapsed;
      if (nextTime >= totalTime) {
        progressRef.current = 0;
        setCurrentTime(0);
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
        return;
      }
      progressRef.current = nextTime;
      setCurrentTime(nextTime);
      frame = window.requestAnimationFrame(syncProgress);
    };
    frame = window.requestAnimationFrame(syncProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, totalTime]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const audioDuration = audio.duration || duration || 6;
      audio.currentTime = progressRef.current % audioDuration;
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  };

  return (
    <aside className={`player${playing ? ' player--playing' : ''}`} aria-label="Player de demonstração">
      <audio
        ref={audioRef}
        src={placeholderAudioUrl}
        preload="auto"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
      <div className="player-controls">
        <button
          className="play-button"
          aria-label={playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}
          onClick={togglePlayback}
        >
          <Icon name={playing ? 'pause' : 'play_arrow'} />
        </button>
      </div>
      <div className="player-track">
        <div className="player-track-title">
          <strong>{track?.title ?? 'Som de demonstração'}</strong>
          <span> · {track?.artist ?? 'Visah'}</span>
        </div>
        <div className="progress-row">
          <span>{formatTime(currentTime)}</span>
          <input
            aria-label="Progresso do som de demonstração"
            type="range"
            min="0"
            max={Math.max(totalTime, 1)}
            value={Math.min(currentTime, totalTime)}
            style={{ '--progress': `${totalTime ? (currentTime / totalTime) * 100 : 0}%` } as CSSProperties}
            onChange={(event) => {
              const time = Number(event.target.value);
              progressRef.current = time;
              if (audioRef.current) {
                const audioDuration = audioRef.current.duration || duration || 6;
                audioRef.current.currentTime = time % audioDuration;
              }
              setCurrentTime(time);
            }}
          />
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>
      <div className="player-actions">
        <span className={`player-equalizer${playing ? ' is-active' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
    </aside>
  );
}
