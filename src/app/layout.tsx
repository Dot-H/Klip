import type { Metadata } from 'next';
import { MUIProvider } from './providers/mui-provider';
import { DefaultLayout } from '~/components/DefaultLayout';
import '~/styles/globals.css';

export const metadata: Metadata = {
  title: 'Klip - Climbing Route Tracker',
  description: 'Track your climbing routes and maintenance with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MUIProvider>
          <DefaultLayout>{children}</DefaultLayout>
        </MUIProvider>
      </body>
    </html>
  );
}
