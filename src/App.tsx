import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import ProductList from './components/ProductList';
import CreateProduct from './components/CreateProduct';
import ProductDetails from './components/ProductDetails';
import { Link } from 'react-router-dom';

function App() {
  useEffect(() => {

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        console.log("window loaded")
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log("registration",registration)
            console.log('ServiceWorker registration successful');
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-sharon-dark">
        <nav className="bg-sharon-paper shadow-lg">
          <div className="container mx-auto px-4">
            <div className="h-16 flex items-center justify-center">
              <Link to={"/"} className="text-sharon-orange text-3xl font-bold">
                Sharon Industries
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/create" element={<CreateProduct />} />
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
