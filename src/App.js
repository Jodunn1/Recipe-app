import React from "react";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import RecipeExcerpt from "./components/RecipeExerpt";
import RecipeFull from "./components/RecipeFull";
import NewRecipeForm from "./components/NewRecipeForm";
import { ToastContainer } from "react-toastify";
import displayToast from "./helpers/toastHelper";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNewRecipeForm, setShowNewRecipeForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newRecipe, setNewRecipe] = useState({
    title: "",
    ingredients: "",
    instructions: "",
    servings: 1,
    description: "",
    image_url: "https://images.pexels.com/photos/9986228/pexels-photo-9986228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  });

  useEffect(() => {
    const fetchAllRecipes = async () => {
      try {
        const response = await fetch("/api/recipes");
        if (response.ok) {
          const data = await response.json();
          setRecipes(data);
        } else {
          displayToast("Oops - could not fetch recipes!", "error");
        }
      } catch (e) {
        displayToast("An unexpected error occurred. Please try again later.", "error");
      }
    };
    fetchAllRecipes();
    // there are better ways to handle calling a network request on component mount, like using react-query. However if you are
    // going to do it with vanilla hooks then you should make sure to include a cleanup function so there isn't a memory leak in your app if your
    // component gets unmounted
  }, []);

  const handleNewRecipe = async (e, newRecipe) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newRecipe)
      });

      if (response.ok) {
        const data = await response.json();
        
        // this is a big no-no. If you are setting state which is still using previous state, you need to pass in a function like this
        // setRecipes((prevState) => ([...prevState, data.recipe]))
        // reason is, ...recipes is not guaranteed to be the current/last state you expect it to be. It depends on the render cycle.
        setRecipes([...recipes, data.recipe]);

        console.log("Recipe added successfully!");
        displayToast("Recipe added successfully!", "success");

        setShowNewRecipeForm(false);
        setNewRecipe({
          title: "",
          ingredients: "",
          instructions: "",
          servings: 1,
          description: "",
          imageUrl:
            "https://images.pexels.com/photos/9986228/pexels-photo-9986228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
        });
      } else {
        displayToast("Oops - could not add recipe!", "error");
      }
    } catch (e) {
      displayToast("An unexpected error occurred. Please try again later.", "error");
    }
  };

  const handleUpdateRecipe = async (e, selectedRecipe) => {
    e.preventDefault();
    const { id } = selectedRecipe;

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(selectedRecipe)
      });

      if (response.ok) {
        const data = await response.json();

        setRecipes(
          // again, use prevState
          // however, this is too confusing for actual production code. It's better just to refetch all of the current recipes via your
          // GET API request. libraries like react-query make this easier to do, and it should be fast enough that this isn't necessary. 
          // the general thought is that more code = more bugs, and this is just extra code that isn't necessary
          recipes.map((recipe) => {
            if (recipe.id === id) {
              // Return the saved data from the db
              return data.recipe;
            }
            return recipe;
          })
        );
        displayToast("Recipe updated!", "success");
      } else {
        displayToast("Failed to update recipe. Please try again.", "error");
      }
    } catch (error) {
      displayToast("An unexpected error occurred. Please try again later.", "error");
    }

    setSelectedRecipe(null);
  };

  const handleDeleteRecipe = async (recipeId) => {
    try {
      const response = await fetch(`/api/recipes/${selectedRecipe.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        // same as above comments
        setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));
        setSelectedRecipe(null);
        displayToast("Recipe deleted successfully!");
      } else {
        displayToast("Could not delete recipe, please try again later.", "error");
      }
    } catch (e) {
      displayToast("An unexpected error occurred. Please try again later.", "error");
    }
  };

  const handleSearch = () => {
    const searchResults = recipes.filter((recipe) => {
      const valuesToSearch = [recipe.title, recipe.ingredients, recipe.description];
      // Check if the search term is included in any of the values and will return a boolean value
      return valuesToSearch.some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return searchResults;
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleUnselectRecipe = () => {
    setSelectedRecipe(null);
  };

  const hideRecipeForm = () => {
    setShowNewRecipeForm(false);
  };

  const showRecipeForm = () => {
    setShowNewRecipeForm(true);
    setSelectedRecipe(null);
  };

  const updateSearchTerm = (text) => {
    setSearchTerm(text);
  };

  const onUpdateForm = (e, action = "new") => {
    const { name, value } = e.target;
    if (action === "update") {
      // same as above
      setSelectedRecipe({
        ...selectedRecipe,
        [name]: value
      });
    } else if (action === "new") {
      // same as above
      setNewRecipe({ ...newRecipe, [name]: value });
    }
  };

  const displayAllRecipes = () => {
    hideRecipeForm();
    handleUnselectRecipe();
    updateSearchTerm("");
  };

  const displayedRecipes = searchTerm ? handleSearch() : recipes;

  return (
    <div className='recipe-app'>
      <Header
        showRecipeForm={showRecipeForm}
        updateSearchTerm={updateSearchTerm}
        handleSearch={handleSearch}
        searchTerm={searchTerm}
        displayAllRecipes={displayAllRecipes}
      />
      {showNewRecipeForm && (
        <NewRecipeForm
          newRecipe={newRecipe}
          hideRecipeForm={hideRecipeForm}
          handleNewRecipe={handleNewRecipe}
          onUpdateForm={onUpdateForm}
        />
      )}
      {selectedRecipe && (
        <RecipeFull
          selectedRecipe={selectedRecipe}
          handleUnselectRecipe={handleUnselectRecipe}
          handleUpdateRecipe={handleUpdateRecipe}
          onUpdateForm={onUpdateForm}
          handleDeleteRecipe={handleDeleteRecipe}
          handleSelectRecipe={handleSelectRecipe}
        />
      )}
      {!selectedRecipe && !showNewRecipeForm && (
        <div className='recipe-list'>
          {displayedRecipes.map((recipe) => (
            <RecipeExcerpt key={recipe.id} recipe={recipe} handleSelectRecipe={handleSelectRecipe} />
          ))}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
