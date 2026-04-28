import './globals.css'

export const metadata = {
  title: 'ProductShot — Launch cards for indie hackers',
  description: 'Create beautiful launch cards for Product Hunt, Twitter, and IH. No signup, no friction.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2310b981'/><text y='24' x='4' font-size='20'>P</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  )
}
