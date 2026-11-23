'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Flame,
  Star,
  LayoutGrid,
  List,
  Leaf,
  Edit,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useSuperAdmin } from '@/context/super-admin-context';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

const IMAGE_PRESETS = [
  { label: 'Meat Gyro Wrap', url: '/images/gyro_with_fries.jpg' },
  { label: 'Jerk Chicken Bowl', url: '/images/jerk_chicken_bowl.jpg' },
  { label: 'BBQ Salmon Salad', url: '/images/bbq_salmon_salad.jpg' },
  { label: 'Tropical Chicken Salad', url: '/images/tropical_chicken_salad.jpg' },
  { label: 'Crispy Conch Salad', url: '/images/conch_crispy_salad.jpg' },
  { label: 'Grilled Veggies Bowl', url: '/images/grilled_veggies_bowl.jpg' },
  { label: 'Jerk Chicken Salad', url: '/images/jerk_chicken_salad.jpg' },
  { label: 'Tropical Smoothies', url: '/images/tropical_smoothies.jpg' },
];

export default function ProductsPage() {
  const {
    products,
    categories,
    addProduct,
    editProduct,
    deleteProduct,
    toggleProductAvailability,
    toggleProductFeatured,
  } = useSuperAdmin();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    imageUrl: '/images/gyro_with_fries.jpg',
    isAvailable: true,
    isFeatured: false,
    isVegetarian: false,
    spicyLevel: 1,
    ingredients: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredProducts = products.filter((product) => {
    if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) return false;
    if (availabilityFilter === 'in_stock' && !product.isAvailable) return false;
    if (availabilityFilter === 'out_of_stock' && product.isAvailable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      const matchCategory = product.categoryName.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCategory) return false;
    }
    return true;
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      price: '',
      imageUrl: '/images/gyro_with_fries.jpg',
      isAvailable: true,
      isFeatured: false,
      isVegetarian: false,
      spicyLevel: 1,
      ingredients: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      isVegetarian: product.isVegetarian,
      spicyLevel: product.spicyLevel,
      ingredients: product.ingredients.join(', '),
    });
    setFormErrors({});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Dish name is required.';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = 'Valid price is required.';
    }
    if (!formData.categoryId) errors.categoryId = 'Category selection is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const categoryObj = categories.find((c) => c.id === formData.categoryId);
    const categoryName = categoryObj ? categoryObj.name : 'Gyros';

    const ingredientsList = formData.ingredients
      ? formData.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Fresh herbs', 'Caribbean spices'];

    if (editingProduct) {
      editProduct({
        ...editingProduct,
        name: formData.name,
        categoryId: formData.categoryId,
        categoryName,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        isVegetarian: formData.isVegetarian,
        spicyLevel: formData.spicyLevel,
        ingredients: ingredientsList,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        categoryId: formData.categoryId,
        categoryName,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        isVegetarian: formData.isVegetarian,
        spicyLevel: formData.spicyLevel,
        ingredients: ingredientsList,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header matching Screenshot 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Menu & Products Catalog
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Official Tropical Gyros Menu: Gyro wraps, rice bowls, loaded salads, sides & drinks
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle matching Screenshot 2 */}
            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Cards
              </button>
            </div>

            <Button
              onClick={openAddModal}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add New Dish
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar matching Screenshot 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name (e.g. Jerk Pork, Conch, Lobster, Fries)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* CARD GRID VIEW matching Screenshot 2 */}
        {viewMode === 'cards' ? (
          filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h3 className="text-base font-bold text-slate-800">No dishes match criteria</h3>
              <p className="text-xs text-slate-400 mt-1">Try selecting a different category or clearing your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[11px] font-bold bg-white/95 backdrop-blur text-slate-800 px-2 py-0.5 rounded-full shadow-sm">
                        {product.categoryName}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => toggleProductFeatured(product.id)}
                        className="w-8 h-8 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            product.isFeatured
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 leading-snug">{product.name}</h3>
                      <span className="text-base font-extrabold text-amber-800 shrink-0">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>

                    <div className="flex items-center gap-2 pt-1">
                      {product.isVegetarian && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Vegetarian
                        </span>
                      )}
                      {product.spicyLevel > 0 && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          Spice Lvl {product.spicyLevel}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleProductAvailability(product.id)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        product.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                          product.isAvailable ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-slate-600">
                      {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditModal(product)}
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingProductId(product.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          )
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Dish</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Price</th>
                    <th className="py-3.5 px-4 font-semibold">Spiciness & Diet</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Featured</th>
                    <th className="py-3.5 px-4 font-semibold">In Stock</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">No dishes match criteria</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try selecting a different category or clearing search</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{product.name}</span>
                            <span className="text-xs text-slate-400 block line-clamp-1">
                              {product.description}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-slate-100 text-slate-700 font-medium text-xs px-2.5 py-1 rounded-full">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-base">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.isVegetarian && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Leaf className="w-3 h-3" />
                              Veg
                            </span>
                          )}
                          {product.spicyLevel > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                              {product.spicyLevel === 3 ? 'Hot' : product.spicyLevel === 2 ? 'Med' : 'Mild'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductFeatured(product.id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              product.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(product.id)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                            product.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                              product.isAvailable ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => setDeletingProductId(product.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Dish Modal matching Screenshot from client */}
      {(isAddModalOpen || editingProduct) && (
        <Modal
          isOpen={isAddModalOpen || !!editingProduct}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
          title={editingProduct ? `Edit Dish — ${editingProduct.name}` : 'Add New Menu Dish'}
          size="lg"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Dish Name *"
                placeholder="e.g. Jerk Pork Gyro Wrap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
              />

              <Input
                label="Price (BSD) *"
                type="number"
                step="0.01"
                placeholder="12.35"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={formErrors.price}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category *"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />

              <Select
                label="Spiciness Level"
                value={(formData.spicyLevel ?? 0).toString()}
                onChange={(e) =>
                  setFormData({ ...formData, spicyLevel: parseInt(e.target.value) || 0 })
                }
                options={[
                  { label: 'Mild (No Hot Pepper)', value: '0' },
                  { label: 'Medium (Caribbean Seasoned)', value: '1' },
                  { label: 'Spicy (Scotch Bonnet Kick)', value: '2' },
                  { label: 'Extra Hot (Fiery Island Hot)', value: '3' },
                ]}
              />
            </div>

            <Textarea
              label="Description & Recipe Notes"
              rows={2}
              placeholder="Crisp shredded lettuce, diced ripe tomatoes, red onions, garlic crema..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Input
              label="Key Ingredients (comma separated)"
              placeholder="Pita, Jerk Pork, Feta, Tzatziki, Mango, Lettuce"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            />

            {/* Image Preset Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Food Image Asset
              </label>
              <div className="grid grid-cols-4 gap-2">
                {IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                    className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      formData.imageUrl === preset.url
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] py-0.5 truncate text-center">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes: Available, Featured, Veg */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Available In Stock</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Featured on Home & Best-Sellers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Vegetarian Recipe</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {editingProduct ? 'Save Changes' : 'Create Dish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <Modal
          isOpen={!!deletingProductId}
          onClose={() => setDeletingProductId(null)}
          title="Confirm Delete Dish"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove this dish from the Tropical Gyros catalog? This will not affect past fulfilled orders.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingProductId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteProduct(deletingProductId);
                  setDeletingProductId(null);
                }}
              >
                Delete Dish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}
