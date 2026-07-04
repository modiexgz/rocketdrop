/**
 * Generates SVG artwork for products and categories.
 * Run once: node scripts/generate-placeholders.js
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "images");

const ITEMS = {
  // categories
  welcomeFood: { emoji: "🍔", from: "#ff9966", to: "#ff5e62", label: "Food & Drinks" },
  grocery: { emoji: "🛒", from: "#56ab2f", to: "#a8e063", label: "Grocery & Shop" },
  Pharmacy: { emoji: "💊", from: "#36d1dc", to: "#5b86e5", label: "Pharmacy" },
  fashion: { emoji: "👗", from: "#c33764", to: "#1d2671", label: "Fashion" },
  // food & drinks
  pizza: { emoji: "🍕", from: "#f7971e", to: "#ffd200", label: "Pizza" },
  burger: { emoji: "🍔", from: "#ff512f", to: "#dd2476", label: "Burger" },
  pasta: { emoji: "🍝", from: "#ffb347", to: "#ffcc33", label: "Pasta" },
  chicken: { emoji: "🍗", from: "#e96443", to: "#904e95", label: "Chicken" },
  fish: { emoji: "🐟", from: "#2193b0", to: "#6dd5ed", label: "Fish" },
  coke: { emoji: "🥤", from: "#cb2d3e", to: "#ef473a", label: "Coke" },
  wine: { emoji: "🍷", from: "#41295a", to: "#2f0743", label: "Wine" },
  // grocery
  milk: { emoji: "🥛", from: "#83a4d4", to: "#b6fbff", label: "Milk" },
  egg: { emoji: "🥚", from: "#f2994a", to: "#f2c94c", label: "Eggs" },
  apples: { emoji: "🍎", from: "#d31027", to: "#ea384d", label: "Apples" },
  grapes: { emoji: "🍇", from: "#7b4397", to: "#dc2430", label: "Grapes" },
  cabbage: { emoji: "🥬", from: "#11998e", to: "#38ef7d", label: "Cabbage" },
  // pharmacy
  bruffon: { emoji: "💊", from: "#4568dc", to: "#b06ab3", label: "Brufen" },
  paracitamol: { emoji: "🩹", from: "#00b09b", to: "#96c93d", label: "Paracetamol" },
  amoxcillin: { emoji: "🧪", from: "#5f2c82", to: "#49a09d", label: "Amoxicillin" },
  // fashion
  jeans: { emoji: "👖", from: "#141e30", to: "#243b55", label: "Jeans" },
  shoes: { emoji: "👟", from: "#8e2de2", to: "#4a00e0", label: "Shoes" },
  shirt: { emoji: "👔", from: "#02aab0", to: "#00cdac", label: "Shirt" },
  Tshirt: { emoji: "👕", from: "#fc466b", to: "#3f5efb", label: "T-Shirt" },
  dress: { emoji: "👗", from: "#ec008c", to: "#fc6767", label: "Dress" }
};

function svg({ emoji, from, to, label }, name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="440" viewBox="0 0 600 440">
  <defs>
    <linearGradient id="g-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow-${name}" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="600" height="440" fill="url(#g-${name})"/>
  <rect width="600" height="440" fill="url(#glow-${name})"/>
  <circle cx="80" cy="360" r="120" fill="rgba(255,255,255,0.06)"/>
  <circle cx="540" cy="70" r="90" fill="rgba(255,255,255,0.08)"/>
  <text x="300" y="215" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="300" y="350" font-size="34" font-weight="600" text-anchor="middle"
        font-family="-apple-system, 'Segoe UI', sans-serif" fill="rgba(255,255,255,0.95)">${label}</text>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
Object.entries(ITEMS).forEach(([name, cfg]) => {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg(cfg, name));
});
console.log(`Generated ${Object.keys(ITEMS).length} images in ${OUT}`);
