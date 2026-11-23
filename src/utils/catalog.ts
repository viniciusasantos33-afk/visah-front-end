import { artistImage } from '../data/artists';
import type {
  ApiAlbum,
  ApiArtist,
  Album,
  Artist,
  Track,
} from '../types/catalog';

export function mapArtist(
  apiArtist: ApiArtist,
  tracks: Track[],
  albums: ApiAlbum[]
): Artist {
  const artistTracks = tracks.filter(
    (track) => track.artistId === apiArtist.id
  );
  const artistAlbums: Album[] = albums
    .filter((album) => album.artistId === apiArtist.id)
    .map((album) => ({
      id: album.id,
      title: album.title,
      artistId: album.artistId,
      artist: apiArtist.name,
      cover: album.coverUrl || artistImage(apiArtist.name, apiArtist.photoUrl),
      releaseDate: album.releaseDate ?? null,
      tracks: artistTracks.filter((track) => track.albumId === album.id),
    }));

  return {
    id: apiArtist.id,
    name: apiArtist.name,
    biography: apiArtist.biography ?? null,
    image: artistImage(apiArtist.name, apiArtist.photoUrl),
    listeners: apiArtist.playCount ?? 0,
    albums: artistAlbums,
    tracks: artistTracks.filter((track) => track.albumId === null),
  };
}
