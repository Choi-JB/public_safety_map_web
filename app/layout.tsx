// 담당: 공통기반

import { AuthProvider } from "@/components/shared/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0}}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
