// 담당: 공통기반

import { AuthProvider } from "@/components/shared/AuthProvider";
import { FcmTokenSync } from "@/components/shared/notification/FcmTokenSync";
import { NotificationToast } from "@/components/shared/notification/NotificationToast";

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
          <FcmTokenSync />
          <NotificationToast />
        </AuthProvider>
      </body>
    </html>
  );
}
