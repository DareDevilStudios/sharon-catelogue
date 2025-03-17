import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { productDB } from "../lib/db";
import type { Product, Category } from "../lib/supabase";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dimensions: "",
    price: "",
    category: "",
    image: null as File | null,
  });
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadProducts = () => {
    const offlineProducts = productDB.getAllProducts();
    setProducts(offlineProducts);
  };

  const loadCategories = () => {
    const offlineCategories = productDB.getAllCategories();
    setCategories(offlineCategories);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setCategoryLoading(true);

    try {
      const { data, error } = await supabase
        .from("category")
        .insert([{ name: categoryName }])
        .select()
        .single();

      if (error) {
        console.log("error category adding : ", error);
        throw error;
      }

      if (data) {
        productDB.addCategory(data);
        setCategoryName("");
        loadCategories();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const { error } = await supabase
        .from("category")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      productDB.deleteCategory(category.id);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting category");
    }
  };

  const handleEditCategory = async (category: Category) => {
    if (!editingCategory) {
      setEditingCategory({ id: category.id, name: category.name });
    } else {
      const { data, error } = await supabase
        .from("category")
        .update({ name: editingCategory.name })
        .eq("id", editingCategory.id)
        .select();

      if (error) {
        setError(error.message);
      } else {
        console.log("data after edit:", data);
        if (data && data.length > 0) {
          productDB.updateCategory(data[0]);
        }
        setEditingCategory(null);
        loadCategories();
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      dimensions: product.dimensions,
      price: product.price.toString(),
      category: product.category,
      image: null,
    });
    setIsEditProductModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      // Delete image from Supabase Storage
      if (product.image_url) {
        const fileName = product.image_url.split("/").pop();
        const { error: deleteError } = await supabase.storage
          .from("products")
          .remove([`products/${fileName}`]);

        if (deleteError) throw deleteError;
      }

      // Delete product from Supabase table
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      // Delete product from local DB
      productDB.deleteProduct(product.id);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let imageUrl = editingProduct?.image_url || "";

      if (formData.image) {
        // Upload new image to Supabase Storage
        const fileExt = formData.image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, formData.image);

        if (uploadError) {
          console.log("uploadError", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = publicUrl;

        // Delete old image if it exists
        if (editingProduct?.image_url) {
          const oldFileName = editingProduct.image_url.split("/").pop();
          await supabase.storage.from("products").remove([`products/${fileName}`]);
        }
      }

      const productData: Omit<Product, "id" | "created_at"> = {
        name: formData.name,
        dimensions: formData.dimensions,
        price: parseInt(formData.price),
        category: formData.category,
        image_url: imageUrl,
      };

      if (editingProduct) {
        // Update existing product
        const { error: updateError, data: updatedProduct } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id)
          .select()
          .single();

        if (updateError) throw updateError;

        productDB.updateProduct(updatedProduct);
      } else {
        // Create new product
        const { error: insertError, data: newProduct } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (insertError) throw insertError;

        productDB.addProduct(newProduct);
      }

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image" && files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Product Creation Form First */}
      <div className="bg-sharon-paper p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-sharon-orange">
          Add New Product
        </h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              placeholder="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
            />
          </div>

          <div>
            <select
              required
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              required
              placeholder="Dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
            />
          </div>

          <div>
            <input
              type="number"
              required
              placeholder="Price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
            />
          </div>

          <div>
            <label className="block w-full px-4 py-2 rounded-lg border border-sharon-orange text-sharon-orange hover:bg-sharon-orange hover:text-white transition-colors cursor-pointer text-center">
              Upload Image
              <input
                type="file"
                hidden
                name="image"
                accept="image/*"
                onChange={handleInputChange}
                required={!editingProduct}
              />
            </label>
          </div>

          {formData.image && (
            <p className="text-sm text-gray-300">
              Selected file: {formData.image.name}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-sharon-orange text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (editingProduct ? "Updating..." : "Creating...") : editingProduct ? "Update Product" : "Create Product"}
          </button>
        </form>
      </div>

      {/* Category Management Section */}
      <div className="bg-sharon-paper p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-sharon-orange">
          Manage Categories
        </h2>

        <form onSubmit={handleCategorySubmit} className="mb-6">
          <div className="flex gap-4 sm:flex-row flex-col">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="New Category Name"
              className="flex-1 px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
            />
            <button
              type="submit"
              disabled={categoryLoading}
              className="px-2 py-1 bg-sharon-orange text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {categoryLoading ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-4">
              {editingCategory?.id === category.id ? (
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white"
                />
              ) : (
                <span className="flex-1 text-white">{category.name}</span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="text-sharon-orange hover:text-orange-400"
                >
                  {editingCategory?.id === category.id ? "Save" : "Edit"}
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="text-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Management Section */}
      <div className="bg-sharon-paper p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-sharon-orange">
          Manage Products
        </h2>

        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4">
              <span className="flex-1 text-white">{product.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="text-sharon-orange hover:text-orange-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product)}
                  className="text-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-sharon-paper p-8 rounded-lg shadow-lg w-96">
            <h1 className="text-3xl font-bold mb-6 text-sharon-orange">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
              />

              <select
                required
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                placeholder="Dimensions"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
              />

              <input
                type="number"
                required
                placeholder="Price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-sharon-dark border border-sharon-orange text-white focus:outline-none focus:ring-2 focus:ring-sharon-orange"
              />

              <label className="block w-full px-4 py-2 rounded-lg border border-sharon-orange text-sharon-orange hover:bg-sharon-orange hover:text-white transition-colors cursor-pointer text-center">
                Upload Image
                <input
                  type="file"
                  hidden
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  required={!editingProduct}
                />
              </label>

              {formData.image && (
                <p className="text-sm text-gray-300">
                  Selected file: {formData.image.name}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-sharon-orange text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingProduct ? "Updating..." : "Creating...") : editingProduct ? "Update Product" : "Create Product"}
              </button>
            </form>

            <button
              onClick={() => {
                setIsEditProductModalOpen(false);
                setEditingProduct(null);
                setFormData({
                  name: "",
                  dimensions: "",
                  price: "",
                  category: "",
                  image: null,
                });
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}