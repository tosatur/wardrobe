import "dotenv/config";
import { prisma } from "../src/index.js";

const colors: { name: string; hex: string }[] = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#808080" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Sky Blue", hex: "#7DD3FC" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Green", hex: "#16A34A" },
  { name: "Olive", hex: "#6B7A3A" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Red", hex: "#DC2626" },
  { name: "Burgundy", hex: "#7F1D1D" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Blush", hex: "#F4C2C2" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Lavender", hex: "#C4B5FD" },
  { name: "Brown", hex: "#78350F" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#E8DCC8" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Khaki", hex: "#A99A6B" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Mustard", hex: "#E1AD01" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Mint", hex: "#98D8C8" },
  { name: "Slate", hex: "#546E7A" },
];

const materials: string[] = [
  "Cotton",
  "Linen",
  "Wool",
  "Cashmere",
  "Silk",
  "Denim",
  "Leather",
  "Suede",
  "Polyester",
  "Nylon",
  "Spandex/Elastane",
  "Viscose/Rayon",
  "Fleece",
  "Corduroy",
  "Velvet",
  "Down",
  "Canvas",
  "Synthetic blend",
];

const categories: Record<string, string[]> = {
  Dress: ["A-line", "Maxi", "Midi", "Mini", "Wrap"],
  Tops: ["T-shirt", "Button-up", "Blouse", "Tank top", "Sweater", "Cardigan", "Hoodie"],
  Bottoms: ["Jeans", "Trousers", "Chinos", "Shorts", "Skirt", "Leggings"],
  Outerwear: ["Jacket", "Coat", "Trench coat", "Windbreaker", "Blazer", "Vest", "Parka"],
  Footwear: ["Sneakers", "Boots", "Loafers", "Sandals", "Slides", "Heels", "Flats"],
  Accessories: ["Belt", "Scarf", "Hat", "Gloves", "Tie", "Watch", "Bag", "Jewelry", "Sunglasses"],
  Activewear: ["Sports bra", "Leggings", "Running shorts", "Track jacket"],
  Sleepwear: ["Pyjama", "Robe", "Nightgown"],
  Swimwear: ["One-piece", "Bikini", "Swim trunks"],
  Suits: ["Two-piece", "Three-piece", "Waistcoat"],
};

const brands: string[] = [
  "Nike",
  "Adidas",
  "New Balance",
  "Converse",
  "Vans",
  "Dr. Martens",
  "Levi's",
  "Gap",
  "Uniqlo",
  "H&M",
  "Zara",
  "COS",
  "Everlane",
  "Muji",
  "Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Champion",
  "Carhartt",
  "Patagonia",
  "The North Face",
  "Acne Studios",
  "Aritzia",
  "Reformation",
  "Massimo Dutti",
  "Common Projects",
  "Burberry",
];

async function main() {
  for (const color of colors) {
    await prisma.color.upsert({
      where: { name: color.name },
      create: color,
      update: { hex: color.hex },
    });
  }
  console.log(`Seeded ${colors.length} colors.`);

  for (const name of materials) {
    await prisma.material.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log(`Seeded ${materials.length} materials.`);

  for (const name of brands) {
    await prisma.brand.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log(`Seeded ${brands.length} brands.`);

  let categoryCount = 0;
  for (const [parentName, children] of Object.entries(categories)) {
    // Prisma's client rejects an explicit `null` inside a compound-unique
    // `where` for a nullable field, so top-level categories (parentId is
    // genuinely null) can't use `upsert` the way child categories can.
    let parent = await prisma.category.findFirst({
      where: { parentId: null, name: parentName },
    });
    if (!parent) {
      parent = await prisma.category.create({ data: { name: parentName } });
    }
    categoryCount += 1;

    for (const childName of children) {
      await prisma.category.upsert({
        where: { parentId_name: { parentId: parent.id, name: childName } },
        create: { name: childName, parentId: parent.id },
        update: {},
      });
      categoryCount += 1;
    }
  }
  console.log(`Seeded ${categoryCount} categories.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
