import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { productDB } from '../lib/db';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [LastFetched, setLastFetched] = useState<string | null>(null);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      const lastFetched = localStorage.getItem("lastFetched");
      setLastFetched(lastFetched)
      console.log("Last fetched time:", lastFetched);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      const currentTime = Date.now();
      const lastFetchedTime = LastFetched ? new Date(LastFetched).getTime() : 0;
      if (isOnline && (currentTime - lastFetchedTime) > 5 * 60 * 1000) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', parseInt(id))
          .single();

        if (error) throw error;
        if (data) {
          setProduct(data);
          // Update LocalStorage
          productDB.updateProduct(data);
        }
      } else {
        const offlineProduct = productDB.getProduct(parseInt(id));
        if (offlineProduct) {
          setProduct(offlineProduct);
        } else {
          setError('Product not found in offline storage');
        }
      }
      localStorage.setItem("lastFetched", new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4">
        <p className="text-red-500">{error || 'Product not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-sharon-orange text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-sharon-paper p-8 rounded-lg shadow-lg">
        <button
          onClick={() => navigate('/')}
          className="mb-6 px-4 py-2 bg-sharon-orange text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Back to Products
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <img
              src={product.image_url}
              alt={product.name}
              className="rounded-lg max-h-96 w-full object-contain"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-sharon-orange mb-4">
              {product.name}
            </h1>
          
            <p className="text-2xl text-sharon-orange font-bold mb-4">
              ${product.price}
            </p>
          
            <p className="mb-4">
              <strong>Category:</strong> {product.category}
            </p>
          
            <p className="mb-4">
              <strong>Dimensions:</strong> {product.dimensions}
            </p>
          
            {product.created_at && (
              <p className="text-gray-400 text-sm">
                Added on: {new Date(product.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}