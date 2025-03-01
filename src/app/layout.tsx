import type { Metadata } from 'next'
import './globals.css'
import WalletContext from '@/contexts/walletContext'

export const metadata: Metadata = {
	title: 'T-Rex Runner',
	description: 'Web3 T-rex runner',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body>
				<WalletContext>{children}</WalletContext>
			</body>
		</html>
	)
}
