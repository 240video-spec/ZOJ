const i18n = {
    es: {
        nav_home: "Hoy", nav_water: "Agua", nav_food: "Kcal", nav_calc: "Salud",
        streak_desc: "Días seguidos", habits_title: "Tareas de hoy",
        h1: "Comida Sana", h2: "Actividad", congrats: "¡Excelente!",
        water_title: "Hidratación", meta_label: "Meta personal",
        calc_title: "Mi Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular", res_bmi: "Tu IMC", res_tdee: "Tu meta",
        share_btn: "Compartir WhatsApp", install_btn: "Instalar App",
        cat1: "Bajo peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidad",
        history_title: "Historial de peso",
        food_title: "Calorías del día", food_left: "restantes", food_add: "Añadir",
        personalize: "Personalizar metas", meta_upd: "¡Metas actualizadas!"
    },
    pt: {
        nav_home: "Hoje", nav_water: "Água", nav_food: "Kcal", nav_calc: "Saúde",
        streak_desc: "Dias seguidos", habits_title: "Tarefas de hoje",
        h1: "Comida Saudável", h2: "Atividade", congrats: "Excelente!",
        water_title: "Hidratação", meta_label: "Meta pessoal",
        calc_title: "Meu Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular", res_bmi: "Seu IMC", res_tdee: "Sua meta",
        share_btn: "Compartilhar WhatsApp", install_btn: "Instalar App",
        cat1: "Abaixo do peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidade",
        history_title: "Histórico de peso",
        food_title: "Calorias do dia", food_left: "restantes", food_add: "Adicionar",
        personalize: "Personalizar metas", meta_upd: "Metas atualizadas!"
    }
};

let state = JSON.parse(localStorage.getItem('vidasana_vFinal_Full')) || {
    lang: 'es', water: 0, streak: 0, lastVisit: null,
    habits: [false, false], user: { w: 70, h: 170 },
    lastCalc: null, weightHistory: [], foodEaten: 0
};

let deferredPrompt = null;
const save = () => localStorage.setItem('vidasana_vFinal_Full', JSON.stringify(state));
const getWaterTarget = () => Math.round((state.user.w || 70) * 35);
const getKcalTarget = () => state.lastCalc ? state.lastCalc.tdee : 2000;

function updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastVisit !== today) {
        state.streak = (state.lastVisit === yesterday) ? state.streak + 1 : 1;
        state.lastVisit = today; state.water = 0; state.habits = [false, false]; state.foodEaten = 0;
        save();
    }
    const headerStr = document.getElementById('header-streak');
    if (headerStr) headerStr.innerText = state.streak;
}

function router(page) {
    const app = document.getElementById('app');
    const t = i18n[state.lang];
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('tab-active'));
    const currentNav = document.getElementById(`nav-${page}`);
    if (currentNav) currentNav.classList.add('tab-active');

    const needsCalc = !state.lastCalc;

    if (page === 'home') {
        const done = state.habits.filter(h => h).length;
        app.innerHTML = `
            <div class="space-y-6 slide-in">
                ${deferredPrompt ? `<button onclick="installApp()" class="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4"><i class="fas fa-download"></i> ${t.install_btn}</button>` : ''}
                <div class="bg-gradient-to-br from-red-500 to-orange-500 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <h2 class="opacity-80 text-xs font-black uppercase tracking-widest text-left">${t.streak_desc}</h2>
                    <p class="text-6xl font-black mt-2 text-left">${state.streak} 🔥</p>
                    <div class="mt-6 bg-white/20 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-white h-full transition-all duration-500" style="width: ${(done/2)*100}%"></div>
                    </div>
                </div>
                <div class="space-y-3">
                    <h3 class="font-black text-slate-800 ml-2 uppercase text-xs tracking-widest text-left">${t.habits_title}</h3>
                    ${renderHabit(0, t.h1, 'fa-apple-whole', 'text-green-500 bg-green-50')}
                    ${renderHabit(1, t.h2, 'fa-running', 'text-blue-500 bg-blue-50')}
                </div>
                <div id="congrats" class="text-center transition-all duration-500 ${done===2?'opacity-100':'opacity-0 pointer-events-none'}">
                    <p class="text-green-500 font-black animate-bounce">✨ ${t.congrats} ✨</p>
                </div>
            </div>`;
    } else if (page === 'water') {
        const target = getWaterTarget();
        app.innerHTML = `
            <div class="text-center py-6 space-y-8 slide-in">
                <h2 class="text-3xl font-black text-slate-800">${t.water_title}</h2>
                <div class="w-64 h-64 mx-auto bg-white rounded-full border-[10px] border-slate-100 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
                    <div class="absolute bottom-0 w-full bg-blue-400 opacity-20 transition-all duration-1000" style="height: ${Math.min((state.water/target)*100, 100)}%"></div>
                    <span class="text-5xl font-black text-slate-800 z-10">${state.water}</span>
                    <span class="text-slate-400 font-bold z-10 text-xs mt-1">/ ${target} ML</span>
                </div>
                ${needsCalc ? `
                    <button onclick="router('calc')" class="text-[10px] bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-bold uppercase animate-pulse">
                        ${t.personalize} <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                ` : `<p class="text-[10px] font-black text-blue-500 uppercase tracking-widest">${t.meta_label}: ${target} ml</p>`}
                <div class="flex gap-4 w-full px-4">
                    <button onclick="addWater(250)" class="flex-1 bg-white border-2 border-blue-500 text-blue-600 p-5 rounded-3xl font-black active:scale-95 transition">+250</button>
                    <button onclick="addWater(500)" class="flex-1 bg-blue-500 text-white p-5 rounded-3xl font-black shadow-lg active:scale-95 transition">+500</button>
                </div>
            </div>`;
    } else if (page === 'food') {
        const target = getKcalTarget();
        const left = target - state.foodEaten;
        app.innerHTML = `
            <div class="text-center py-6 space-y-8 slide-in">
                <h2 class="text-3xl font-black text-slate-800">${t.food_title}</h2>
                <div class="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 inline-block w-full">
                    <p class="text-6xl font-black ${left < 0 ? 'text-red-500' : 'text-orange-500'}">${left}</p>
                    <p class="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">${t.food_left} kcal</p>
                </div>
                ${needsCalc ? `
                    <button onclick="router('calc')" class="text-[10px] bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-bold uppercase animate-pulse">
                        ${t.personalize} <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                ` : `<p class="text-[10px] font-black text-orange-500 uppercase tracking-widest">${t.meta_label}: ${target} kcal</p>`}
                <div class="flex gap-2 px-4">
                    <input type="number" id="kcal-input" placeholder="200" class="flex-1 bg-white p-5 rounded-3xl font-bold border-2 border-slate-100 outline-none">
                    <button onclick="addFood()" class="bg-orange-500 text-white px-8 rounded-3xl font-black shadow-lg active:scale-95 transition">${t.food_add}</button>
                </div>
            </div>`;
    } else if (page === 'calc') {
        app.innerHTML = `
            <div class="space-y-6 slide-in">
                <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 text-left">
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight text-left">${t.calc_title}</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-[10px] font-black text-slate-400 uppercase ml-2 text-left">${t.weight}</label><input type="number" id="iw" value="${state.user.w}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-100"></div>
                        <div><label class="text-[10px] font-black text-slate-400 uppercase ml-2 text-left">${t.height}</label><input type="number" id="ih" value="${state.user.h}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-100"></div>
                    </div>
                    <button onclick="doCalc()" class="w-full bg-red-500 text-white p-5 rounded-2xl font-black shadow-lg uppercase text-xs active:scale-95 transition">${t.btn_calc}</button>
                    <div id="res-box" class="${state.lastCalc?'':'hidden'}"></div>
                </div>
                ${renderHistoryList(t)}
            </div>`;
        if (state.lastCalc) showRes(state.lastCalc);
    }
}

function renderHabit(i, name, icon, cls) {
    const done = state.habits[i];
    return `
        <div onclick="toggleHabit(${i})" class="flex items-center justify-between p-5 rounded-[1.5rem] border-2 ${done?'bg-green-50 border-green-200':'bg-white border-slate-100'} transition-all cursor-pointer select-none">
            <div class="flex items-center gap-4 text-left pointer-events-none">
                <div class="w-12 h-12 rounded-2xl ${cls} flex items-center justify-center text-xl shadow-inner"><i class="fas ${icon}"></i></div>
                <span class="font-bold ${done?'text-slate-400 line-through':'text-slate-700'} text-left">${name}</span>
            </div>
            <div class="w-8 h-8 rounded-full border-2 ${done?'bg-green-500 border-green-500':'border-slate-200'} flex items-center justify-center text-white pointer-events-none transition-all">
                ${done ? '<i class="fas fa-check text-[10px]"></i>' : ''}
            </div>
        </div>`;
}

function renderHistoryList(t) {
    if (state.weightHistory.length === 0) return '';
    return `
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 space-y-3 slide-in">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest text-left ml-2">${t.history_title}</h3>
            <div class="space-y-2">
                ${state.weightHistory.slice().reverse().map(item => `
                    <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span class="text-xs font-bold text-slate-500">${item.date}</span>
                        <span class="font-black text-slate-800">${item.weight} kg</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

function toggleHabit(i) {
    state.habits[i] = !state.habits[i];
    save();
    if (state.habits.filter(h => h).length === 2 && window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    router('home');
}

function addWater(ml) {
    state.water = Math.max(0, state.water + ml);
    if (state.water >= getWaterTarget() && state.water - ml < getWaterTarget() && window.confetti) {
        confetti({ particleCount: 150, colors: ['#3b82f6', '#60a5fa'] });
    }
    save(); router('water');
}

function addFood() {
    const el = document.getElementById('kcal-input');
    const val = parseInt(el.value);
    if (val) {
        state.foodEaten += val;
        save(); router('food');
    }
}

function doCalc() {
    const w = parseFloat(document.getElementById('iw').value), h = parseFloat(document.getElementById('ih').value);
    const today = new Date().toLocaleDateString(state.lang==='es'?'es-ES':'pt-BR', {day:'numeric', month:'short'});
    if (state.weightHistory.length === 0 || state.weightHistory[state.weightHistory.length - 1].date !== today) {
        state.weightHistory.push({ date: today, weight: w });
        if (state.weightHistory.length > 5) state.weightHistory.shift();
    }
    state.user = {w, h};
    state.lastCalc = { imc: (w/((h/100)**2)).toFixed(1), tdee: Math.round((10*w)+(6.25*h)-(5*25)+5) };
    save(); router('calc');
}

function showRes(res) {
    const box = document.getElementById('res-box'), t = i18n[state.lang];
    let cat = res.imc < 18.5 ? t.cat1 : res.imc < 25 ? t.cat2 : res.imc < 30 ? t.cat3 : t.cat4;
    box.innerHTML = `
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 text-left slide-in">
            <div class="flex items-center justify-center gap-2 text-green-600 font-bold text-[10px] uppercase">
                <i class="fas fa-check-circle"></i> <span>${t.meta_upd}</span>
            </div>
            <div class="flex justify-between items-end"><span class="text-slate-500 text-[10px] font-black uppercase">${t.res_bmi}</span><span class="text-4xl font-black text-red-500">${res.imc}</span></div>
            <p class="text-center font-bold text-slate-700 bg-white py-2 rounded-xl shadow-sm text-sm border border-slate-100">${cat}</p>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div><p class="text-[9px] font-black text-slate-400 uppercase">${t.res_tdee}</p><p class="text-lg font-black text-slate-800">${res.tdee} <small class="font-normal opacity-50 italic text-[10px]">kcal</small></p></div>
                <div><p class="text-[9px] font-black text-slate-400 uppercase">${t.water_title}</p><p class="text-lg font-black text-blue-600">${getWaterTarget()} <small class="font-normal opacity-50 italic text-[10px]">ml</small></p></div>
            </div>
            <button onclick="shareWA()" class="w-full bg-[#25D366] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2 active:scale-95 transition shadow-md"><i class="fab fa-whatsapp"></i> ${t.share_btn}</button>
        </div>`;
}

function shareWA() {
    const text = `¡Mi IMC es ${state.lastCalc.imc} y mi meta diaria es ${state.lastCalc.tdee} kcal! 🔥`;
    window.open(`https://wa.me{encodeURIComponent(text)}`, '_blank');
}

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; router('home'); });

async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') deferredPrompt = null;
    router('home');
}

document.addEventListener('DOMContentLoaded', () => {
    updateStreak();
    const sel = document.getElementById('lang-select');
    if (sel) {
        sel.value = state.lang;
        sel.onchange = (e) => { state.lang = e.target.value; save(); router('home'); };
    }
    router('home');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
});
