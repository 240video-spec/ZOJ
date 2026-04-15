const i18n = {
    es: {
        nav_home: "Hoy", nav_water: "Agua", nav_calc: "Salud",
        streak_desc: "Días seguidos", habits_title: "Tareas de hoy",
        h1: "Comida Sana", h2: "Actividad", congrats: "¡Excelente!",
        water_title: "Hidratación", water_personal: "Meta personal",
        calc_title: "Mi Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular", res_bmi: "Tu IMC", res_tdee: "Calorías",
        share_btn: "Compartir WhatsApp", install_btn: "Instalar App",
        cat1: "Bajo peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidad"
    },
    pt: {
        nav_home: "Hoje", nav_water: "Água", nav_calc: "Saúde",
        streak_desc: "Dias seguidos", habits_title: "Tarefas de hoje",
        h1: "Comida Saudável", h2: "Atividade", congrats: "Excelente!",
        water_title: "Hidratação", water_personal: "Meta pessoal",
        calc_title: "Meu Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular", res_bmi: "Seu IMC", res_tdee: "Calorias",
        share_btn: "Compartilhar WhatsApp", install_btn: "Instalar App",
        cat1: "Abaixo do peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidade"
    }
};

let state = JSON.parse(localStorage.getItem('vidasana_v3')) || {
    lang: 'es', water: 0, streak: 0, lastVisit: null,
    habits: [false, false], user: { w: 70, h: 170 },
    lastCalc: null, weightHistory: []
};

let deferredPrompt = null;
const save = () => localStorage.setItem('vidasana_v3', JSON.stringify(state));
const getWaterTarget = () => Math.round((state.user.w || 70) * 35);

function updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastVisit !== today) {
        state.streak = (state.lastVisit === yesterday) ? state.streak + 1 : 1;
        state.lastVisit = today; state.water = 0; state.habits = [false, false];
        save();
    }
    document.getElementById('header-streak').innerText = state.streak;
}

function router(page) {
    const app = document.getElementById('app');
    const t = i18n[state.lang];
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById(`nav-${page}`).classList.add('tab-active');

    if (page === 'home') {
        const done = state.habits.filter(h => h).length;
        app.innerHTML = `
            <div class="space-y-6 slide-in">
                ${deferredPrompt ? `<button onclick="installApp()" class="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2"><i class="fas fa-download"></i> ${t.install_btn}</button>` : ''}
                <div class="bg-gradient-to-br from-red-500 to-orange-500 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <h2 class="opacity-80 text-xs font-black uppercase tracking-widest">${t.streak_desc}</h2>
                    <p class="text-6xl font-black mt-2">${state.streak} 🔥</p>
                    <div class="mt-6 bg-white/20 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-white h-full transition-all duration-500" style="width: ${(done/2)*100}%"></div>
                    </div>
                </div>
                <div class="space-y-3">
                    <h3 class="font-black text-slate-800 ml-2 uppercase text-xs tracking-widest">${t.habits_title}</h3>
                    ${renderHabit(0, t.h1, 'fa-apple-whole', 'text-green-500 bg-green-50')}
                    ${renderHabit(1, t.h2, 'fa-running', 'text-blue-500 bg-blue-50')}
                </div>
                <div id="congrats" class="text-center transition-all ${done===2?'opacity-100':'opacity-0'}">
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
                <div class="px-4 space-y-4">
                    <div class="flex gap-4">
                        <button onclick="addWater(250)" class="flex-1 bg-white border-2 border-blue-500 text-blue-600 p-5 rounded-3xl font-black active:scale-95 transition">+250</button>
                        <button onclick="addWater(500)" class="flex-1 bg-blue-500 text-white p-5 rounded-3xl font-black shadow-lg shadow-blue-200 active:scale-95 transition">+500</button>
                    </div>
                    <button onclick="addWater(-250)" class="text-slate-300 font-bold text-[10px] uppercase tracking-widest underline">Remover -250ml</button>
                </div>
            </div>`;
    } else if (page === 'calc') {
        app.innerHTML = `
            <div class="space-y-6 slide-in">
                <div id="chart-card" class="bg-white p-4 rounded-[2rem] shadow-sm hidden"><canvas id="wChart" height="150"></canvas></div>
                <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 text-left">
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight">${t.calc_title}</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-[10px] font-black text-slate-400 uppercase ml-2">${t.weight}</label><input type="number" id="iw" value="${state.user.w}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none"></div>
                        <div><label class="text-[10px] font-black text-slate-400 uppercase ml-2">${t.height}</label><input type="number" id="ih" value="${state.user.h}" class="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none"></div>
                    </div>
                    <button onclick="doCalc()" class="w-full bg-red-500 text-white p-5 rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">${t.btn_calc}</button>
                    <div id="res-box" class="${state.lastCalc?'':'hidden'}"></div>
                </div>
            </div>`;
        if (state.lastCalc) showRes(state.lastCalc);
        if (state.weightHistory.length > 1) {
            document.getElementById('chart-card').classList.remove('hidden');
            loadChartJS();
        }
    }
}

function renderHabit(i, name, icon, cls) {
    const done = state.habits[i];
    return `
        <div onclick="toggleHabit(${i})" class="flex items-center justify-between p-5 rounded-[1.5rem] border-2 ${done?'bg-green-50 border-green-200':'bg-white border-slate-100'} transition-all active:scale-95 cursor-pointer">
            <div class="flex items-center gap-4 text-left">
                <div class="w-12 h-12 rounded-2xl ${cls} flex items-center justify-center text-xl shadow-inner"><i class="fas ${icon}"></i></div>
                <span class="font-bold ${done?'text-slate-400 line-through':'text-slate-700'}">${name}</span>
            </div>
            <div class="w-8 h-8 rounded-full border-2 ${done?'bg-green-500 border-green-500':'border-slate-200'} flex items-center justify-center text-white transition-all"><i class="fas fa-check text-[10px]"></i></div>
        </div>`;
}

function toggleHabit(i) {
    state.habits[i] = !state.habits[i];
    if (state.habits.filter(h => h).length === 2) confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    save(); router('home');
}

function addWater(ml) {
    state.water = Math.max(0, state.water + ml);
    if (state.water >= getWaterTarget() && state.water - ml < getWaterTarget()) confetti({ particleCount: 150, colors:['#3b82f6','#60a5fa'] });
    save(); router('water');
}

function doCalc() {
    const w = parseFloat(document.getElementById('iw').value), h = parseFloat(document.getElementById('ih').value);
    const today = new Date().toLocaleDateString(state.lang==='es'?'es-ES':'pt-BR', {day:'numeric', month:'short'});
    if (state.weightHistory.length === 0 || state.weightHistory[state.weightHistory.length - 1].date !== today) {
        state.weightHistory.push({ date: today, weight: w });
        if (state.weightHistory.length > 7) state.weightHistory.shift();
    }
    state.user = {w, h};
    state.lastCalc = { imc: (w/((h/100)**2)).toFixed(1), tdee: Math.round((10*w)+(6.25*h)-(5*25)+5) };
    save(); router('calc');
}

function showRes(res) {
    const box = document.getElementById('res-box'), t = i18n[state.lang];
    let cat = res.imc < 18.5 ? t.cat1 : res.imc < 25 ? t.cat2 : res.imc < 30 ? t.cat3 : t.cat4;
    box.innerHTML = `
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 text-left">
            <div class="flex justify-between items-end"><span class="text-slate-500 text-[10px] font-black uppercase">${t.res_bmi}</span><span class="text-4xl font-black text-red-500">${res.imc}</span></div>
            <p class="text-center font-bold text-slate-700 bg-white py-2 rounded-xl shadow-sm text-sm">${cat}</p>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div><p class="text-[9px] font-black text-slate-400 uppercase">${t.res_tdee}</p><p class="text-lg font-black text-slate-800">${res.tdee} <small class="font-normal opacity-50">kcal</small></p></div>
                <div><p class="text-[9px] font-black text-slate-400 uppercase">${t.water_title}</p><p class="text-lg font-black text-blue-600">${getWaterTarget()} <small class="font-normal opacity-50">ml</small></p></div>
            </div>
            <button onclick="shareWA()" class="w-full bg-[#25D366] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2 active:scale-95 transition"><i class="fab fa-whatsapp"></i> ${t.share_btn}</button>
        </div>`;
}

function shareWA() {
    const t = `¡Mi IMC es ${state.lastCalc.imc} y mi meta es ${state.lastCalc.tdee} kcal! 🔥`;
    window.open(`https://wa.me{encodeURIComponent(t)}`, '_blank');
}

function loadChartJS() {
    if (window.Chart) return renderChart();
    const s = document.createElement("script");
    s.src = "https://jsdelivr.net";
    s.onload = renderChart;
    document.head.appendChild(s);
}

function renderChart() {
    const ctx = document.getElementById('wChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: state.weightHistory.map(d => d.date),
            datasets: [{ data: state.weightHistory.map(d => d.weight), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 3, fill: true, tension: 0.4 }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } } } }
    });
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
    sel.value = state.lang;
    sel.onchange = (e) => { state.lang = e.target.value; save(); router('home'); };
    router('home');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
});
