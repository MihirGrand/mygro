import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import ReactQueryProvider from '~/components/providers/ReactQueryProvider';
import { Toaster } from '~/components/ui/sonner';
import { Provider as JotaiProvider } from 'jotai';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | AndroSploit',
    default: 'AndroSploit',
  },
  description: 'Parental Control & Device Monitoring Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <JotaiProvider>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </JotaiProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
