import { UserRecipe, RecipeForm } from '../types';

export const uploadImage = async (recipeId: number, selectedImage: File): Promise<boolean> => {
  if (!selectedImage) return false;

  const formData = new FormData();
  formData.append('image', selectedImage);

  try {
    const response = await fetch(`/api/recipes/${recipeId}/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке изображения');
    }

    return true;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const submitRecipe = async (
  recipeForm: RecipeForm,
  editingRecipe: UserRecipe | null
): Promise<{ success: boolean; recipeId?: number; error?: string }> => {
  try {
    const isEditing = editingRecipe !== null;
    const url = isEditing ? `/api/recipes/${editingRecipe.id}` : '/api/recipes';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...recipeForm,
        ingredients: recipeForm.ingredients.filter(ing => ing.trim() !== '')
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const recipeId = data.recipe?.id || editingRecipe?.id;
      return { success: true, recipeId };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || `Произошла ошибка при ${isEditing ? 'обновлении' : 'добавлении'} рецепта` };
    }
  } catch (error) {
    console.error('Error submitting recipe:', error);
    return { success: false, error: 'Произошла ошибка при отправке рецепта' };
  }
};

export const publishRecipe = async (recipeId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/recipes/${recipeId}/publish`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || 'Ошибка при публикации рецепта' };
    }
  } catch (error) {
    console.error('Error promoting recipe:', error);
    return { success: false, error: 'Ошибка при публикации рецепта' };
  }
};

export const deleteRecipe = async (recipeId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || 'Ошибка при удалении рецепта' };
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return { success: false, error: 'Произошла ошибка при удалении рецепта' };
  }
};

export const unpublishRecipe = async (recipeId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/recipes/${recipeId}/publish`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || 'Ошибка при снятии рецепта с публикации' };
    }
  } catch (error) {
    console.error('Error unpublishing recipe:', error);
    return { success: false, error: 'Произошла ошибка при снятии рецепта с публикации' };
  }
};

export const shareRecipe = async (recipe: UserRecipe): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: recipe.title,
        text: `Попробуйте приготовить ${recipe.title} - ${recipe.description}`,
        url: window.location.href
      });
    } catch {
      console.log('Sharing cancelled');
    }
  } else {
    const shareText = `🍽️ ${recipe.title}\n\n${recipe.description}\n\n⏱️ ${recipe.time} | 👥 ${recipe.servings} порций | 🔥 ${recipe.difficulty}\n\nИнгредиенты:\n${recipe.ingredients.map((ing: string) => `• ${ing}`).join('\n')}\n\nПриготовление:\n${recipe.instructions}\n\n🔗 ${window.location.href}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Рецепт скопирован в буфер обмена!');
    } catch {
      alert(`Скопируйте рецепт:\n\n${shareText}`);
    }
  }
};
