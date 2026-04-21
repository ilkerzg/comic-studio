export type StyleEntry = {
  id: string;
  name: string;
  tagline: string;
  promptStub: string;
  palette: "mono" | "color";
  reference: string;
};

export const STYLES: StyleEntry[] = [
  {
    id: "shonen-bw",
    name: "Shonen Manga",
    tagline: "Black and white, dynamic lines, screentones.",
    promptStub:
      "Black and white shonen manga, dynamic ink lines, dramatic screentones, speed lines on motion, bold action composition, heavy contrast, expressive faces.",
    palette: "mono",
    reference: "/styles/shonen-bw.png",
  },
  {
    id: "shojo",
    name: "Shojo",
    tagline: "Soft, emotional, flower accents.",
    promptStub:
      "Shojo manga style, soft rounded lines, delicate eyes with large highlights, flower motif backgrounds, gentle screentones, emotional close-ups, airy compositions.",
    palette: "mono",
    reference: "/styles/shojo.png",
  },
  {
    id: "seinen",
    name: "Seinen",
    tagline: "Gritty ink, realistic proportions.",
    promptStub:
      "Seinen manga style, gritty ink work, realistic proportions, moody chiaroscuro, detailed urban backgrounds, restrained emotion, cinematic framing.",
    palette: "mono",
    reference: "/styles/seinen.png",
  },
  {
    id: "franco-belgian",
    name: "Franco-Belgian",
    tagline: "Clear line, flat color, warm panels.",
    promptStub:
      "Franco-Belgian clear line comic, even black outlines, flat local colors with subtle gradients, meticulous architectural backgrounds, warm palette, tidy panel composition.",
    palette: "color",
    reference: "/styles/franco-belgian.png",
  },
  {
    id: "moebius",
    name: "Classic Euro Sci-Fi",
    tagline: "Hairline ink, washed color, vast scale.",
    promptStub:
      "Classic European science fiction comic, hairline ink, washed-out pastel color, vast alien vistas, meticulous mechanical detail, dreamlike scale, muted palette.",
    palette: "color",
    reference: "/styles/moebius.png",
  },
  {
    id: "western-superhero",
    name: "American Comic",
    tagline: "Bold ink, saturated color, glossy pages.",
    promptStub:
      "Modern American comic book art style, bold ink outlines, heavy black shadows, saturated primary colors, expressive characters, tidy panel composition, glossy finish.",
    palette: "color",
    reference: "/styles/western-superhero.png",
  },
  {
    id: "chibi",
    name: "Chibi",
    tagline: "Super-deformed cute, big heads.",
    promptStub:
      "Chibi style comic, super-deformed characters, oversized heads, soft pastel palette, bouncy clean line, simple cheerful backgrounds, playful expression.",
    palette: "color",
    reference: "/styles/chibi.png",
  },
  {
    id: "ghibli",
    name: "Hand-Painted Anime",
    tagline: "Hand-painted warmth, soft light.",
    promptStub:
      "Hand-painted anime illustration, soft diffuse light, lush natural backgrounds, gentle color palette, watercolor texture, serene pastoral mood.",
    palette: "color",
    reference: "/styles/ghibli.png",
  },
];

export function styleById(id: string): StyleEntry | undefined {
  return STYLES.find((s) => s.id === id);
}
