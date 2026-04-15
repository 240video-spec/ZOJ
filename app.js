// Проверяем сохраненное состояние или создаем новое
let state = JSON.parse(localStorage.getItem('vidasana_state')) || {
    lang: 'es', // Это значение изменится ниже, если есть сохраненное
    water: 0,
    streak: 0,
    lastVisit: null,
    habits: [false, false],
    user: { w: 70, h: 170, a: 25 },
    lastCalc: null
};

// КРИТИЧЕСКИЙ МОМЕНТ: Синхронизируем селект с сохраненным языком
function initLang() {
    const selector = document.getElementById('lang-select');
    selector.value = state.lang; // Ставим тот язык, который в стейте
    
    selector.addEventListener('change', (e) => {
        state.lang = e.target.value;
        save();
        router(currentScreen); // Перерисовываем текущий экран на новом языке
    });
}

let currentScreen = 'home'; // Глобальная переменная для отслеживания экрана

function router(page) {
    currentScreen = page; // Запоминаем, где мы
    const app = document.getElementById('app');
    const t = i18n[state.lang];
    
    // Обновляем текст в навигации (динамически при смене языка)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerText = t[key];
    });

    // Логика навигации (подсветка табов)
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('text-red-500', 'tab-active'));
    document.getElementById(`nav-${page}`).classList.add('text-red-500', 'tab-active');

    if (page === 'home') {
        app.innerHTML = `
            <div class="space-y-6 slide-in">
                <div class="bg-gradient-to-br from-red-500 to-orange-500 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <h2 class="text-white/80 text-sm font-bold uppercase tracking-widest">${t.streak_desc}</h2>
                    <p class="text-6xl font-black mt-2">${state.streak} <span class="text-3xl">🔥</span></p>
                    <i class="fas fa-bolt absolute right-[-10px] bottom-[-10px] text-white/10 text-9xl"></i>
                </div>
                <div class="space-y-3">
                    <h3 class="text-slate-800 font-bold px-1">${t.habits_title}</h3>
                    ${renderHabit(0, t.h1, 'fa-apple-whole', 'bg-green-100 text-green-600')}
                    ${renderHabit(1, t.h2, 'fa-person-running', 'bg-purple-100 text-purple-600')}
                </div>
            </div>
        `;
    } else if (page === 'water') {
        let pct = Math.min((state.water / 2000) * 100, 100);
        app.innerHTML = `
            <div class="text-center py-8 space-y-8">
                <h2 class="text-3xl font-black text-slate-800">${t.water_title}</h2>
                <div class="w-64 h-64 mx-auto bg-white rounded-full border-[12px] border-slate-100 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                    <div class="absolute bottom-0 w-full bg-blue-500/20 transition-all duration-1000" style="height: ${pct}%"></div>
                    <span class="text-5xl font-black text-slate-800 z-10">${state.water}</span>
                    <span class="text-slate-400 font-bold z-10">/ 2000 ml</span>
                </div>
                <div class="flex flex-col gap-3 px-4">
                    <div class="flex gap-4">
                        <button onclick="addWater(250)" class="flex-1 bg-white border-2 border-blue-500 text-blue-600 p-4 rounded-2xl font-bold">+250ml</button>
                        <button onclick="addWater(500)" class="flex-1 bg-blue-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-200">+500ml</button>
                    </div>
                    <button onclick="removeWater(250)" class="text-slate-400 text-[10px] font-bold uppercase tracking-tighter underline">Remover -250ml</button>
                </div>
            </div>
        `;
    } else if (page === 'calc') {
        app.innerHTML = `
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <h2 class="text-2xl font-black text-slate-800">${t.calc_title}</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">${t.weight}</label>
                        <input type="number" id="iw" value="${state.user.w}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">${t.height}</label>
                        <input type="number" id="ih" value="${state.user.h}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none">
                    </div>
                </div>
                <button onclick="doCalc()" class="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold uppercase tracking-widest text-sm">
                    ${t.btn_calc}
                </button>
                <div id="res-box" class="${state.lastCalc ? '' : 'hidden'}"></div>
            </div>
        `;
        if (state.lastCalc) showCalcResult(state.lastCalc);
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    updateStreak();
    initLang(); // Инициализируем язык
    router('home'); // Загружаем стартовый экран
});
