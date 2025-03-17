import { Product, Category } from './supabase';

const LOCAL_STORAGE_KEY_PRODUCTS = 'products';
const LOCAL_STORAGE_KEY_CATEGORIES = 'categories';

export class ProductDatabase {
  // Get all categories from LocalStorage
  getAllCategories(): Category[] {
    const categories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    return categories ? JSON.parse(categories) : [];
  }

  // Update a category in LocalStorage
  updateCategory(category: Category): void {
    const categories = this.getAllCategories();
    const updatedCategories = categories.map(cat =>
      cat.id === category.id ? category : cat
    );
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));
  }

  // Add a category to LocalStorage
  addCategory(category: Category): void {
    const categories = this.getAllCategories();
    categories.push(category);
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }

  // Delete a category from LocalStorage
  deleteCategory(id: number): void {
    const categories = this.getAllCategories().filter(cat => cat.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }

  // Add a product to LocalStorage
  addProduct(product: Product): void {
    const products = this.getAllProducts();
    products.push(product);
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  // Get all products from LocalStorage
  getAllProducts(): Product[] {
    const products = localStorage.getItem(LOCAL_STORAGE_KEY_PRODUCTS);
    return products ? JSON.parse(products) : [];
  }

  // Update a product in LocalStorage
  updateProduct(product: Product): void {
    const products = this.getAllProducts();
    const updatedProducts = products.map(prod =>
      prod.id === product.id ? product : prod
    );
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts));
  }

  // Delete a product from LocalStorage
  deleteProduct(id: number): void {
    const products = this.getAllProducts().filter(prod => prod.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  // Clear all data from LocalStorage
  clearLocalStorage(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CATEGORIES);
  }

  // Get a specific product by ID
  getProduct(id: number): Product | null {
    const products = this.getAllProducts();
    return products.find(prod => prod.id === id) || null;
  }
}

export const productDB = new ProductDatabase();