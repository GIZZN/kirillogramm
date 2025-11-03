import { useState } from 'react';
import { UserRecipe, RecipeForm, DEFAULT_RECIPE_FORM, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '../types';

export function useRecipeForm() {
  const [recipeForm, setRecipeForm] = useState<RecipeForm>(DEFAULT_RECIPE_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [difficultyDropdownOpen, setDifficultyDropdownOpen] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setRecipeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...recipeForm.ingredients];
    newIngredients[index] = value;
    setRecipeForm(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    if (recipeForm.ingredients.length > 1) {
      const newIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
      setRecipeForm(prev => ({
        ...prev,
        ingredients: newIngredients
      }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert('Неподдерживаемый тип файла. Разрешены: JPEG, PNG, WebP');
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRecipeForm(DEFAULT_RECIPE_FORM);
  };

  const loadRecipeForEdit = (recipe: UserRecipe) => {
    setRecipeForm({
      title: recipe.title,
      category: recipe.category,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      time: recipe.time || '',
      servings: recipe.servings,
      difficulty: recipe.difficulty
    });
  };

  return {
    recipeForm,
    selectedImage,
    imagePreview,
    categoryDropdownOpen,
    difficultyDropdownOpen,
    handleInputChange,
    handleIngredientChange,
    addIngredient,
    removeIngredient,
    handleImageSelect,
    removeImage,
    resetForm,
    loadRecipeForEdit,
    setCategoryDropdownOpen,
    setDifficultyDropdownOpen
  };
}
