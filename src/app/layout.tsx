import type { Metadata } from 'next';
import { MUIProvider } from './providers/mui-provider';
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
    <html lang="fr">
      <body>
        <MUIProvider>
          <DefaultLayout>{children}</DefaultLayout>
        </MUIProvider>
      </body>
    </html>
  );
}
