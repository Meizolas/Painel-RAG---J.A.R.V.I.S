import "./global.css";

export const metadata = {
  title: "JARVIS",
  description: "JARVIS - IA Avançada",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
