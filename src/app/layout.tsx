import type { Metadata } from 'next';
import { MUIProvider } from './providers/mui-provider';
import { NeonAuthProvider } from './providers/neon-auth-provider';
import { DefaultLayout } from '~/components/DefaultLayout';
import '~/styles/globals.css';

export const metadata: Metadata = {
  title: 'Klip - Maintenance des voies d\'escalade',
  description: 'Site de contrôle et de maintenance des voies d\'escalade',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <NeonAuthProvider>
          <MUIProvider>
            <DefaultLayout>{children}</DefaultLayout>
          </MUIProvider>
        </NeonAuthProvider>
      </body>
    </html>
  );
}
