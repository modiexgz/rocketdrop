# RocketDrop 🚀

Fast delivery platform for food, drinks, grocery, pharmacy and fashion — built for Uganda with **Node.js, Express and EJS**.

## Features

### Customers
- Sign up / sign in, browse categories and products, search
- Order checkout with **Airtel Money**, **MTN Mobile Money** or Cash on Delivery
- Live **notification popups** (bell + toasts): order approval/decline, delivery man name/contact/location, payment confirmation, partner application decisions
- **My Orders** page with an animated delivery stage tracker (Placed → Approved → Preparing → Out for Delivery → Delivered)
- Apply to become a partner (restaurants, shops, pharmacies)

### Admin dashboard (`/admin`)
- **Category CRUD** and **Product CRUD**
- **Order CRUD** — create, edit, delete, approve/reject
- Approving an order sends the customer the **delivery man's full name, contact and location**
- Delivery stage management with customer notifications at every step
- **Payment confirmation** — confirm mobile money payments; the customer is notified instantly
- **Partner approval** — approve or decline partner applications; applicants are notified either way
- Notification bar highlighting pending orders, payments and partner applications
- **Orders report** — standalone page (no site header, orders table only) with **Print**, **Download PDF** and **Download Excel**

### Partner dashboard (`/partner/dashboard`)
- Available after admin approval (role upgrades automatically — no re-login needed)
- Own **category CRUD**, **product CRUD** and order stage management for partner products

## Getting started

```bash
npm install
npm start          # http://localhost:3000
```

Default admin account (seeded on first run):

- Email: `admin@rocketdrop.com`
- Password: `admin123`

Override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. Data is stored as JSON files in `data/` (created and seeded automatically).

## Project structure

```
server.js               # entry point
src/
  app.js                # express app setup
  config/               # configuration
  controllers/          # route handlers (auth, shop, admin, partner, reports)
  middleware/           # auth guards, view locals
  models/               # JSON file store, constants, seed data
  routes/               # express routers
  services/             # notification service
views/                  # EJS templates (partials, shop, admin, partner, auth)
public/                 # css, js, images, logo
scripts/                # utility scripts
data/                   # JSON data store (gitignored)
```
