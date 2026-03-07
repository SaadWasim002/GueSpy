import React, { useState, useEffect } from 'react';
import { getCategories, selectCategory } from '../../services/categoryService';
import { useGame } from '../../hooks/useGame';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './CategorySelectionScreen.css';

const CategorySelectionScreen = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { fetchScreen } = useGame();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.data.categories); // Access the 'categories' array from the response
      } catch (err) {
        if (err.response?.status === 404) {
          setError('No categories available. Please check back later.');
        } else {
          setError('Failed to load categories.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id);
  };

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      setError('Please select a category to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await selectCategory(selectedCategoryId);
      // After selection, fetch the next game screen
      await fetchScreen();
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Selected category does not exist or is no longer available.');
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error(err);
      setLoading(false); // Only stop loading on error, on success the whole page will change
    }
  };

  if (loading && categories.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="category-selection-container">
      <h2>Select a Category</h2>
      {error && <p className="error-message">{error}</p>}
      
      {categories.length > 0 ? (
        <div className="category-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`category-card ${selectedCategoryId === category.id ? 'selected' : ''}`}
              onClick={() => handleSelectCategory(category.id)}
            >
              {category.categoryName}
            </div>
          ))}
        </div>
      ) : (
        !loading && <p>No categories found.</p>
      )}

      <div className="continue-button-container">
        <Button onClick={handleSubmit} disabled={!selectedCategoryId || loading}>
          {loading ? 'Continuing...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default CategorySelectionScreen;