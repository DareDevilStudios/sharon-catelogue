import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, Category } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { productDB } from '../lib/db';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      console.log("navigator.onLine", navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = () => {
    const offlineCategories = productDB.getAllCategories();
    setCategories(offlineCategories);
  };

  const loadProducts = async () => {
    const currentTime = Date.now();
    if (lastFetched && currentTime - lastFetched < 5 * 60 * 1000) {
      // If data was fetched within the last 5 minutes, use LocalStorage
      const offlineProducts = productDB.getAllProducts();
      setProducts(offlineProducts);
      return;
    }

    if (isOnline) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        const offlineProducts = productDB.getAllProducts();
        setProducts(offlineProducts);
      } else if (data) {
        setProducts(data);
        // Update LocalStorage with latest data
        productDB.clearLocalStorage(); // Clear old data
        data.forEach((product) => {
          productDB.addProduct(product);
        });
        setLastFetched(currentTime); // Update last fetched time
      }
    } else {
      const offlineProducts = productDB.getAllProducts();
      setProducts(offlineProducts);
    }
  };

  const handleRefetch = async () => {
    if (isOnline) {
      // Clear LocalStorage
      productDB.clearLocalStorage();

      // Fetch fresh data from Supabase
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('category')
        .select('*');

      if (productsError || categoriesError) {
        console.error('Error refetching data:', productsError || categoriesError);
        return;
      }

      // Update LocalStorage with fresh data
      if (productsData) {
        productsData.forEach((product) => {
          productDB.addProduct(product);
        });
        setProducts(productsData);
      }

      if (categoriesData) {
        categoriesData.forEach((category) => {
          productDB.addCategory(category);
        });
        setCategories(categoriesData);
      }

      // Recache images
      if (productsData) {
        productsData.forEach((product) => {
          if (product.image_url) {
            fetch(product.image_url); // Trigger image caching
          }
        });
      }

      setLastFetched(Date.now());
    } else {
      alert('You are offline. Refetching data requires an internet connection.');
    }
  };

  const groupProductsByCategory = () => {
    const grouped = new Map<string, Product[]>();

    // Get unique categories from products
    const uniqueCategories = [...new Set(products.map(product => product.category))];

    // Initialize groups for all categories
    uniqueCategories.forEach(category => {
      grouped.set(category, []);
    });

    // Group products
    products.forEach(product => {
      const categoryProducts = grouped.get(product.category) || [];
      categoryProducts.push(product);
      grouped.set(product.category, categoryProducts);
    });

    return grouped;
  };

  const productsByCategory = groupProductsByCategory();

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen pb-8">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search Products by Category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72 px-4 py-2 rounded-lg bg-sharon-paper border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
        />
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white mb-4">No categories available.</p>
          <Link
            to="/create"
            className="inline-block px-6 py-2 bg-sharon-orange text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Add Categories & Products
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map(category => {
            const categoryProducts = productsByCategory.get(category.name) || [];

            return (
              <div key={category.id} className="bg-sharon-paper rounded-lg p-6">
                <h2 className="text-2xl font-bold text-sharon-orange mb-4">
                  {category.name}
                </h2>

                {categoryProducts.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No products in this category yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {categoryProducts.map((product) => (
                      <div key={product.id} className="bg-sharon-dark rounded-lg shadow-lg overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="text-sharon-orange text-xl font-semibold mb-2">
                            {product.name}
                          </h3>
                          <p className="text-white mb-2">
                            Dimensions: {product.dimensions}
                          </p>
                          <p className="text-sharon-orange text-xl font-bold mb-4">
                            ${product.price}
                          </p>
                          <Link
                            to={`/product/${product.id}`}
                            className="text-sharon-orange hover:text-orange-400 font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Refetch Button */}
      <button
        onClick={handleRefetch}
        className="fixed bottom-24 right-8 w-14 h-14 bg-sharon-orange hover:bg-orange-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <ArrowPathIcon className="w-6 h-6 text-white" />
      </button>

      {/* Add Product Button */}
      <Link
        to="/create"
        className="fixed bottom-8 right-8 w-14 h-14 bg-sharon-orange hover:bg-orange-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <PlusIcon className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}