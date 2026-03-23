import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FreshTrack',
  description: 'Track your grocery expiry dates with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body className={`${inter.className} relative`}>
        <ThemeProvider>
          <div className="mesh-bg" aria-hidden="true" />
          <AuthProvider>
            <main className="relative z-10 min-h-screen">
              {children}
            </main>
            <Navbar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

