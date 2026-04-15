const i18n = {
    es: {
        nav_home: "Hoy", nav_water: "Agua", nav_calc: "Salud",
        streak_desc: "Días seguidos", habits_title: "Tareas de hoy",
        h1: "Comida Sana", h2: "Actividad", congrats: "¡Excelente trabajo!",
        water_title: "Hidratación", water_personal: "Meta personal",
        calc_title: "Mi Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular", res_bmi: "Tu IMC", res_tdee: "Calorías",
        share_btn: "Compartir WhatsApp", install_btn: "Instalar App",
        cat1: "Bajo peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidad"
    },
    pt: {
        nav_home: "Hoje", nav_water: "Água", nav_calc: "Saúde",
        streak_desc: "Dias seguidos", habits_title: "Tarefas de hoje",
        h1: "Comida Saudável", h2: "Atividade", congrats: "Excelente trabalho!",
        water_title: "Hidratação", water_personal: "Meta pessoal",
        calc_title: "Meu Perfil", weight: "Peso (kg)", height: "Altura (cm)",
        btn_calc: "Calcular", res_bmi: "Seu IMC", res_tdee: "Calorias",
        share_btn: "Compartilhar WhatsApp", install_btn: "Instalar App",
        cat1: "Abaixo do peso", cat2: "Normal ✅", cat3: "Sobrepeso", cat4: "Obesidade"
    }
};

let state = JSON.parse(localStorage.getItem('vidasana_final')) || {
    lang: 'es', water: 0, streak: 0, lastVisit: null,
    habits: [false, false], user: { w: 70, h: 170 },
    lastCalc: null, weightHistory: []
};

let deferredPrompt = null;

const save = () => localStorage.setItem('vidasana_final', JSON.stringify(state));
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
        const pct = (done / 2) * 100;
        app.innerHTML = `
            <div class="slide-in space-y-6">
                ${deferredPrompt ? `<button onclick="installApp()" class="btn-primary p-4 rounded-2xl w-full" style="background:#0f172a; margin-bottom:15px;"><i class="fas fa-download"></i> ${t.install_btn}</button>` : ''}
                <div class="shadow-xl p-8 rounded-3xl" style="background:linear-gradient(to bottom right, #ef4444, #f97316); color:white; position:relative;">
                    <span style="font-size:12px; font-weight:bold; opacity:0.8; text-transform:uppercase;">${t.streak_desc}</span>
                    <div style="font-size:60px; font-weight:900; margin-top:5px;">${state.streak} 🔥</div>
                    <div style="background:rgba(255,255,255,0.2); height:6px; border-radius:10px; margin-top:20px; overflow:hidden;">
                        <div style="background:white; width:${pct}%; height:100%; transition:0.5s;"></div>
                    </div>
                </div>
                <div class="space-y-6">
                    <h3 style="font-weight:900; font-size:12px; color:#64748b; text-transform:uppercase;">${t.habits_title}</h3>
                    ${renderHabit(0, t.h1, 'fa-apple-alt', '#22c55e')}
                    ${renderHabit(1, t.h2, 'fa-running', '#3b82f6')}
                </div>
                <div id="congrats" style="text-align:center; transition:0.5s; opacity:${done===2?1:0};">
                    <p class="animate-bounce" style="color:#22c55e; font-weight:900;">✨ ${t.congrats} ✨</p>
                </div>
            </div>`;
    } else if (page === 'water') {
        const target = getWaterTarget();
        const pct = Math.min((state.water/target)*100, 100);
        app.innerHTML = `
            <div class="slide-in" style="text-align:center;">
                <h2 style="font-weight:900; font-size:28px;">${t.water_title}</h2>
                <div style="width:250px; height:250px; margin:30px auto; border-radius:50%; border:10px solid #f1f5f9; position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; background:white; shadow:xl;">
                    <div style="position:absolute; bottom:0; width:100%; background:#3b82f6; opacity:0.2; height:${pct}%; transition:1s;"></div>
                    <span style="font-size:50px; font-weight:900; z-index:1;">${state.water}</span>
                    <span style="font-size:14px; font-weight:bold; color:#94a3b8; z-index:1;">/ ${target} ML</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="addWater(250)" class="btn-primary p-5 rounded-3xl" style="background:white; color:#3b82f6; border:2px solid #3b82f6;">+250</button>
                    <button onclick="addWater(500)" class="btn-primary p-5 rounded-3xl" style="background:#3b82f6;">+500</button>
                </div>
                <button onclick="addWater(-250)" style="background:none; border:none; color:#94a3b8; margin-top:20px; font-size:10px; font-weight:bold; text-transform:uppercase; text-decoration:underline;">Remover -250ml</button>
            </div>`;
    } else if (page === 'calc') {
        app.innerHTML = `
            <div class="slide-in space-y-6">
                ${state.weightHistory.length > 1 ? `<div class="bg-white p-4 rounded-3xl shadow-sm"><canvas id="wChart" height="150"></canvas></div>` : ''}
                <div class="bg-white p-8 rounded-3xl shadow-sm border" style="border-color:#f1f5f9;">
                    <h2 style="font-weight:900; font-size:22px; margin-bottom:20px;">${t.calc_title}</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label style="font-size:10px; font-weight:900; color:#94a3b8; text-transform:uppercase;">${t.weight}</label>
                            <input type="number" id="iw" value="${state.user.w}" style="width:100%; background:#f8fafc; border:none; padding:15px; border-radius:15px; font-weight:bold; margin-top:5px;">
                        </div>
                        <div>
                            <label style="font-size:10px; font-weight:900; color:#94a3b8; text-transform:uppercase;">${t.height}</label>
                            <input type="number" id="ih" value="${state.user.h}" style="width:100%; background:#f8fafc; border:none; padding:15px; border-radius:15px; font-weight:bold; margin-top:5px;">
                        </div>
                    </div>
                    <button onclick="doCalc()" class="btn-primary p-5 rounded-3xl w-full" style="margin-top:20px; text-transform:uppercase; font-size:12px; letter-spacing:1px;">${t.btn_calc}</button>
                    <div id="res-box" style="margin-top:20px; display:${state.lastCalc?'block':'none'};"></div>
                </div>
            </div>`;
        if (state.lastCalc) showRes(state.lastCalc);
        if (state.weightHistory.length > 1) setTimeout(renderChart, 100);
    }
}

function renderHabit(i, name, icon, color) {
    const done = state.habits[i];
    return `
        <div onclick="toggleHabit(${i})" class="habit-card p-5 rounded-3xl flex items-center justify-between ${done?'habit-done':''}">
            <div class="flex items-center" style="gap:15px;">
                <div style="background:${color}15; color:${color}; width:45px; height:45px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:20px;">
                    <i class="fas ${icon}"></i>
                </div>
                <span style="font-weight:bold; ${done?'text-decoration:line-through; color:#94a3b8':''}">${name}</span>
            </div>
            <div style="width:25px; height:25px; border-radius:50%; border:2px solid ${done?color:'#e2e8f0'}; background:${done?color:'transparent'}; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;">
                ${done?'<i class="fas fa-check"></i>':''}
            </div>
        </div>`;
}

function toggleHabit(i) {
    state.habits[i] = !state.habits[i];
    if (state.habits.filter(h => h).length === 2) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#ef4444', '#f97316', '#22c55e'] });
    }
    save(); router('home');
}

function addWater(ml) { 
    state.water = Math.max(0, state.water + ml); 
    if (state.water >= getWaterTarget() && state.water - ml < getWaterTarget()) {
        confetti({ particleCount: 150, velocity: 30, spread: 360, colors: ['#3b82f6', '#60a5fa'] });
    }
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
    state.lastCalc = { imc: (w / ((h/100)**2)).toFixed(1), tdee: Math.round((10 * w) + (6.25 * h) - (5 * 25) + 5) };
    save(); router('calc');
}

function showRes(res) {
    const box = document.getElementById('res-box'), t = i18n[state.lang];
    let cat = res.imc < 18.5 ? t.cat1 : res.imc < 25 ? t.cat2 : res.imc < 30 ? t.cat3 : t.cat4;
    box.innerHTML = `
        <div style="background:#f8fafc; padding:20px; border-radius:20px; border:1px solid #f1f5f9;">
            <div class="flex justify-between items-center"><span style="font-size:10px; font-weight:900; color:#94a3b8; text-transform:uppercase;">${t.res_bmi}</span><span style="font-size:32px; font-weight:900; color:#ef4444;">${res.imc}</span></div>
            <div style="background:white; text-align:center; padding:10px; border-radius:12px; font-weight:bold; margin:10px 0; border:1px solid #f1f5f9;">${cat}</div>
            <div class="grid grid-cols-2 gap-4" style="margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">
                <div><span style="font-size:9px; font-weight:900; color:#94a3b8; text-transform:uppercase;">${t.res_tdee}</span><div style="font-weight:900; font-size:18px;">${res.tdee} <small style="font-weight:normal; font-size:10px;">kcal</small></div></div>
                <div><span style="font-size:9px; font-weight:900; color:#94a3b8; text-transform:uppercase;">${t.water_title}</span><div style="font-weight:900; font-size:18px; color:#3b82f6;">${getWaterTarget()} <small style="font-weight:normal; font-size:10px;">ml</small></div></div>
            </div>
            <button onclick="shareWA()" class="btn-primary w-full p-4 rounded-2xl" style="background:#25D366; margin-top:15px; display:flex; align-items:center; justify-content:center; gap:8px;"><i class="fab fa-whatsapp"></i> ${t.share_btn}</button>
        </div>`;
}

function shareWA() {
    const text = `Mi IMC es ${state.lastCalc.imc} y mi meta diaria es ${state.lastCalc.tdee} kcal. ¡Únete a VidaSana! 🔥`;
    window.open(`https://wa.me{encodeURIComponent(text)}`, '_blank');
}

function renderChart() {
    const s = document.createElement("script"); s.src = "https://jsdelivr.net";
    s.onload = () => {
        new Chart(document.getElementById('wChart').getContext('2d'), {
            type: 'line',
            data: { labels: state.weightHistory.map(d => d.date), datasets: [{ data: state.weightHistory.map(d => d.weight), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 3, fill: true, tension: 0.4 }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } } } }
        });
    };
    document.head.appendChild(s);
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
