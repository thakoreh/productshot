import './globals.css'

export const metadata = {
  title: 'ProductShot — Launch cards for indie hackers',
  description: 'Generate beautiful, shareable launch cards for your product in seconds. Perfect for Product Hunt, Twitter, and IH launches.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%236366f1'/><text y='.9em' font-size='80' x='10'>🎯</text></svg>" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
