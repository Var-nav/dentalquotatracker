export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    purple: string;
    orange: string;
    green: string;
    yellow: string;
    red: string;
    teal: string;
    pink: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "vibrant",
    name: "Vibrant Rainbow",
    description: "Bold, energetic colors for maximum visual impact",
    colors: {
      primary: "220 90% 56%",
      secondary: "262 83% 58%",
      accent: "280 65% 60%",
      purple: "262 83% 58%",
      orange: "25 95% 53%",
      green: "142 76% 36%",
      yellow: "48 96% 53%",
      red: "0 84% 60%",
      teal: "174 72% 56%",
      pink: "330 81% 60%",
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Calming blues and teals inspired by the sea",
    colors: {
      primary: "199 89% 48%",
      secondary: "187 71% 50%",
      accent: "193 82% 31%",
      purple: "240 50% 60%",
      orange: "190 75% 45%",
      green: "174 72% 56%",
      yellow: "185 80% 60%",
      red: "200 70% 50%",
      teal: "174 72% 56%",
      pink: "195 85% 55%",
    },
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Warm oranges, pinks, and purples like a sunset",
    colors: {
      primary: "14 90% 53%",
      secondary: "340 82% 52%",
      accent: "280 70% 55%",
      purple: "280 70% 55%",
      orange: "25 95% 53%",
      green: "35 90% 48%",
      yellow: "48 96% 53%",
      red: "0 84% 60%",
      teal: "15 85% 50%",
      pink: "330 81% 60%",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural greens and earthy tones for a calm feel",
    colors: {
      primary: "142 71% 45%",
      secondary: "158 64% 52%",
      accent: "120 50% 40%",
      purple: "160 60% 45%",
      orange: "142 71% 45%",
      green: "142 76% 36%",
      yellow: "152 65% 50%",
      red: "135 70% 48%",
      teal: "174 72% 56%",
      pink: "145 75% 55%",
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Regal purples and deep blues for sophistication",
    colors: {
      primary: "262 83% 58%",
      secondary: "280 65% 60%",
      accent: "270 70% 50%",
      purple: "262 83% 58%",
      orange: "270 60% 55%",
      green: "255 75% 60%",
      yellow: "275 65% 58%",
      red: "280 70% 50%",
      teal: "250 80% 60%",
      pink: "290 75% 58%",
    },
  },
  {
    id: "medical",
    name: "Medical Blue",
    description: "Professional medical-grade blue theme",
    colors: {
      primary: "210 100% 56%",
      secondary: "200 90% 48%",
      accent: "215 85% 50%",
      purple: "220 75% 55%",
      orange: "205 80% 52%",
      green: "210 70% 50%",
      yellow: "215 85% 58%",
      red: "208 90% 55%",
      teal: "195 85% 54%",
      pink: "215 80% 60%",
    },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Elegant grayscale with subtle color accents",
    colors: {
      primary: "240 5% 34%",
      secondary: "240 5% 26%",
      accent: "240 5% 41%",
      purple: "262 30% 50%",
      orange: "25 30% 50%",
      green: "142 30% 45%",
      yellow: "48 30% 50%",
      red: "0 30% 50%",
      teal: "174 30% 50%",
      pink: "330 30% 50%",
    },
  },
  {
    id: "pastel",
    name: "Soft Pastel",
    description: "Gentle pastel colors for a soothing experience",
    colors: {
      primary: "200 80% 70%",
      secondary: "280 60% 75%",
      accent: "160 50% 70%",
      purple: "280 60% 75%",
      orange: "25 80% 70%",
      green: "142 60% 65%",
      yellow: "48 80% 75%",
      red: "0 70% 75%",
      teal: "174 60% 70%",
      pink: "330 70% 75%",
    },
  },
];

export function applyThemeColors(colors: ThemePreset["colors"]) {
  const root = document.documentElement;
  
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--purple", colors.purple);
  root.style.setProperty("--orange", colors.orange);
  root.style.setProperty("--green", colors.green);
  root.style.setProperty("--yellow", colors.yellow);
  root.style.setProperty("--red", colors.red);
  root.style.setProperty("--teal", colors.teal);
  root.style.setProperty("--pink", colors.pink);
}
