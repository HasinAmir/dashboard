export const metadata = {
    title: 'DawnCast',
    description: 'Your morning weather and disaster-alert briefing, spoken aloud.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'DawnCast',
    },
};

export const viewport = {
    themeColor: '#14182B',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ margin: 0 }}>{children}</body>
        </html>
    );
}