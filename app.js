// 1. Конфигурация текстов
const i18n = {
    es: {
        nav_home: "Hoy", nav_water: "Agua", nav_calc: "Salud",
        streak_desc: "Días seguidos", habits_title: "Hábitos Diarios",
        h1: "Comida Sana", h2: "Actividad", congrats: "¡Excelente!",
        water_title: "Hidratación", water_personal: "Tu meta personal",
        calc_title: "Mi Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular Ahora", res_bmi: "Tu IMC", res_tdee: "Calorías diarias",
        share_btn: "Compartir resultado", install_btn: "Instalar App",
        cat1: "Bajo peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidad"
    },
    pt: {
        nav_home: "Hoje", nav_water: "Água", nav_calc: "Saúde",
        streak_desc: "Dias seguidos", habits_title: "Hábitos Diários",
        h1: "Comida Saudável", h2: "Atividade", congrats: "Excelente!",
        water_title: "Hidratação", water_personal: "Sua meta pessoal",
        calc_title: "Meu Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular Agora", res_bmi: "Seu IMC", res_tdee: "Calorias diárias",
        share_btn: "Compartilhar resultado", install_btn: "Instalar App",
        cat1: "Abaixo do peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidade"
    }
};

// 2. Состояние приложения
let state = JSON.parse(localStorage.getItem('vidasana_v2')) || {
    lang: 'es', water: 0, streak: 0, lastVisit: null,
    habits: [false, false], user: { w: 70, h: 170 }, 
    lastCalc: null, weightHistory: []
};

let deferredPrompt;

// 3. Системные функции
const save = () => localStorage.setItem('vidasana_v2', JSON.stringify(state));
const getWaterTarget = () => Math.round((state.user.w || 70) * 35);

function updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastVisit !== today) {
        state.streak = (state.lastVisit === yesterday) ? state.streak + 1 : 1;
        state.lastVisit = today; state.water = 0; state.habits = [false, false];
        save();
    }
}

// 4. Роутинг и Интерфейс
function router(page) {
    const app = document.getElementById('app');
    const t = i18n[state.lang];
    
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`nav-${page}`).classList.add('tab-active');

    if (page === 'home') {
        const doneCount = state.habits.filter(h => h).length;
        const progressPct = (doneCount / state.habits.length) * 100;

        app.innerHTML = `
            <div class="space-y-6 slide-in">
                <button id="pwa-btn" onclick="installApp()" class="hidden w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3">
                    <i class="fas fa-mobile-screen"></i> ${t.install_btn}
                </button>
                <div class="bg-gradient-to-br from-red-500 to-orange-500 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <h2 class="opacity-80 text-xs font-black uppercase tracking-widest">${t.streak_desc}</h2>
                    <p class="text-6xl font-black mt-2">${state.streak} 🔥</p>
                    <div class="mt-6 bg-white/20 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-white h-full transition-all duration-500" style="width: ${progressPct}%"></div>
                    </div>
                </div>
                <div class="space-y-3">
                    <h3 class="font-black text-slate-800 ml-2 uppercase text-xs tracking-widest">${t.habits_title}</h3>
                    ${renderHabit(0, t.h1, 'fa-apple-whole', 'text-green-500 bg-green-50')}
                    ${renderHabit(1, t.h2, 'fa-running', 'text-blue-500 bg-blue-50')}
                </div>
                ${doneCount === 2 ? `<p class="text-center text-green-500 font-bold animate-bounce text-sm">✨ ${t.congrats} ✨</p>` : ''}
            </div>`;
    } else if (page === 'water') {
        const target = getWaterTarget();
        let pct = Math.min((state.water / target) * 100, 100);
        app.innerHTML = `
            <div class="text-center py-6 space-y-8 slide-in">
                <h2 class="text-3xl font-black text-slate-800">${t.water_title}</h2>
                <div class="w-64 h-64 mx-auto bg-white rounded-full border-[10px] border-slate-100 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
                    <div class="absolute bottom-0 w-full bg-blue-400 opacity-20 transition-all duration-1000" style="height: ${pct}%"></div>
                    <span class="text-5xl font-black text-slate-800 z-10">${state.water}</span>
                    <span class="text-slate-400 font-bold z-10 text-xs mt-1">/ ${target} ML</span>
                </div>
                <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest">${t.water_personal}</p>
                <div class="px-4 space-y-4">
                    <div class="flex gap-4">
                        <button onclick="addWater(250)" class="flex-1 bg-white border-2 border-blue-500 text-blue-600 p-5 rounded-3xl font-black active:scale-95 transition">+250</button>
                        <button onclick="addWater(500)" class="flex-1 bg-blue-500 text-white p-5 rounded-3xl font-black active:scale-95 transition">+500</button>
                    </div>
                    <button onclick="addWater(-250)" class="text-slate-300 font-bold text-[10px] uppercase tracking-widest underline">Remover -250ml</button>
                </div>
            </div>`;
    } else if (page === 'calc') {
        app.innerHTML = `
            <div class="space-y-6 slide-in text-left">
                ${state.weightHistory.length > 1 ? `<div class="bg-white p-4 rounded-[2rem] shadow-sm"><canvas id="weightChart" height="150"></canvas></div>` : ''}
                <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">${t.calc_title}</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">${t.weight}</label>
                            <input type="number" id="iw" value="${state.user.w}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-100">
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">${t.height}</label>
                            <input type="number" id="ih" value="${state.user.h}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-100">
                        </div>
                    </div>
                    <button onclick="doCalc()" class="w-full bg-red-500 text-white p-5 rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">${t.btn_calc}</button>
                    <div id="res-box" class="${state.lastCalc ? '' : 'hidden'}"></div>
                </div>
            </div>`;
        if (state.lastCalc) showRes(state.lastCalc);
        if (state.weightHistory.length > 1) setTimeout(renderChart, 50);
    }
}

// 5. Логика привычек
function renderHabit(i, name, icon, cls) {
    const isDone = state.habits[i];
    return `
        <div onclick="toggleHabit(${i})" class="flex items-center justify-between p-5 rounded-[1.5rem] border-2 ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'} transition-all active:scale-95 cursor-pointer">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl ${cls} flex items-center justify-center text-xl shadow-inner"><i class="fas ${icon}"></i></div>
                <span class="font-bold ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}">${name}</span>
            </div>
            <div class="w-8 h-8 rounded-full border-2 ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-200'} flex items-center justify-center text-white transition-all">
                <i class="fas fa-check text-[10px]"></i>
            </div>
        </div>`;
}

function toggleHabit(i) { state.habits[i] = !state.habits[i]; save(); router('home'); }
function addWater(ml) { state.water = Math.max(0, state.water + ml); save(); router('water'); }

// 6. Логика расчетов и Графиков
function doCalc() {
    const w = parseFloat(document.getElementById('iw').value), h = parseFloat(document.getElementById('ih').value);
    const today = new Date().toLocaleDateString(state.lang === 'es' ? 'es-ES' : 'pt-BR', {day:'numeric', month:'short'});
    
    if (state.weightHistory.length === 0 || state.weightHistory[state.weightHistory.length - 1].date !== today) {
        state.weightHistory.push({ date: today, weight: w });
        if (state.weightHistory.length > 7) state.weightHistory.shift();
    }
    
    const imc = (w / ((h/100)**2)).toFixed(1);
    const tdee = Math.round((10 * w) + (6.25 * h) - (5 * 25) + 5);
    state.user = {w, h}; state.lastCalc = {imc, tdee}; save();
    router('calc');
}

function showRes(res) {
    const box = document.getElementById('res-box'), t = i18n[state.lang];
    const waterT = getWaterTarget();
    box.classList.remove('hidden');
    let cat = res.imc < 18.5 ? t.cat1 : res.imc < 25 ? t.cat2 : res.imc < 30 ? t.cat3 : t.cat4;
    box.innerHTML = `
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <div class="flex justify-between items-end"><span class="text-slate-500 text-[10px] font-black uppercase">${t.res_bmi}</span><span class="text-4xl font-black text-red-500">${res.imc}</span></div>
            <p class="text-center font-bold text-slate-700 bg-white py-2 rounded-xl shadow-sm text-sm">${cat}</p>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div><p class="text-[9px] font-black text-slate-400 uppercase">${t.res_tdee}</p><p class="text-lg font-black text-slate-800">${res.tdee} <span class="text-[9px] font-normal">kcal</span></p></div>
                <div><p class="text-[9px] font-black text-slate-400 uppercase">${t.water_title}</p><p class="text-lg font-black text-blue-600">${waterT} <span class="text-[9px] font-normal">ml</span></p></div>
            </div>
            <button onclick="shareWA()" class="w-full bg-[#25D366] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2 active:scale-95 transition shadow-lg shadow-green-100">
                <i class="fab fa-whatsapp text-lg"></i> ${t.share_btn}
            </button>
        </div>`;
}

function renderChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: state.weightHistory.map(d => d.date),
            datasets: [{
                data: state.weightHistory.map(d => d.weight),
                borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)',
                borderWidth: 3, fill: true, tension: 0.4, pointRadius: 4
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } } } }
    });
}

function shareWA() {
    const res = state.lastCalc;
    const text = `¡Hola! Mi IMC es ${res.imc} y mi meta diaria es ${res.tdee} kcal. ¡Cuida tu salud con VidaSana! 🔥`;
    window.open(`https://wa.me{encodeURIComponent(text)}`, '_blank');
}

// 7. Инициализация PWA и Событий
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const btn = document.getElementById('pwa-btn'); if(btn) btn.classList.remove('hidden');
});

async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('pwa-btn').classList.add('hidden');
    deferredPrompt = null;
}

document.addEventListener('DOMContentLoaded', () => {
    updateStreak();
    const sel = document.getElementById('lang-select');
    sel.value = state.lang;
    sel.addEventListener('change', (e) => { 
        state.lang = e.target.value; 
        save(); 
        router('home'); 
    });
    router('home');
});
