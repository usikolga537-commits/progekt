"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class MealApp {
    constructor() {
        this.mealsContainer = document.getElementById('mealsContainer');
        this.categoriesContainer = document.getElementById('categoriesContainer');
        this.searchForm = document.getElementById('searchForm');
        this.searchInput = document.getElementById('searchInput');
        this.mealsTitle = document.getElementById('mealsTitle');
        this.pageTitle = document.getElementById('pageTitle');
        this.loading = document.getElementById('loading');
        this.modal = new window.bootstrap.Modal(document.getElementById('mealModal'));
        this.modalContent = document.getElementById('modalContent');
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bindEvents();
            yield this.loadCategories();
            yield this.loadPopularMeals();
        });
    }
    bindEvents() {
        var _a, _b, _c;
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchMeals(this.searchInput.value);
        });
        (_a = document.getElementById('homeLink')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetToHome();
        });
        (_b = document.getElementById('randomMealBtn')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadRandomMeal();
        });
        (_c = document.getElementById('favoritesLink')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFavorites();
        });
    }
    fetchAPI(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.loading.style.display = 'block';
            try {
                const response = yield fetch(url);
                const data = yield response.json();
                return data;
            }
            catch (error) {
                console.error('Fetch error:', error);
                return null;
            }
            finally {
                this.loading.style.display = 'none';
            }
        });
    }
    loadCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchAPI('https://www.themealdb.com/api/json/v1/1/categories.php');
            if (data && data.categories) {
                this.renderCategories(data.categories);
            }
        });
    }
    renderCategories(categories) {
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
                if (cat)
                    this.filterByCategory(cat);
            });
        });
    }
    loadPopularMeals() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchAPI('https://www.themealdb.com/api/json/v1/1/search.php?s=');
            this.mealsTitle.innerText = 'Популярні страви';
            this.renderMeals(data.meals);
        });
    }
    searchMeals(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query.trim())
                return;
            const data = yield this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
            this.mealsTitle.innerText = `Результати пошуку: "${query}"`;
            this.renderMeals(data.meals);
        });
    }
    filterByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
            this.mealsTitle.innerText = `Категорія: ${category}`;
            this.renderMeals(data.meals);
        });
    }
    loadRandomMeal() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchAPI('https://www.themealdb.com/api/json/v1/1/random.php');
            if (data.meals) {
                this.showMealDetails(data.meals[0].idMeal);
            }
        });
    }
    showFavorites() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mealsTitle.innerText = 'Ваші обрані рецепти';
            if (this.favorites.length === 0) {
                this.mealsContainer.innerHTML = '<p class="text-center w-100">У вас поки немає обраних рецептів.</p>';
                return;
            }
            const meals = [];
            for (const id of this.favorites) {
                const data = yield this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
                if (data.meals)
                    meals.push(data.meals[0]);
            }
            this.renderMeals(meals);
        });
    }
    renderMeals(meals) {
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
    attachMealEvents() {
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (id)
                    this.showMealDetails(id);
            });
        });
        document.querySelectorAll('.meal-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                if (id)
                    this.showMealDetails(id);
            });
        });
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (id)
                    this.toggleFavorite(id, btn);
            });
        });
    }
    toggleFavorite(id, btn) {
        const index = this.favorites.indexOf(id);
        if (index > -1) {
            this.favorites.splice(index, 1);
            btn.innerText = '🤍';
            btn.classList.replace('btn-danger', 'btn-outline-danger');
        }
        else {
            this.favorites.push(id);
            btn.innerText = '❤️';
            btn.classList.replace('btn-outline-danger', 'btn-danger');
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }
    showMealDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchAPI(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            if (!data.meals)
                return;
            const meal = data.meals[0];
            const ingredients = [];
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
        });
    }
    resetToHome() {
        this.searchInput.value = '';
        this.loadPopularMeals();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new MealApp();
});
