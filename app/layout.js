export const metadata = {
  title: "團購拆帳工具",
  description: "多人團購拆帳",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body style={{ fontFamily: "Arial", padding: "20px", background: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}