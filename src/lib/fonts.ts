import {
  Archivo_Black,
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Fraunces,
  Geist,
  Inter,
  Lora,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

// App UI fonts (preloaded).
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz", "SOFT"] });

// Restaurant menu fonts: only downloaded when a menu actually uses them.
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});
const dmSerif = DM_Serif_Display({ subsets: ["latin"], variable: "--font-dm-serif", weight: "400", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false });
const archivoBlack = Archivo_Black({ subsets: ["latin"], variable: "--font-archivo-black", weight: "400", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", preload: false });

export const fontVariables = [geist, fraunces, playfair, cormorant, dmSerif, lora, archivoBlack, spaceGrotesk, inter, dmSans]
  .map((f) => f.variable)
  .join(" ");
