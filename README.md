# 團購拆帳 Web App

## 功能
- 建立團購事件
- 新增成員
- 新增商品
- 新增額外費用
- 依重量 / 平均分攤
- Firebase Firestore 即時同步
- 分享網址

## 安裝

```bash
npm install
```

## 啟動

```bash
npm run dev
```

## Firebase 設定

建立 `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

## 部署

推薦部署到 Vercel：

https://vercel.com