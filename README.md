# MyFiles SaaS - ניהול מסמכים חכם

מערכת מתקדמת לניהול, ארגון וחיפוש מסמכים עם תמיכה מלאה ב-PDF, Word ועוד.

## ✨ תכונות עיקריות

- 📁 **העלאת מסמכים** - תמיכה ב-PDF, Word, Excel, PowerPoint ועוד
- 🔍 **חיפוש מתקדם** - חיפוש בתוכן המסמכים עצמם
- 📊 **ארגון חכם** - קטגוריות, תגיות ומיון אוטומטי
- 👁️ **צפייה מובנית** - צפייה ב-PDF ללא הורדה
- 🔐 **אבטחה מלאה** - הצפנה ואימות מתקדם
- 📱 **Responsive** - עובד מושלם על כל המכשירים

## 🚀 טכנולוגיות

- **Frontend:** React + Vite + Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Hosting:** Netlify
- **PDF Processing:** PDF.js

## 🛠️ הגדרת הפרויקט

### דרישות מוקדמות
- Node.js 18+
- npm או yarn
- חשבון Supabase (חינמי)
- חשבון Netlify (חינמי)

### התקנה מקומית

1. **Clone הפרויקט:**
\`\`\`bash
git clone https://github.com/972cfe-dotcom/myfiles-saas.git
cd myfiles-saas
\`\`\`

2. **התקן dependencies:**
\`\`\`bash
npm install
\`\`\`

3. **הגדר Supabase:**
   - צור פרויקט חדש ב-[Supabase](https://supabase.com)
   - רוץ את ה-SQL schema מ-\`database/fix-schema.sql\` ב-SQL Editor
   - צור 2 Storage buckets: \`documents\` (private) ו-\`thumbnails\` (public)

4. **הגדר Environment Variables:**
\`\`\`bash
cp .env.example .env.local
\`\`\`

עדכן את \`.env.local\` עם הערכים שלך מSupabase:
\`\`\`
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
\`\`\`

5. **הרץ בפיתוח:**
\`\`\`bash
npm run dev
\`\`\`

### פריסה לProduction

#### Netlify (מומלץ):
1. Fork הפרויקט לGitHub שלך
2. חבר את Netlify לGitHub
3. הוסף Environment Variables ב-Netlify:
   - \`VITE_SUPABASE_URL\`
   - \`VITE_SUPABASE_ANON_KEY\`
4. Deploy!

#### Vercel:
1. \`npm install -g vercel\`
2. \`vercel --prod\`
3. הוסף Environment Variables דרך Vercel Dashboard

## 🗄️ מבנה בסיס הנתונים

הפרויקט כולל 7 טבלאות עיקריות:

- \`users\` - פרופילי משתמשים
- \`documents\` - מטא-דאטה של מסמכים
- \`categories\` - קטגוריות אישיות
- \`tags\` - מערכת תיוג גמישה
- \`document_tags\` - קשר many-to-many
- \`search_history\` - היסטוריית חיפושים
- \`user_settings\` - העדפות משתמש

כל הטבלאות מוגנות ב-Row Level Security (RLS) עם policies מפורטות.

## 🔐 אבטחה

- **Authentication:** Supabase Auth עם JWT tokens
- **Authorization:** Row Level Security על כל הטבלאות
- **File Access:** Signed URLs עם expiration
- **CORS:** מוגדר רק לdomains מאושרים
- **Environment Variables:** כל המפתחות מוגנים

## 📁 מבנה הפרויקט

\`\`\`
src/
├── components/          # רכיבי React
│   ├── auth/           # רכיבי התחברות
│   ├── common/         # רכיבים משותפים
│   ├── documents/      # רכיבי מסמכים
│   ├── ui/             # רכיבי UI בסיסיים
│   └── viewer/         # רכיבי צפייה
├── services/           # שירותי API
├── lib/                # הגדרות ו-utilities
├── pages/              # דפי האפליקציה
└── utils/              # פונקציות עזר
\`\`\`

## 🤝 תרומה

1. Fork הפרויקט
2. צור branch חדש (\`git checkout -b feature/amazing-feature\`)
3. Commit השינויים (\`git commit -m 'Add amazing feature'\`)
4. Push ל-branch (\`git push origin feature/amazing-feature\`)
5. פתח Pull Request

## 📄 רישיון

הפרויקט מוגן תחת רישיון MIT. ראה \`LICENSE\` לפרטים.

## 💡 תמיכה

- 📧 **Email:** support@myfiles-saas.com  
- 💬 **Discord:** [הצטרף לשרת שלנו](https://discord.gg/myfiles)
- 📖 **Documentation:** [docs.myfiles-saas.com](https://docs.myfiles-saas.com)

## 🎯 Roadmap

- [ ] AI-powered document analysis
- [ ] OCR לטקסט מתמונות
- [ ] תמיכה בשפות נוספות
- [ ] Mobile App (React Native)
- [ ] API לintegrations חיצוניים
- [ ] Advanced analytics dashboard

---

**בנוי באהבה 💖 עם React + Supabase**