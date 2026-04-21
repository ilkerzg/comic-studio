export type LibraryExample = {
  id: string;
  title: string;
  format: "manga" | "comic" | "webtoon";
  cover: string;
  note: string;
  blurb: string;
};

export const LIBRARY_EXAMPLES: LibraryExample[] = [
  {
    id: "shonen-bw",
    title: "Shonen Chase",
    format: "manga",
    cover: "/styles/shonen-bw.png",
    note: "Built-in reference",
    blurb: "High-energy black-and-white action framing for manga-style stories.",
  },
  {
    id: "shojo",
    title: "Shojo Confession",
    format: "manga",
    cover: "/styles/shojo.png",
    note: "Built-in reference",
    blurb: "Soft emotional close-ups and romantic pacing cues.",
  },
  {
    id: "seinen",
    title: "Night Shift",
    format: "manga",
    cover: "/styles/seinen.png",
    note: "Built-in reference",
    blurb: "Gritty urban mood with restrained cinematic compositions.",
  },
  {
    id: "franco-belgian",
    title: "City Run",
    format: "comic",
    cover: "/styles/franco-belgian.png",
    note: "Built-in reference",
    blurb: "Clear-line adventure look with calm readable paneling.",
  },
  {
    id: "moebius",
    title: "Dust Planet",
    format: "comic",
    cover: "/styles/moebius.png",
    note: "Built-in reference",
    blurb: "Washed color sci-fi atmospheres and wide environmental scale.",
  },
  {
    id: "western-superhero",
    title: "Impact Frame",
    format: "comic",
    cover: "/styles/western-superhero.png",
    note: "Built-in reference",
    blurb: "Bold pulp-color energy tuned for comic-book spectacle.",
  },
];
