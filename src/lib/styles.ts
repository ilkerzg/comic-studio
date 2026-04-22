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
    id: "shonen-color",
    name: "Modern Shonen",
    tagline: "Cel-shaded color, bold outlines, saturated punch.",
    promptStub:
      "Modern colored shonen manga, bold black outlines, cel-shaded palette with saturated pops, dynamic speed lines, vibrant action-ready backgrounds, confident readable composition.",
    palette: "color",
    reference: "/styles/shonen-color.png",
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
    id: "josei",
    name: "Josei",
    tagline: "Refined line, muted adult palette.",
    promptStub:
      "Josei manga style, refined delicate line work, muted adult palette, nuanced facial expressions, elegant fashion and interiors, quiet emotional compositions.",
    palette: "mono",
    reference: "/styles/josei.png",
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
    id: "horror-manga",
    name: "Horror Manga",
    tagline: "Obsessive hatching, stark dread.",
    promptStub:
      "Junji Ito inspired horror manga, obsessive ink hatching and crosshatching, unsettling organic detail, stark black and white contrast, dread-filled compositions.",
    palette: "mono",
    reference: "/styles/horror-manga.png",
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
    id: "manhwa-webtoon",
    name: "Manhwa",
    tagline: "Digital gloss, blended gradients.",
    promptStub:
      "Korean manhwa illustration, crisp digital line art, soft blended color gradients, glossy highlights on hair and eyes, clean modern composition.",
    palette: "color",
    reference: "/styles/manhwa-webtoon.png",
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
    name: "Pop Comic",
    tagline: "Halftone dots, thick ink, pulp mood.",
    promptStub:
      "Pop comic book illustration, dotted halftone backgrounds, thick black outlines, saturated primary color palette, clean panel composition, pulp mood.",
    palette: "color",
    reference: "/styles/western-superhero.png",
  },
  {
    id: "golden-age",
    name: "Golden Age",
    tagline: "1940s CMYK, newsprint texture.",
    promptStub:
      "1940s golden age superhero comic, thick ink outlines, limited flat CMYK palette, newsprint grain, dramatic heroic poses, period accurate starbursts and captions.",
    palette: "color",
    reference: "/styles/golden-age.png",
  },
  {
    id: "graphic-novel",
    name: "Graphic Novel",
    tagline: "Painterly grey tones, serious.",
    promptStub:
      "Modern graphic novel ink work, muted naturalistic color, painterly grey tones, serious adult framing, fine line detail, subdued realistic palette.",
    palette: "color",
    reference: "/styles/graphic-novel.png",
  },
  {
    id: "noir",
    name: "Noir",
    tagline: "Hard shadows, rain, chiaroscuro.",
    promptStub:
      "Black and white film noir comic, high contrast chiaroscuro, heavy solid black shadows, rain and smoke textures, cinematic low-key lighting, venetian blind slats.",
    palette: "mono",
    reference: "/styles/noir.png",
  },
  {
    id: "underground-comix",
    name: "Underground Comix",
    tagline: "Scratchy ink, 60s counterculture.",
    promptStub:
      "1960s underground comix style, scratchy hand-drawn ink, dense crosshatching, exaggerated caricatured characters, crowded chaotic panels, warm off-white newsprint paper.",
    palette: "mono",
    reference: "/styles/underground-comix.png",
  },
  {
    id: "newspaper-strip",
    name: "Newspaper Strip",
    tagline: "Sunday funnies, benday dots.",
    promptStub:
      "Sunday newspaper comic strip, clean cartoon line, flat benday dot coloring, cheerful expressions, simple backgrounds, limited bright palette, warm paper tone.",
    palette: "color",
    reference: "/styles/newspaper-strip.png",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    tagline: "Wet-on-wet washes, airy light.",
    promptStub:
      "Watercolor illustrated comic, soft wet on wet color washes, visible paper grain, light pencil ink contours, gentle daylight, airy poetic mood.",
    palette: "color",
    reference: "/styles/watercolor.png",
  },
  {
    id: "ink-wash",
    name: "Ink Wash",
    tagline: "Sumi-e brush, negative space.",
    promptStub:
      "Sumi-e inspired ink wash comic, expressive brushstrokes, minimal greyscale, generous negative space, calligraphic gesture, meditative tone.",
    palette: "mono",
    reference: "/styles/ink-wash.png",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    tagline: "Neon rim light, wet streets.",
    promptStub:
      "Cyberpunk neon noir comic, glowing magenta and cyan rim lights, reflective wet streets, holographic signage, high-tech urban clutter, heavy blacks with saturated accents.",
    palette: "color",
    reference: "/styles/cyberpunk.png",
  },
  {
    id: "retro-pulp",
    name: "Retro Pulp",
    tagline: "1950s EC, misregistered CMYK.",
    promptStub:
      "Retro 1950s pulp comic, CMYK offset print with slight registration misalignment, aged paper tone, melodramatic compositions, pulpy color palette, halftone skies.",
    palette: "color",
    reference: "/styles/retro-pulp.png",
  },
  {
    id: "risograph",
    name: "Risograph",
    tagline: "Two-tone grain, off-register.",
    promptStub:
      "Risograph print look, two-tone layered flat colors (fluorescent pink and blue), visible grain, off-register overlap, chunky simplified shapes, handmade zine feel.",
    palette: "color",
    reference: "/styles/risograph.png",
  },
  {
    id: "dark-fantasy",
    name: "Dark Fantasy",
    tagline: "Engraved ink, medieval gloom.",
    promptStub:
      "Dark fantasy ink etching style, dense crosshatching, engraved texture, grim medieval mood, monochrome ink tones, atmospheric gloom, fine feather-weight lines.",
    palette: "mono",
    reference: "/styles/dark-fantasy.png",
  },
  {
    id: "pastel-slice",
    name: "Pastel Slice of Life",
    tagline: "Cozy pastel, gentle pencil line.",
    promptStub:
      "Soft slice of life comic, pale pastel palette, gentle pencil line, cozy domestic spaces, muted natural light, calm and heartwarming tone.",
    palette: "color",
    reference: "/styles/pastel-slice.png",
  },
  {
    id: "pixel-art",
    name: "Pixel Art",
    tagline: "16-bit crunch, arcade nostalgia.",
    promptStub:
      "Pixel art comic page, 16 bit era aesthetic, crisp pixel outlines, limited indexed palette, blocky shadow and highlight, arcade nostalgia.",
    palette: "color",
    reference: "/styles/pixel-art.png",
  },
  {
    id: "kids-cartoon",
    name: "Kids Cartoon",
    tagline: "Friendly outlines, bright joy.",
    promptStub:
      "Children's cartoon comic, thick friendly outlines, bright cheerful colors, rounded shapes, simple expressive faces, playful tone, clear storytelling.",
    palette: "color",
    reference: "/styles/kids-cartoon.png",
  },
  {
    id: "graffiti-street",
    name: "Graffiti Street",
    tagline: "Spray texture, urban typography.",
    promptStub:
      "Street art graffiti comic, spray paint textures, dripping stencil shapes, bold urban typography, contrasting hot colors, concrete and wheatpaste backgrounds.",
    palette: "color",
    reference: "/styles/graffiti-street.png",
  },
  {
    id: "gothic-ink",
    name: "Gothic Ink",
    tagline: "Cathedral blacks, velvet dread.",
    promptStub:
      "Gothic horror ink comic, intricate cathedral backgrounds, candlelit shadows, velvet blacks, ornamental borders, dread and melancholy atmosphere.",
    palette: "mono",
    reference: "/styles/gothic-ink.png",
  },
];

export function styleById(id: string): StyleEntry | undefined {
  return STYLES.find((s) => s.id === id);
}
