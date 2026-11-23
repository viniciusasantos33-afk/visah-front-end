export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const cleanup = () => {
      URL.revokeObjectURL(source);
      audio.removeAttribute('src');
      audio.load();
    };
    audio.onloadedmetadata = () => {
      const duration = Math.round(audio.duration);
      cleanup();
      if (Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(new Error('Não foi possível ler a duração deste áudio.'));
    };
    audio.onerror = () => {
      cleanup();
      reject(
        new Error(
          'Não foi possível ler a duração deste áudio. Tente outro arquivo.'
        )
      );
    };
    audio.src = source;
  });
}
