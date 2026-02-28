import "./globals.css";

export const metadata = {
  title: "bnw-slop",
  description: "Black and white geometric web art",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
