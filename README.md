# Leads Automation System

מערכת אוטומטית לניהול לידים — Node.js + PostgreSQL, מוכן לפריסה ב-Railway.

## ארכיטקטורה

```
POST /webhook/lead
      │
      ▼
  webhookAuth  ←── Bearer token / X-Webhook-Secret / ?token=
      │
      ▼
  saveLead     ←── dedup via SHA-256(email|phone)
      │
      ▼
  runActions   ←── Rule Engine
      │
      ├── send_admin_email
      ├── send_welcome_email
      ├── send_admin_whatsapp
      ├── push_to_hubspot
      └── push_to_webhook
```

## התקנה

```bash
cd leads-automation
npm install
cp .env.example .env    # מלא את הפרטים
npm run db:migrate      # יצירת טבלאות
npm run dev             # פיתוח עם hot-reload
npm run build && npm start   # פרודקשן
```

## Endpoints

| Method | Path | Auth | תיאור |
|--------|------|------|-------|
| POST | `/webhook/lead` | token | קבלת ליד חדש |
| GET | `/admin/leads` | — | רשימת לידים |
| GET | `/admin/leads/:id/logs` | — | לוג פעולות לליד |
| GET | `/admin/stats` | — | סטטיסטיקות |
| GET | `/health` | — | בדיקת חיות |

## דוגמת קריאה

```bash
curl -X POST https://your-app.railway.app/webhook/lead \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ישראל ישראלי",
    "phone": "0501234567",
    "email": "israel@example.com",
    "source": "facebook",
    "campaign": "summer2024"
  }'
```

**תגובה:**
```json
{ "status": "created", "leadId": 42 }
```

אם הליד כבר קיים (אותו email/phone):
```json
{ "status": "duplicate", "leadId": 42 }
```

## חוקי אוטומציה (Rules)

ערוך את `src/rules/default-rules.ts` להוספת/שינוי חוקים:

```typescript
{
  name: 'Facebook leads → WhatsApp',
  conditions: [
    { field: 'source', operator: 'contains', value: 'facebook' }
  ],
  actions: [
    { type: 'send_admin_whatsapp' },
    { type: 'push_to_hubspot' }
  ],
  enabled: true,
}
```

### Conditions אפשריות

| field | operator | ערך |
|-------|----------|-----|
| `source` | `equals` / `contains` | string |
| `email` | `exists` / `not_exists` | — |
| `phone` | `exists` / `not_exists` | — |
| `data` | `has_key` | key name |
| `data` | `key_equals` | key + value |

### Actions אפשריות

| action | תיאור |
|--------|-------|
| `send_admin_email` | מייל לאדמין |
| `send_welcome_email` | מייל ברוכים הבאים ללידים עם email |
| `send_admin_whatsapp` | WhatsApp לאדמין (Twilio) |
| `push_to_hubspot` | שמירה ב-HubSpot CRM |
| `push_to_webhook` | שליחה ל-URL חיצוני (params.url נדרש) |

## חיבור Facebook Lead Ads

1. פתח [Meta Developer Portal](https://developers.facebook.com)
2. צור App → הוסף Leads Retrieval permission
3. הגדר Webhook עם URL: `https://your-app.railway.app/facebook-bridge`
4. הגדר `FACEBOOK_VERIFY_TOKEN` ו-`FB_PAGE_TOKEN` בסביבה
5. הוסף בקוד:
   ```js
   const fbBridge = require('./facebook-leads-bridge');
   app.use('/facebook-bridge', fbBridge);
   ```

## פריסה ב-Railway

```bash
# 1. צור פרויקט ב-railway.app
# 2. הוסף PostgreSQL service
# 3. הוסף את כל משתני הסביבה מ-.env.example
# 4. Railway מזהה Node.js אוטומטית ומריץ npm start
```

`DATABASE_URL` מסופק אוטומטית על ידי Railway כשמחברים PostgreSQL.
