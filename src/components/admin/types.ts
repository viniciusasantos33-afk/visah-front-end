export type AdminSection =
  'tracks' | 'albums' | 'artists' | 'genres' | 'moods' | 'users';

export type AdminSectionItem = {
  id: AdminSection;
  label: string;
  icon: string;
};

export type AlbumDraftTrack = {
  key: number;
  title: string;
  genreId: string;
  moodId: string;
  file: File | null;
  duration: number | null;
  reading: boolean;
};
