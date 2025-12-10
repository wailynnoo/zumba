# Admin API

**Fitness Dance App - Admin API**

API for admin panel operations.

---

## 🚀 Quick Start

### **Install Dependencies**

```bash
npm install
```

### **Environment Setup**

Copy `.env.example` to `.env` and configure:

```bash
copy .env.example .env
```

### **Run Development Server**

```bash
npm run dev
```

Server will run on `http://localhost:3002`

### **Build for Production**

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
admin-api/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts  # Prisma Client setup
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   ├── app.ts          # Express app setup
│   └── index.ts        # Entry point
├── .env                # Environment variables
├── tsconfig.json       # TypeScript config
└── package.json        # Dependencies
```

---

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests

---

## 🌐 API Endpoints

### **Health Check**

```
GET /health
```

Returns server status.

---

## 📝 Environment Variables

See `.env.example` for required environment variables.

---

**Ready for development!** 🎉

