import './globals.css';
import Providers from "./Providers";
import ChatSocket from '../components/ChatSocket';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'HomeCook Connect - Neighborhood Homemade Food',
  description: 'Connect with local home cooks in your neighborhood. Discover authentic homemade meals, support your community, and enjoy real food made with love.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Navbar />
          <ChatSocket />
          {children}
        </Providers>
      </body>
    </html>
  );
}
