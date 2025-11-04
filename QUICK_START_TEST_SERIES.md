# 🚀 Quick Start Guide - Test Series Feature

## ⚡ Get Running in 5 Minutes

### Step 1: Environment Setup (2 min)

Create `.env.local` file:

```bash
# Required - Get from https://neon.tech
DATABASE_URL="postgresql://user:password@hostname.neon.tech/database?sslmode=require"

# Required - Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="paste-your-32-character-secret-here"

# Required - Get from Google Cloud Console
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

# Required - Get from Google AI Studio
GEMINI_API_KEY="your-gemini-key"
```

### Step 2: Database Setup (2 min)

```powershell
# Push schema to database
npx prisma db push

# Seed with sample data
npx prisma db seed
```

### Step 3: Run & Test (1 min)

```powershell
# Start dev server
npm run dev

# Visit in browser
# 1. http://localhost:3001/test-series
# 2. Click any test series
# 3. Login with Google
# 4. Click "Enroll Free" on SSC CGL series
```

---

## ✅ What You Get

### Free Test Series (Ready to Use)
- **SSC CGL Tier 1 Free Test Series**
  - 10 full-length tests
  - 1000 questions
  - Completely free forever
  - Instant enrollment

### Premium Test Series (Sample Data)
- JEE Main 2024 Complete - ₹1,999
- JEE Main Physics Mastery - ₹699
- NEET 2024 Grand - ₹2,499

### PYQ Collections
- JEE Main PYQ (2015-2024) - ₹999
- NEET PYQ (2018-2024) - ₹799
- SSC CGL PYQ (2019-2023) - FREE

---

## 🎯 Testing Checklist

- [ ] Visit `/test-series` - See 4 test series
- [ ] Click "View Details" - See test series page
- [ ] Login with Google
- [ ] Click "Enroll Free" on SSC CGL
- [ ] See "Already Enrolled" badge
- [ ] Check Prisma Studio - See enrollment record

---

## 🔧 Common Commands

```powershell
# Regenerate Prisma Client
npx prisma generate

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Check for errors
npm run build
```

---

## 📁 Key Files to Know

### Pages
- `app/test-series/page.tsx` - List all test series
- `app/test-series/[slug]/page.tsx` - Test series details

### API
- `app/api/test-series/route.ts` - GET all series, POST create
- `app/api/test-series/[slug]/enroll/route.ts` - POST enroll

### Components
- `components/test-series/TestSeriesCard.tsx` - Series card
- `components/test-series/EnrollmentButton.tsx` - Enroll button

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Sample data

---

## 🎨 Customization

### Change Sample Data

Edit `prisma/seed.ts`:

```typescript
// Add your own test series
prisma.testSeries.create({
  data: {
    title: "Your Custom Test Series",
    price: 999,
    totalTests: 20,
    // ... more fields
  }
})
```

Then run: `npx prisma db seed`

### Add More Exams

Edit `prisma/seed.ts`:

```typescript
// Add new exam
prisma.exam.create({
  data: {
    name: "GATE 2024",
    slug: "gate-2024",
    categoryId: examCategories[0].id, // Engineering
  }
})
```

---

## 🐛 Troubleshooting

### "DATABASE_URL not found"
→ Create `.env.local` file with DATABASE_URL

### "Table does not exist"
→ Run `npx prisma db push`

### "No test series showing"
→ Run `npx prisma db seed`

### TypeScript errors
→ Run `npx prisma generate`

### Port 3001 already in use
→ Change port: `npm run dev -- -p 3002`

---

## 📞 Need Help?

1. Check `TEST_SERIES_IMPLEMENTATION_COMPLETE.md` for full docs
2. Open Prisma Studio: `npx prisma studio`
3. Check browser console (F12)
4. Check server logs in terminal

---

## 🎉 Next Steps

After testing the basic flow:

1. **Add More Tests**: Create tests and link them to series
2. **Add Payment**: Integrate Stripe/Razorpay
3. **Add Analytics**: Track user progress
4. **Add Certificates**: Generate completion certificates
5. **Add Mobile App**: Build React Native app

---

**You're all set!** 🚀

Visit `/test-series` and start enrolling!
