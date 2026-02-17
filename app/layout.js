import "./globals.css";

export const metadata = {
  title: "Chess — Async Play",
  description: "Asynchronous online chess",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
