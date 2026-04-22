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
    id: "ink-wash",
    name: "Ink Wash",
    tagline: "Sumi-e brush, negative space.",
    promptStub:
      "Sumi-e inspired ink wash comic, expressive brushstrokes, minimal greyscale, generous negative space, calligraphic gesture, meditative tone.",
    palette: "mono",
    reference: "/styles/ink-wash.png",
  },
  {
    id: "line-art",
    name: "Line Art",
    tagline: "Pure ink, no shading, full white.",
    promptStub:
      "Completely redraw as pure line art on bright white paper, uniform hairline black ink contours only, absolutely no shading, no hatching, no gray tones, no color, no gradients, generous white negative space, clean minimal contour drawing, every panel a crisp line-only sketch.",
    palette: "mono",
    reference: "/styles/line-art.png",
  },
  {
    id: "woodcut",
    name: "Woodcut",
    tagline: "Carved bold blocks, graphic relief.",
    promptStub:
      "Completely redraw as a black and white woodcut relief print, chunky carved black shapes, rough chiseled white reveals, bold graphic silhouettes, heavy mark-making texture, high contrast with no gradients, visible grain from pressed ink, 1920s expressionist relief feel.",
    palette: "mono",
    reference: "/styles/woodcut.png",
  },
  {
    id: "halftone-bw",
    name: "Halftone Press",
    tagline: "Newsprint dots, stark two-tone.",
    promptStub:
      "Completely redraw in stark black and white halftone newspaper print, every gray replaced by visible round dot patterns of varying density, no screentone textures, no gradients, coarse dot pitch across skies and shadows, yellowed newsprint paper tone, vintage press feel.",
    palette: "mono",
    reference: "/styles/halftone-bw.png",
  },
  {
    id: "shonen-color",
    name: "Modern Shonen",
    tagline: "Cel-shaded color, bold outlines, vivid palette.",
    promptStub:
      "Modern colored shonen manga, bold black outlines, cel-shaded palette with vivid accent colors, energetic motion lines, bright dynamic backgrounds, confident readable composition.",
    palette: "color",
    reference: "/styles/shonen-color.png",
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
    id: "golden-age",
    name: "Golden Age",
    tagline: "1940s CMYK, newsprint texture.",
    promptStub:
      "1940s golden age superhero comic, thick ink outlines, limited flat CMYK palette, newsprint grain, dramatic heroic poses, period accurate starbursts and captions.",
    palette: "color",
    reference: "/styles/golden-age.png",
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
    id: "cyberpunk",
    name: "Cyberpunk",
    tagline: "Neon rim light, wet streets.",
    promptStub:
      "Cyberpunk neon noir comic, glowing magenta and cyan rim lights, reflective wet streets, holographic signage, high-tech urban clutter, heavy blacks with saturated accents.",
    palette: "color",
    reference: "/styles/cyberpunk.png",
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
    id: "graffiti-street",
    name: "Graffiti Street",
    tagline: "Spray texture, urban typography.",
    promptStub:
      "Street art graffiti comic, spray paint textures, dripping stencil shapes, bold urban typography, contrasting hot colors, concrete and wheatpaste backgrounds.",
    palette: "color",
    reference: "/styles/graffiti-street.png",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    tagline: "Cyanotype, white technical line.",
    promptStub:
      "Completely redraw as a blueprint schematic, deep cyan blue background covering every panel, all linework as white technical drafting strokes, grid overlays and measurement annotations, drafted construction lines, no photographic shading, every element reinterpreted as an engineering diagram.",
    palette: "color",
    reference: "/styles/blueprint.png",
  },
  {
    id: "ukiyo-e",
    name: "Ukiyo-e",
    tagline: "Woodblock flats, mineral pigments.",
    promptStub:
      "Completely redraw as a Japanese ukiyo-e woodblock print, flat mineral pigment fills in ochre, indigo, cream and muted crimson, sumi ink contours, stylized cloud and wave patterns replacing realistic sky and water, traditional tori and textile motifs, no photographic depth, nihonga composition.",
    palette: "color",
    reference: "/styles/ukiyo-e.png",
  },
  {
    id: "crayon",
    name: "Crayon Sketch",
    tagline: "Wax crayon texture, warm paper.",
    promptStub:
      "Completely redraw as a wax crayon illustration on warm toned paper, visible crayon strokes and waxy grain, scribbled shading instead of smooth gradients, hand-drawn wobbly childlike contours, naive color mixing, paper fiber texture showing through, sketchbook feel.",
    palette: "color",
    reference: "/styles/crayon.png",
  },
];

export function styleById(id: string): StyleEntry | undefined {
  return STYLES.find((s) => s.id === id);
}
