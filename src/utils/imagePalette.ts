export type ImagePalette = { accent: string; colors: string[] };

const paletteCache = new Map<string, Promise<ImagePalette>>();

export function extractImagePalette(imageUrl: string): Promise<ImagePalette> {
  const cached = paletteCache.get(imageUrl);
  if (cached) return cached;

  const result = new Promise<ImagePalette>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas indisponível');

        canvas.width = 48;
        canvas.height = 48;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ).data;
        const bins = new Map<string, { count: number; score: number }>();

        for (let i = 0; i < pixels.length; i += 16) {
          const red = pixels[i];
          const green = pixels[i + 1];
          const blue = pixels[i + 2];
          const high = Math.max(red, green, blue);
          const low = Math.min(red, green, blue);
          const lightness = (high + low) / 510;
          if (lightness < 0.15 || lightness > 0.9) continue;

          const saturation = high === 0 ? 0 : (high - low) / high;
          const key = [red, green, blue]
            .map((channel) => Math.round(channel / 32) * 32)
            .map((channel) => Math.min(channel, 255))
            .join(',');
          const bin = bins.get(key) ?? { count: 0, score: 0 };
          bin.count += 1;
          bin.score += 1 + saturation * 0.45;
          bins.set(key, bin);
        }

        const colors = [...bins.entries()]
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, 5)
          .map(([rgb]) => `rgb(${rgb})`);
        resolve({ accent: colors[0] ?? '#b6a389', colors });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('Não foi possível ler a imagem'));
    image.src = imageUrl;
  });

  paletteCache.set(imageUrl, result);
  return result;
}
