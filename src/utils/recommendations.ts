import type { ClusterItem } from '../components/ArtistAlbumCluster';
import type { Track } from '../types/catalog';

export function buildRecommendations(
  visibleTracks: Track[],
  selected: Track | null,
  previousTrackIds: ReadonlySet<number>
): ClusterItem[] {
  if (!selected) return [];

  const candidates = visibleTracks.filter((track) => track.id !== selected.id);
  const albumKey = (track: Track) =>
    track.albumId == null ? `single-${track.id}` : `album-${track.albumId}`;
  const availableAlbumCount = new Set(candidates.map(albumKey)).size;
  const freshCandidates = candidates.filter(
    (track) => !previousTrackIds.has(track.id)
  );
  const freshAlbumCount = new Set(freshCandidates.map(albumKey)).size;
  const source =
    freshAlbumCount >= Math.min(9, availableAlbumCount)
      ? freshCandidates
      : candidates;
  const remaining = [...source].sort(
    (a, b) =>
      Number(b.moodId === selected.moodId) -
        Number(a.moodId === selected.moodId) ||
      Number(b.genreId === selected.genreId) -
        Number(a.genreId === selected.genreId) ||
      b.listeners - a.listeners
  );
  const recommendations: Track[] = [];
  const representedAlbums = new Set<string>();

  while (remaining.length && recommendations.length < 9) {
    let choices = remaining.filter(
      (track) => !representedAlbums.has(albumKey(track))
    );
    if (!choices.length) break;
    const previous = recommendations.at(-1);
    if (previous) {
      const differentArtist = choices.filter(
        (track) => track.artistId !== previous.artistId
      );
      if (differentArtist.length) choices = differentArtist;
    }
    const next = choices[0];
    recommendations.push(next);
    representedAlbums.add(albumKey(next));
    remaining.splice(
      remaining.findIndex((track) => track.id === next.id),
      1
    );
  }

  for (let index = recommendations.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [recommendations[index], recommendations[swapIndex]] = [
      recommendations[swapIndex],
      recommendations[index],
    ];
  }

  return recommendations.map((track) => ({
    id: `track-${track.id}`,
    name: track.title,
    image: track.image,
    listeners: track.listeners,
    type: 'track',
    track,
  }));
}
