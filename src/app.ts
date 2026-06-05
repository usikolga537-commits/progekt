interface Meal {
    idMeal: string;
    strMeal: string;
    strInstructions: string;
    strMealThumb: string;
    strCategory: string;
    strArea: string;
    [key: string]: any;
}

interface Category {
    idCategory: string;
    strCategory: string;
    strCategoryThumb: string;
    strCategoryDescription: string;
}

class MealApp {
    private mealsContainer = document.getElementById('mealsContainer') as HTMLElement;
    private categoriesContainer = document.getElementById('categoriesContainer') as HTMLElement;
    private searchForm = document.getElementById('searchForm') as HTMLFormElement;
    private searchInput = document.getElementById('searchInput') as HTMLInputElement;
    private mealsTitle = document.getElementById('mealsTitle') as HTMLElement;
    private pageTitle = document.getElementById('pageTitle') as HTMLElement;
    private loading = document.getElementById('loading') as HTMLElement;
    private modal = new (window as any).bootstrap.Modal(document.getElementById('mealModal'));
    private modalContent = document.getElementById('modalContent') as HTMLElement;

    private favorites: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');

    constructor() {
        this.init();
    }

    private async init() {
        this.bindEvents();
        await this.loadCategories();
        await this.loadPopularMeals();
    }

    private bindEvents() {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchMeals(this.searchInput.value);
        });

        document.getElementById('homeLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetToHome();
        });

        document.getElementById('randomMealBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadRandomMeal();
        });

        document.getElementById('favoritesLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFavorites();
        });
    }

    private async fetchAPI(url: string) {
        this.loading.style.display = 'block';
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        } finally {
            this.loading.style.display = 'none';
        }
    }

    private async loadCategories() {
        const data = await this.fetchAPI('https://www.themealdb.com/api/json/v1/1/categories.php');
        if (data && data.categories) {
            this.renderCategories(data.categories);
        }
    }

    private renderCategories(categories: Category[]) {
        this.categoriesContainer.innerHTML = categories.map(cat => `
            <div class="col-md-2 col-6">
                <button class="btn btn-outline-primary w-100 category-btn" data-category="${cat.strCategory}">
                    ${cat.strCategory}
                </button>
            </div>
        `).join('');

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-category');
                if (cat) this.filterByCategory(cat);
            });
        });
    }

    private async loadPopularMeals() {
        const data = await this.fetchAPI('https://www.themealdb.com/api/json/v1/1/search.php?s=');
        this.mealsTitle.innerText = 'Популярні страви';
        this.renderMeals(data.meals);
    }

    private async searchMeals(query: string) {
        if (!query.trim()) return;
        const data = await this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
        this.mealsTitle.innerText = `Результати пошуку: "${query}"`;
        this.renderMeals(data.meals);
    }

    private async filterByCategory(category: string) {
        const data = await this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        this.mealsTitle.innerText = `Категорія: ${category}`;
        this.renderMeals(data.meals);
    }

    private async loadRandomMeal() {
        const data = await this.fetchAPI('https://www.themealdb.com/api/json/v1/1/random.php');
        if (data.meals) {
            this.showMealDetails(data.meals[0].idMeal);
        }
    }

    private async showFavorites() {
        this.mealsTitle.innerText = 'Ваші обрані рецепти';
        if (this.favorites.length === 0) {
            this.mealsContainer.innerHTML = '<p class="text-center w-100">У вас поки немає обраних рецептів.</p>';
            return;
        }

        const meals: Meal[] = [];
        for (const id of this.favorites) {
            const data = await this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            if (data.meals) meals.push(data.meals[0]);
        }
        this.renderMeals(meals);
    }

    private renderMeals(meals: Meal[] | null) {
        if (!meals) {
            this.mealsContainer.innerHTML = '<p class="text-center w-100">Нічого не знайдено.</p>';
            return;
        }

        this.mealsContainer.innerHTML = meals.map(meal => {
            const isFav = this.favorites.includes(meal.idMeal);
            return `
                <div class="col-md-4">
                    <div class="card h-100 shadow-sm meal-card" data-id="${meal.idMeal}">
                        <button class="btn btn-sm ${isFav ? 'btn-danger' : 'btn-outline-danger'} favorite-btn" data-id="${meal.idMeal}">
                            ${isFav ? '❤️' : '🤍'}
                        </button>
                        <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
                        <div class="card-body">
                            <h5 class="card-title">${meal.strMeal}</h5>
                            <p class="card-text text-muted">${meal.strCategory || ''} ${meal.strArea ? '| ' + meal.strArea : ''}</p>
                            <button class="btn btn-primary view-details" data-id="${meal.idMeal}">Детальніше</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.attachMealEvents();
    }

    private attachMealEvents() {
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (id) this.showMealDetails(id);
            });
        });

        document.querySelectorAll('.meal-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                if (id) this.showMealDetails(id);
            });
        });

        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (id) this.toggleFavorite(id, btn as HTMLButtonElement);
            });
        });
    }

    private toggleFavorite(id: string, btn: HTMLButtonElement) {
        const index = this.favorites.indexOf(id);
        if (index > -1) {
            this.favorites.splice(index, 1);
            btn.innerText = '🤍';
            btn.classList.replace('btn-danger', 'btn-outline-danger');
        } else {
            this.favorites.push(id);
            btn.innerText = '❤️';
            btn.classList.replace('btn-outline-danger', 'btn-danger');
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    private async showMealDetails(id: string) {
        const data = await this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        if (!data.meals) return;

        const meal: Meal = data.meals[0];
        const ingredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing && ing.trim()) {
                ingredients.push(`${ing} - ${measure}`);
            }
        }

        this.modalContent.innerHTML = `
            <div class="modal-header">
                <h5 class="modal-title">${meal.strMeal}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <img src="${meal.strMealThumb}" class="img-fluid rounded mb-3 w-100" alt="${meal.strMeal}">
                <div class="row">
                    <div class="col-md-5">
                        <h4>Інгредієнти</h4>
                        <ul>
                            ${ingredients.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="col-md-7">
                        <h4>Інструкція</h4>
                        <p style="white-space: pre-line;">${meal.strInstructions}</p>
                        ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="btn btn-danger mt-2">Дивитись на YouTube</a>` : ''}
                    </div>
                </div>
            </div>
        `;
        this.modal.show();
    }

    private resetToHome() {
        this.searchInput.value = '';
        this.loadPopularMeals();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MealApp();
});
