// 담당: 공통기반

import { AuthHydrator } from "@/components/shared/AuthHydrator";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthHydrator />
        {children}
      </body>
    </html>
  );
}
