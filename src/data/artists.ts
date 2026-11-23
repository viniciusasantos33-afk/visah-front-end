const localArtwork: Record<string, string> = {
  'charli xcx': 'charlie-xcx.png',
  'millo j': 'millo-j.png',
  'frank ocean': 'frank-ocean.png',
  rosalia: 'rosalia.png',
  'marina sena': 'marina-sena.png',
  jennie: 'jennie.png',
  'lady gaga': 'lady-gaga.png',
  bk: 'BK.png',
  'filho do piseiro': 'filho-do-piseiro.png',
  madonna: 'madonna.png',
  'tyler the creator': 'tyler-the-creator.png',
  'chico buarque': 'chico-buarque.png',
  'kendrick lamar': 'kendrick-lamar.png',
  'baco exu do blues': 'baco-exu-do-blues.png',
  djonga: 'djonga.png',
  hariel: 'hariel.png',
  'jorge ben': 'jorge-ben.png',
  laufey: 'laufey.png',
  'tasha e tracie': 'tasha-e-tracie.png',
  'tokyo dk': 'tokyo-dk.png',
};

function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function artistImage(name: string, photoUrl?: string | null) {
  if (photoUrl) return photoUrl;
  const filename = localArtwork[normalizeName(name)];
  return filename ? `/artists/${filename}` : '/profile-placeholder.svg';
}
