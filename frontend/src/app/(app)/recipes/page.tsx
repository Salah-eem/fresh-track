"use client";

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { ChefHat, Search, Utensils, CheckCircle2, XCircle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
}

interface Recipe {
  id: string;
  title: string;
  image: string;
  readyInMinutes: number;
  ingredients: string[];
  instructions: string[];
}

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Gourmet Pasta Pomodoro',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400',
    readyInMinutes: 20,
    ingredients: ['pasta', 'tomato', 'garlic', 'basil', 'olive oil'],
    instructions: ['Boil water for pasta.', 'Sauté garlic in olive oil.', 'Add tomatoes and simmer.', 'Toss with cooked pasta and basil.']
  },
  {
    id: '2',
    title: 'Fresh Mediterranean Salad',
    image: 'https://images.unsplash.com/photo-1540189567004-453bca51c701?auto=format&fit=crop&w=400',
    readyInMinutes: 15,
    ingredients: ['lettuce', 'tomato', 'cucumber', 'olive oil', 'feta'],
    instructions: ['Chop all vegetables.', 'Whisk oil and lemon juice.', 'Combine and top with feta.']
  },
  {
    id: '3',
    title: 'Protein-Packed Omelette',
    image: 'https://images.unsplash.com/photo-1510693222269-22c483d89a6c?auto=format&fit=crop&w=400',
    readyInMinutes: 10,
    ingredients: ['egg', 'cheese', 'milk', 'ham', 'pepper'],
    instructions: ['Beat eggs with milk.', 'Pour into hot pan.', 'Add fillings and fold.']
  },
  {
    id: '4',
    title: 'Creamy Fruit Yogurt',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400',
    readyInMinutes: 5,
    ingredients: ['yogurt', 'banana', 'apple', 'honey', 'strawberry'],
    instructions: ['Place yogurt in a bowl.', 'Slice fruit and add as topping.', 'Drizzle with honey.']
  }
];

export default function Recipes() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get('/recipes/suggestions');
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to fetch recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Recipes...</div>;
  }

  return (
    <div className="min-h-screen p-6 pb-32 max-w-2xl mx-auto page-transition">
      <header className="mb-10 mt-6 flex items-start justify-between">
        <div>
           <h1 className="text-4xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">AI Chef</h1>
           <p className="text-foreground/50 mt-2 font-medium">Smart meal ideas generated just for you</p>
        </div>
        <button 
          onClick={() => fetchSuggestions(true)}
          disabled={refreshing || loading}
          className="p-3 glass-card rounded-2xl text-primary hover:scale-110 active:scale-95 transition-all shadow-lg border-primary/10 disabled:opacity-50"
          title="Regenerate with AI"
        >
            <ChefHat className={`w-8 h-8 ${refreshing ? 'animate-bounce' : ''}`} />
        </button>
      </header>

      <div className="space-y-6">
        {suggestions.map((recipe) => (
          <div key={recipe.id} className="glass-card rounded-3xl overflow-hidden shadow-xl border-white/10 group hover:translate-x-1 transition-all">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-1/3 relative h-48 sm:h-auto overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent sm:hidden" />
              </div>
              
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                   <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{recipe.title}</h2>
                   <div className="flex items-center text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-tighter border border-primary/20">
                      <Utensils className="w-3 h-3 mr-1" /> {recipe.readyInMinutes} Min
                   </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ing) => (
                    <span 
                      key={ing} 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary/80"
                    >
                      {ing}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                   <p className="text-xs text-foreground/60 line-clamp-2">
                     <span className="font-bold text-primary mr-1">Steps:</span>
                     {recipe.instructions.join(' ')}
                   </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
