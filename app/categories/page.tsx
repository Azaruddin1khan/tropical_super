'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Layers,
  Edit,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout/super-admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useSuperAdmin } from '@/context/super-admin-context';
import { Category } from '@/types';
import { isDuplicateCategoryName } from '@/lib/utils';

const CATEGORY_IMAGE_PRESETS = [
  { label: 'Meat Gyros Wrap', url: '/images/gyro_with_fries.jpg' },
  { label: 'Sea Food Gyro', url: '/images/conch_crispy_salad.jpg' },
  { label: 'Gyro Bowls', url: '/images/jerk_chicken_bowl.jpg' },
  { label: 'Large Salads', url: '/images/bbq_salmon_salad.jpg' },
  { label: 'Small Salads', url: '/images/chicken_tropical_salad.jpg' },
  { label: 'Sides & Drinks', url: '/images/tropical_smoothies.jpg' },
  { label: 'Menu Board', url: '/images/menu_board.png' },
];

export default function CategoriesPage() {
  const { categories, products, addCategory, editCategory, deleteCategory } = useSuperAdmin();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '/images/gyro_with_fries.jpg',
    displayOrder: 1,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '/images/gyro_with_fries.jpg',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setDuplicateWarning(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl || '/images/gyro_with_fries.jpg',
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setFormErrors({});
    setDuplicateWarning(null);
  };

  const toggleCategoryActive = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      editCategory({ ...cat, isActive: !cat.isActive });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      errors.name = 'Category name is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Duplicate check
    const isDup = isDuplicateCategoryName(categories, trimmedName, editingCategory?.id);
    if (isDup) {
      setDuplicateWarning(`A category named "${trimmedName}" already exists (case-insensitive).`);
      return;
    }

    if (editingCategory) {
      editCategory({
        ...editingCategory,
        name: trimmedName,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        displayOrder: Number(formData.displayOrder) || 1,
        isActive: formData.isActive,
      });
      setEditingCategory(null);
    } else {
      addCategory({
        name: trimmedName,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        displayOrder: Number(formData.displayOrder) || categories.length + 1,
        isActive: formData.isActive,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header matching Screenshot 3 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Menu Categories
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Organize food menu sections displayed across Tropical Gyros customer applications
            </p>
          </div>

          <Button
            onClick={openAddModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Category
          </Button>
        </div>

        {/* Categories Grid matching Screenshot 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const actualCount = products.filter((p) => p.categoryId === category.id).length;

            return (
              <Card
                key={category.id}
                className="overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image
                      src={category.imageUrl || '/images/gyro_with_fries.jpg'}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-bold bg-white/95 backdrop-blur text-slate-800 px-2.5 py-1 rounded-full shadow-sm">
                        Order #{category.displayOrder}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                          category.isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-400 text-white'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">{category.name}</h3>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full shrink-0">
                        {actualCount} Dishes
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCategoryActive(category.id)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        category.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                          category.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-slate-600">
                      {category.isActive ? 'Published' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/products`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600 px-2">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Dishes
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-600"
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingCategoryId(category.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Category Modal matching Screenshot */}
      {(isAddModalOpen || editingCategory) && (
        <Modal
          isOpen={isAddModalOpen || !!editingCategory}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingCategory(null);
            setDuplicateWarning(null);
          }}
          title={editingCategory ? `Edit Category — ${editingCategory.name}` : 'Add Menu Category'}
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <Input
              label="Category Name *"
              placeholder="e.g. Seafood Gyros"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                if (duplicateWarning) setDuplicateWarning(null);
              }}
              error={formErrors.name}
            />

            <Input
              label="Display Order"
              type="number"
              placeholder="1"
              value={(formData.displayOrder ?? 1).toString()}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })
              }
            />

            <Textarea
              label="Category Description"
              rows={2}
              placeholder="Fresh seafood gyros wrapped in warm pita bread..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category Banner Image
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                    className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
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
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] py-0.5 truncate text-center font-medium">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">Active & Visible in Customer App</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCategory(null);
                  setDuplicateWarning(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategoryId && (
        <Modal
          isOpen={!!deletingCategoryId}
          onClose={() => setDeletingCategoryId(null)}
          title="Confirm Delete Category"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this category? Dishes inside this category must be reassigned.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingCategoryId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteCategory(deletingCategoryId);
                  setDeletingCategoryId(null);
                }}
              >
                Delete Category
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SuperAdminLayout>
  );
}
