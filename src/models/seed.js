const bcrypt = require("bcryptjs");
const db = require("./db");
const config = require("../config");

const DEFAULT_CATEGORIES = [
  { name: "Food & Drinks", description: "Meals, snacks and drinks delivered hot and fresh.", image: "/images/welcomeFood.svg", ownerType: "admin", ownerId: null },
  { name: "Grocery & Shop", description: "Everyday groceries from stores near you.", image: "/images/grocery.svg", ownerType: "admin", ownerId: null },
  { name: "Pharmacy", description: "Medicine and health essentials.", image: "/images/Pharmacy.svg", ownerType: "admin", ownerId: null },
  { name: "Fashion", description: "Clothes, shoes and accessories.", image: "/images/fashion.svg", ownerType: "admin", ownerId: null }
];

const DEFAULT_PRODUCTS = [
  { name: "Pizza", price: 25000, category: "Food & Drinks", image: "/images/pizza.svg" },
  { name: "Burger", price: 18000, category: "Food & Drinks", image: "/images/burger.svg" },
  { name: "Pasta", price: 22000, category: "Food & Drinks", image: "/images/pasta.svg" },
  { name: "Chicken", price: 30000, category: "Food & Drinks", image: "/images/chicken.svg" },
  { name: "Fish", price: 28000, category: "Food & Drinks", image: "/images/fish.svg" },
  { name: "Coke", price: 3000, category: "Food & Drinks", image: "/images/coke.svg" },
  { name: "Wine", price: 40000, category: "Food & Drinks", image: "/images/wine.svg" },
  { name: "Milk", price: 4000, category: "Grocery & Shop", image: "/images/milk.svg" },
  { name: "Eggs", price: 12000, category: "Grocery & Shop", image: "/images/egg.svg" },
  { name: "Apples", price: 10000, category: "Grocery & Shop", image: "/images/apples.svg" },
  { name: "Grapes", price: 15000, category: "Grocery & Shop", image: "/images/grapes.svg" },
  { name: "Cabbage", price: 3000, category: "Grocery & Shop", image: "/images/cabbage.svg" },
  { name: "Brufen", price: 8000, category: "Pharmacy", image: "/images/bruffon.svg" },
  { name: "Paracetamol", price: 3000, category: "Pharmacy", image: "/images/paracitamol.svg" },
  { name: "Amoxicillin", price: 12000, category: "Pharmacy", image: "/images/amoxcillin.svg" },
  { name: "Jeans", price: 45000, category: "Fashion", image: "/images/jeans.svg" },
  { name: "Shoes", price: 80000, category: "Fashion", image: "/images/shoes.svg" },
  { name: "Shirt", price: 35000, category: "Fashion", image: "/images/shirt.svg" },
  { name: "T-Shirt", price: 25000, category: "Fashion", image: "/images/Tshirt.svg" },
  { name: "Dress", price: 60000, category: "Fashion", image: "/images/dress.svg" }
];

function seedIfEmpty() {
  db.ensureStore();

  const users = db.readAll("users");
  if (!users.some((u) => u.role === "admin")) {
    db.insert("users", {
      fullName: config.admin.fullName,
      email: config.admin.email,
      phone: config.admin.phone,
      password: bcrypt.hashSync(config.admin.password, 10),
      role: "admin"
    });
    console.log(`Seeded admin account: ${config.admin.email} / ${config.admin.password}`);
  }

  if (db.readAll("categories").length === 0) {
    DEFAULT_CATEGORIES.forEach((c) => db.insert("categories", c));
    console.log("Seeded default categories.");
  }

  if (db.readAll("products").length === 0) {
    const categories = db.readAll("categories");
    DEFAULT_PRODUCTS.forEach((p) => {
      const category = categories.find((c) => c.name === p.category);
      db.insert("products", {
        name: p.name,
        price: p.price,
        image: p.image,
        description: `${p.name} — delivered fast by RocketDrop.`,
        categoryId: category ? category.id : null,
        ownerType: "admin",
        ownerId: null
      });
    });
    console.log("Seeded default products.");
  }
}

module.exports = { seedIfEmpty };
