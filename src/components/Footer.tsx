'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-serif text-xl font-semibold mb-4">Whisky Advocate</h4>
            <p className="text-gray-400 text-sm">
              The leading authority on whisky since 1988.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="https://whiskyadvocate.com/ratings-reviews" className="hover:text-white transition-colors">
                  Ratings & Reviews
                </a>
              </li>
              <li>
                <a href="https://whiskyadvocate.com/buying-guide" className="hover:text-white transition-colors">
                  Buying Guides
                </a>
              </li>
              <li>
                <a href="https://whiskyadvocate.com/category/features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Subscribe</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="https://whiskyadvocate.com/subscribe" className="hover:text-white transition-colors">
                  Print Magazine
                </a>
              </li>
              <li>
                <a href="https://whiskyadvocate.com/newsletter" className="hover:text-white transition-colors">
                  Newsletter
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="https://store.whiskyadvocate.com" className="hover:text-white transition-colors">
                  Whisky Store
                </a>
              </li>
              <li>
                <a href="https://store.whiskyadvocate.com/collections/merchandise" className="hover:text-white transition-colors">
                  Merchandise
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Whisky Advocate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
