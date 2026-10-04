import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Kantor Raffa — 3D Virtual AI Office & Autonomous Mission Control',
  description:
    'Kantor Raffa: Interactive 3D Virtual AI Office & Autonomous Mission Control featuring 6 autonomous AI agents executing Figma slicing pixel-perfect and Jira tickets to GitLab Merge Requests.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
