import type { CSSProperties } from 'react';

type CircularFiltersProps = {
  genres: string[];
  moods: string[];
  genre: string;
  mood: string;
  onGenreChange: (value: string) => void;
  onMoodChange: (value: string) => void;
};

type OrbitItem = {
  label: string;
  angle: number;
  side: 'left' | 'right';
  active: boolean;
  hidden: boolean;
  onClick: () => void;
};

const orbitRadius = 47;
const orbitStep = 3.4;

function tangentRotation(angle: number) {
  const tangent = angle + 90;
  const normalized = ((((tangent + 180) % 360) + 360) % 360) - 180;
  const readableAngle =
    normalized > 90
      ? normalized - 180
      : normalized < -90
        ? normalized + 180
        : normalized;
  return Math.max(-18, Math.min(18, readableAngle));
}

function OrbitButton({
  label,
  angle,
  side,
  active,
  hidden,
  onClick,
}: OrbitItem) {
  const radians = (angle * Math.PI) / 180;
  const x = 50 + orbitRadius * Math.cos(radians);
  const y = 50 + orbitRadius * Math.sin(radians);
  const rotation = active ? 0 : tangentRotation(angle);

  return (
    <button
      className={`orbit-filter ${side} ${active ? 'selected' : ''}`}
      style={
        {
          left: `${x}%`,
          top: `${y}%`,
          '--orbit-rotation': `${rotation}deg`,
        } as CSSProperties
      }
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      disabled={hidden}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function CircularFilters({
  genres,
  moods,
  genre,
  mood,
  onGenreChange,
  onMoodChange,
}: CircularFiltersProps) {
  const genreIndex = Math.max(0, genres.indexOf(genre));
  const moodIndex = Math.max(0, moods.indexOf(mood));
  const relativeIndex = (
    index: number,
    selectedIndex: number,
    length: number
  ) => {
    let relative = index - selectedIndex;
    if (relative > length / 2) relative -= length;
    if (relative < -length / 2) relative += length;
    return relative;
  };

  const genreButtons = genres.map((label, index) => ({
    label,
    angle: 180 - relativeIndex(index, genreIndex, genres.length) * orbitStep,
    side: 'left' as const,
    active: genre === label,
    hidden: Math.abs(relativeIndex(index, genreIndex, genres.length)) > 2,
    onClick: () => onGenreChange(label),
  }));
  const moodButtons = moods.map((label, index) => ({
    label,
    angle: relativeIndex(index, moodIndex, moods.length) * orbitStep,
    side: 'right' as const,
    active: mood === label,
    hidden: Math.abs(relativeIndex(index, moodIndex, moods.length)) > 2,
    onClick: () => onMoodChange(label),
  }));

  return (
    <div className="orbit-filters" aria-label="Filtros do catálogo">
      <div className="orbit-group orbit-genres" aria-label="Gêneros musicais">
        {genreButtons.map((item) => (
          <OrbitButton key={item.label} {...item} />
        ))}
      </div>
      <div className="orbit-group orbit-moods" aria-label="Climas musicais">
        {moodButtons.map((item) => (
          <OrbitButton key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}
