import { useState } from 'react';
import { PublicRecipe } from '../types';

export function useRecipeModal() {
  const [selectedRecipe, setSelectedRecipe] = useState<PublicRecipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const openRecipeModal = (recipe: PublicRecipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setSelectedRecipe(null);
  };

  const updateSelectedRecipe = (recipeId: number, updates: Partial<PublicRecipe>) => {
    if (selectedRecipe && selectedRecipe.id === recipeId) {
      setSelectedRecipe(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  return {
    selectedRecipe,
    showRecipeModal,
    openRecipeModal,
    closeRecipeModal,
    updateSelectedRecipe
  };
}
