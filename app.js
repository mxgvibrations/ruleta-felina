// ==========================================
// CONFIGURACIÓN DE SONIDOS (Howler.js)
// ==========================================
const sonidos = {
    menu_music: new Howl({ src: ['menu_music.mp3', 'sounds/menu_music.wav'], loop: true, volume: 0.4 }),
    menu_move: new Howl({ src: ['menu_move.mp3', 'sounds/menu_move.wav'] }),
    menu_select: new Howl({ src: ['sounds/menu_select.mp3', 'menu_select.wav'] }),
    g_catreverb: new Howl({ src: ['sounds/g_catreverb.mp3', 'g_catreverb.wav'] }),
    g_catsmirk: new Howl({ src: ['sounds/g_catsmirk.mp3', 'g_catsmirk.wav'] }),
    g_save: new Howl({ src: ['sounds/g_save.mp3', 'g_save.wav'] }),
    powerup: new Howl({ src: ['menu_select.mp3', 'sounds/menu_select.wav'] }), // Reutilizado/modificado para items
    
    g_bad: [
        new Howl({ src: ['g_bad1.mp3', 'g_bad1.wav'] }),
        new Howl({ src: ['g_bad2.mp3', 'g_bad2.wav'] })
    ],
    g_good: [
        new Howl({ src: ['g_good1.mp3', 'g_good1.wav'] }),
        new Howl({ src: ['g_good2.mp3', 'g_good2.wav'] }),
        new Howl({ src: ['g_good3.mp3', 'g_good3.wav'] }),
        new Howl({ src: ['g_good4.mp3', 'g_good4.wav'] })
    ],
    g_cats: [
        new Howl({ src: ['g_cat_1.mp3', 'g_cat_1.wav'] }),
        new Howl({ src: ['g_cat_2.mp3', 'g_cat_2.wav'] }),
        new Howl({ src: ['g_cat_3.mp3', 'g_cat_3.wav'] }),
        new Howl({ src: ['g_cat_4.mp3', 'g_cat_4.wav'] }),
        new Howl({ src: ['g_cat_5.mp3', 'g_cat_5.wav'] }),
        new Howl({ src: ['g_cat_6.mp3', 'g_cat_6.wav'] }),
        new Howl({ src: ['g_cat_7.mp3', 'g_cat_7.wav'] })
    ]
};

function detenerTodoElAudio() {
    Object.keys(sonidos).forEach(key => {
        if (Array.isArray(sonidos[key])) {
            sonidos[key].forEach(s => s.stop());
        } else {
            sonidos[key].stop();
        }
    });
}

// ==========================================
// CONFIGURACIÓN DE VOZ (LECTOR VS TTS)
// ==========================================
let sistemaVozElegido = false; 
let usarTTSNativo = false; 

function decir(texto) {
    document.getElementById("game-status").innerText = texto;
    const speaker = document.getElementById("accessible-speaker");
    speaker.innerText = "";
    
    if (!usarTTSNativo) {
        setTimeout(() => { speaker.innerText = texto; }, 50);
    } else {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = "es-ES";
            window.speechSynthesis.speak(utterance);
        }
    }
}

// ==========================================
// VARIABLES DE ESTADO Y ESTRUCTURA DEL JUEGO
// ==========================================
let enMenuPrincipal = false;
let enTienda = false;

let menuOpciones = [
    "Modo Normal", 
    "Modo Supervivencia", 
    "Modo Contrarreloj",
    "Modo Gato Saboteador",
    "Tienda de Objetos",
    "Voz Nativa", 
    "Salir del juego"
];
let menuIndice = 0;

let tiendaOpciones = [
    { nombre: "🛡️ Escudo de Cascabel", costo: 30, key: "escudos", desc: "Protege de 1 explosión" },
    { nombre: "🔍 Ojo de Lince", costo: 25, key: "lince", desc: "Revela y descarta un gato trampa" },
    { nombre: "🐟 Sardina Dorada", costo: 40, key: "sardinas", desc: "Duplica puntos de la siguiente ronda" },
    { nombre: "⬅️ Volver al Menú Principal", costo: 0, key: "volver", desc: "" }
];
let tiendaIndice = 0;

let juego = {
    modo: 1, // 1: Normal, 2: Supervivencia, 3: Contrarreloj, 4: Saboteador
    rondaActual: 1, 
    maxRondas: 3, 
    gatosEnPantalla: 2,
    gatoCorrecto: 0, 
    puntosRonda: 0, 
    puntosTotales: 0, 
    vidas: 0, 
    tiempoRestante: 45,
    timerInterval: null,
    saboteadorInterval: null,
    jugando: false,
    bloqueoTeclado: false,
    gatosEliminadosByLince: [],
    
    // Inventario
    inventario: {
        escudos: 0,
        lince: 0,
        sardinas: 0
    },
    sardinaActiva: false
};

function actualizarInterfaz() {
    document.getElementById("txt-ronda").innerText = juego.jugando ? `${juego.rondaActual}/${juego.maxRondas}` : "--";
    document.getElementById("txt-puntos-totales").innerText = juego.puntosTotales;
    document.getElementById("txt-puntos-ronda").innerText = juego.puntosRonda;
    
    // Vidas o Tiempo según el modo
    if (juego.jugando) {
        if (juego.modo === 2) document.getElementById("txt-vidas").innerText = `${juego.vidas} Vidas`;
        else if (juego.modo === 3) document.getElementById("txt-vidas").innerText = `${juego.tiempoRestante}s`;
        else document.getElementById("txt-vidas").innerText = "∞";
    } else {
        document.getElementById("txt-vidas").innerText = "--";
    }

    // Actualizar Récord
    const record = localStorage.getItem("ruleta_felina_record") || 0;
    document.getElementById("txt-record").innerText = record;

    // Actualizar Inventario en UI
    document.getElementById("inv-escudos").innerText = juego.inventario.escudos;
    document.getElementById("inv-lince").innerText = juego.inventario.lince;
    document.getElementById("inv-sardinas").innerText = juego.inventario.sardinas;
    
    const btnEscape = document.getElementById("btn-escape");
    btnEscape.disabled = !juego.jugando || juego.puntosRonda === 0 || juego.bloqueoTeclado;
}

// ==========================================
// PANTALLA INICIAL DE CONFIGURACIÓN
// ==========================================
function mostrarPantallaInicio() {
    const container = document.getElementById("cats-container");
    container.innerHTML = `
        <div class="cat-btn active" style="font-size: 1.2em; text-align: center; padding: 20px;">
            <strong>CONFIGURACIÓN DE VOZ</strong><br><br>
            Presiona <mark>1</mark> para LECTOR DE PANTALLA (NVDA/JAWS)<br>
            Presiona <mark>2</mark> para VOZ NATIVA DEL NAVEGADOR
        </div>
    `;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance("Configuración de voz. Presiona 1 para Lector de Pantalla o 2 para Voz Nativa.");
        u.lang = "es-ES";
        window.speechSynthesis.speak(u);
    }
    document.getElementById("accessible-speaker").innerText = "Configuración de voz. Presiona 1 para Lector de Pantalla o 2 para Voz Nativa.";
}

function configurarVozInicial(opcion) {
    usarTTSNativo = (opcion === 2);
    sistemaVozElegido = true;
    
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
    }
    
    sonidos.menu_select.play();
    decir(usarTTSNativo ? "Modo voz nativa activado." : "Modo lector de pantalla activado.");
    setTimeout(iniciarMenu, 1200);
}

// ==========================================
// MENÚ PRINCIPAL
// ==========================================
function iniciarMenu() {
    limpiarIntervalos();
    enMenuPrincipal = true;
    enTienda = false;
    juego.jugando = false;
    juego.bloqueoTeclado = false;
    menuIndice = 0;
    actualizarInterfaz();
    
    detenerTodoElAudio();
    sonidos.menu_music.volume(0.4);
    if (!sonidos.menu_music.playing()) sonidos.menu_music.play();

    renderizarOpcionesMenu();
    decir(`Menú principal. Opciones con flechas. Opción: ${menuOpciones[menuIndice]}`);
}

function renderizarOpcionesMenu() {
    menuOpciones[5] = `Voz Nativa: ${usarTTSNativo ? 'ENCENDIDA' : 'APAGADA'}`;
    const container = document.getElementById("cats-container");
    container.innerHTML = menuOpciones.map((opc, idx) => `
        <div class="cat-btn ${idx === menuIndice ? 'active' : ''}">${opc}</div>
    `).join('');
}

function moverMenu(direccion) {
    sonidos.menu_move.play();
    if (direccion === "abajo") menuIndice = (menuIndice + 1) % menuOpciones.length;
    else menuIndice = (menuIndice - 1 + menuOpciones.length) % menuOpciones.length;
    renderizarOpcionesMenu();
    decir(menuOpciones[menuIndice]);
}

function seleccionarMenu() {
    sonidos.menu_select.play();

    if (menuIndice === 4) { // Abrir Tienda
        iniciarTienda();
        return;
    }
    if (menuIndice === 5) { // Alternar Voz
        usarTTSNativo = !usarTTSNativo;
        renderizarOpcionesMenu();
        decir(`Voz nativa ${usarTTSNativo ? 'activada' : 'desactivada'}. ${menuOpciones[menuIndice]}`);
        return;
    }
    if (menuIndice === 6) { // Salir
        ejecutarSalir();
        return;
    }

    // Iniciar Modo de Juego Seleccionado
    sonidos.menu_music.fade(0.4, 0, 500);
    setTimeout(() => sonidos.menu_music.stop(), 500);
    enMenuPrincipal = false;
    iniciarJuego(menuIndice + 1);
}

// ==========================================
// TIENDA DE PODERES
// ==========================================
function iniciarTienda() {
    enMenuPrincipal = false;
    enTienda = true;
    tiendaIndice = 0;
    renderizarTienda();
    decir(`Tienda de Objetos. Tienes ${juego.puntosTotales} puntos acumulados. Opción: ${tiendaOpciones[tiendaIndice].nombre}`);
}

function renderizarTienda() {
    const container = document.getElementById("cats-container");
    container.innerHTML = tiendaOpciones.map((opc, idx) => `
        <div class="cat-btn ${idx === tiendaIndice ? 'active' : ''}">
            ${opc.nombre} ${opc.costo > 0 ? `(${opc.costo} Pts)` : ''}
        </div>
    `).join('');
}

function moverTienda(dir) {
    sonidos.menu_move.play();
    if (dir === "abajo") tiendaIndice = (tiendaIndice + 1) % tiendaOpciones.length;
    else tiendaIndice = (tiendaIndice - 1 + tiendaOpciones.length) % tiendaOpciones.length;
    renderizarTienda();
    const item = tiendaOpciones[tiendaIndice];
    decir(`${item.nombre}. ${item.desc} ${item.costo > 0 ? `Cuesta ${item.costo} puntos.` : ''}`);
}

function comprarItem() {
    const item = tiendaOpciones[tiendaIndice];
    if (item.key === "volver") {
        iniciarMenu();
        return;
    }

    if (juego.puntosTotales >= item.costo) {
        juego.puntosTotales -= item.costo;
        juego.inventario[item.key]++;
        sonidos.powerup.play();
        actualizarInterfaz();
        decir(`¡Comprado! ${item.nombre}. Te quedan ${juego.puntosTotales} puntos.`);
    } else {
        sonidos.g_catsmirk.play();
        decir(`Puntos insuficientes. Necesitas ${item.costo} puntos y tienes ${juego.puntosTotales}.`);
    }
}

// ==========================================
// LÓGICA DEL JUEGO
// ==========================================
function iniciarJuego(modoElegido) {
    juego.modo = modoElegido;
    juego.rondaActual = 1;
    juego.maxRondas = 3;
    juego.puntosRonda = 0;
    juego.vidas = (modoElegido === 2) ? 3 : 0;
    juego.tiempoRestante = 45;
    juego.jugando = true;
    juego.bloqueoTeclado = false;
    juego.gatosEliminadosByLince = [];

    const nombresModos = ["Normal", "Supervivencia", "Contrarreloj", "Gato Saboteador"];
    decir(`Iniciando Modo ${nombresModos[modoElegido - 1]}.`);

    if (juego.modo === 3) { // Contrarreloj
        juego.timerInterval = setInterval(() => {
            if (juego.jugando) {
                juego.tiempoRestante--;
                actualizarInterfaz();
                if (juego.tiempoRestante <= 0) {
                    decir("¡Se agotó el tiempo!");
                    finalizarJuego();
                }
            }
        }, 1000);
    }

    setTimeout(iniciarRonda, 1500);
}

function iniciarRonda() {
    if (juego.rondaActual > juego.maxRondas) {
        finalizarJuego();
        return;
    }
    
    // Aplicar Sardina Dorada si estaba activa
    if (juego.sardinaActiva) {
        juego.puntosRonda *= 2;
        juego.sardinaActiva = false;
        decir("¡Efecto de Sardina Dorada! Puntos de ronda duplicados.");
    }

    juego.puntosTotales += juego.puntosRonda; 
    juego.puntosRonda = 0;
    juego.gatosEnPantalla = 2; 
    juego.gatosEliminadosByLince = [];
    juego.bloqueoTeclado = false;
    actualizarInterfaz();
    
    decir(`Ronda ${juego.rondaActual}.`);
    setTimeout(prepararTandaGatos, 1200);
}

function prepararTandaGatos() {
    juego.gatoCorrecto = Math.floor(Math.random() * juego.gatosEnPantalla) + 1;
    juego.bloqueoTeclado = false;
    actualizarInterfaz();
    
    renderizarGatosPantalla();

    // LÓGICA DE AUDIO ESPACIAL 3D Y TIPOS DE MAULLIDO
    reproducirAudioEspacialCompleto();

    // Modo Saboteador: El gato cambia cada 3 segundos
    if (juego.modo === 4) {
        if (juego.saboteadorInterval) clearInterval(juego.saboteadorInterval);
        juego.saboteadorInterval = setInterval(() => {
            if (juego.jugando && !juego.bloqueoTeclado) {
                let nuevoGato;
                do {
                    nuevoGato = Math.floor(Math.random() * juego.gatosEnPantalla) + 1;
                } while (nuevoGato === juego.gatoCorrecto && juego.gatosEnPantalla > 1);
                
                juego.gatoCorrecto = nuevoGato;
                sonidos.menu_move.play();
                reproducirAudioEspacialCompleto();
            }
        }, 3000);
    }

    decir(`Hay ${juego.gatosEnPantalla} gatos. Selecciona del 1 al ${juego.gatosEnPantalla}. Tienes atajos E, L, S para poderes.`);
}

function renderizarGatosPantalla() {
    const container = document.getElementById("cats-container");
    container.innerHTML = "";
    
    for (let i = 1; i <= juego.gatosEnPantalla; i++) {
        const div = document.createElement("div");
        const estaEliminado = juego.gatosEliminadosByLince.includes(i);
        div.className = `cat-btn ${estaEliminado ? 'disabled' : ''}`;
        div.innerText = estaEliminado ? `❌ Gato ${i} (Descartado)` : `🐱 Gato ${i}`;
        container.appendChild(div);
    }
}

function reproducirAudioEspacialCompleto() {
    // Hace emitir maullidos 3D a cada gato secuencialmente o al foco
    for (let i = 1; i <= juego.gatosEnPantalla; i++) {
        if (juego.gatosEliminadosByLince.includes(i)) continue;

        let panPos = -1 + ((i - 1) / Math.max(1, juego.gatosEnPantalla - 1)) * 2;
        let snd = sonidos.g_cats[(i - 1) % sonidos.g_cats.length];

        // EL RETO AUDIO 3D: El gato trampa/malo suena desafinado/distorsionado
        if (i !== juego.gatoCorrecto) {
            snd.rate(0.7); // Tono más grave/sospechoso
        } else {
            snd.rate(1.0); // Tono normal/limpio
        }

        snd.stereo(panPos);
        setTimeout(() => { if (juego.jugando) snd.play(); }, (i - 1) * 300);
    }
}

function procesarEntradaJugador(accion) {
    if (juego.bloqueoTeclado) return;

    // USO DE ATANJOS DE PODERES (E: Escudo, L: Lince, S: Sardina)
    if (accion.toUpperCase() === "E") { usarPoder("escudos"); return; }
    if (accion.toUpperCase() === "L") { usarPoder("lince"); return; }
    if (accion.toUpperCase() === "S") { usarPoder("sardinas"); return; }

    // ASEGURAR PUNTOS (ESCAPE)
    if (juego.jugando && accion === "Escape") {
        if (juego.puntosRonda === 0) return;
        juego.bloqueoTeclado = true;
        limpiarIntervalos();
        sonidos.g_save.play();
        
        juego.puntosTotales += juego.puntosRonda; 
        decir(`¡Puntos asegurados! Acumulado: ${juego.puntosTotales}. Redirigiendo a Tienda.`);
        juego.puntosRonda = 0;
        juego.rondaActual++;
        actualizarInterfaz();
        setTimeout(iniciarTienda, 2500);
        return;
    }

    let gatoElegido = parseInt(accion);
    if (isNaN(gatoElegido) || gatoElegido < 1 || gatoElegido > juego.gatosEnPantalla) return;
    if (juego.gatosEliminadosByLince.includes(gatoElegido)) {
        decir(`El Gato ${gatoElegido} ya fue descartado por el Ojo de Lince.`);
        return;
    }

    juego.bloqueoTeclado = true;
    limpiarIntervalos();
    const tempGatos = juego.gatosEnPantalla;

    let panElegido = -1 + ((gatoElegido - 1) / Math.max(1, tempGatos - 1)) * 2;
    sonidos.g_catreverb.stereo(panElegido);
    sonidos.g_catreverb.play();

    setTimeout(() => {
        if (gatoElegido === juego.gatoCorrecto) {
            // ACIERTO
            juego.gatosEnPantalla = tempGatos + 1;
            juego.puntosRonda += juego.gatosEnPantalla * 2;
            
            if (juego.modo === 3) juego.tiempoRestante += 3; // +3s en Contrarreloj

            const sndGood = sonidos.g_good[Math.floor(Math.random() * sonidos.g_good.length)];
            sndGood.stereo(panElegido);
            sndGood.play();

            decir(`¡Bien! Gato correcto. Puntos de ronda: ${juego.puntosRonda}.`);
            actualizarInterfaz();
            setTimeout(prepararTandaGatos, 2000);
        } else {
            // EXPLOSIÓN / ERROR
            if (juego.inventario.escudos > 0) {
                // CONSUME ESCUDO PROTECTOR
                juego.inventario.escudos--;
                sonidos.powerup.play();
                decir(`¡BOOM! Pero tu Escudo de Cascabel te salvó. No pierdes puntos.`);
                actualizarInterfaz();
                setTimeout(prepararTandaGatos, 2500);
                return;
            }

            if (juego.modo === 3) juego.tiempoRestante = Math.max(0, juego.tiempoRestante - 10); // -10s

            const sndBad = sonidos.g_bad[Math.floor(Math.random() * sonidos.g_bad.length)];
            sndBad.stereo(panElegido);
            sndBad.play();
            sonidos.g_catsmirk.play();

            if (juego.modo === 2 && juego.vidas > 1) { // Supervivencia con vidas restantes
                juego.vidas--;
                decir(`¡BOOM! Explotó. Te quedan ${juego.vidas} vidas.`);
                actualizarInterfaz();
                setTimeout(prepararTandaGatos, 2500);
            } else { // Pierde ronda o juego
                juego.puntosRonda = 0; 
                decir(`¡BOOM! Perdiste los puntos de esta ronda.`);
                juego.rondaActual++;
                actualizarInterfaz();
                setTimeout(iniciarRonda, 3000);
            }
        }
    }, 1000);
}

function usarPoder(tipo) {
    if (juego.inventario[tipo] <= 0) {
        decir(`No tienes ese objeto en tu inventario.`);
        return;
    }

    if (tipo === "lince") {
        // Revela y elimina un gato trampa
        let trampa;
        do {
            trampa = Math.floor(Math.random() * juego.gatosEnPantalla) + 1;
        } while (trampa === juego.gatoCorrecto || juego.gatosEliminadosByLince.includes(trampa));

        juego.inventario.lince--;
        juego.gatosEliminadosByLince.push(trampa);
        sonidos.powerup.play();
        renderizarGatosPantalla();
        decir(`🔍 Ojo de Lince usado. El Gato ${trampa} era una trampa y fue eliminado.`);
    } else if (tipo === "sardinas") {
        juego.inventario.sardinas--;
        juego.sardinaActiva = true;
        sonidos.powerup.play();
        decir(`🐟 Sardina Dorada activada. Duplicará los puntos al terminar la ronda.`);
    } else if (tipo === "escudos") {
        decir(`El Escudo de Cascabel está equipado y se activará automáticamente si explotas.`);
    }
    actualizarInterfaz();
}

function limpiarIntervalos() {
    if (juego.timerInterval) clearInterval(juego.timerInterval);
    if (juego.saboteadorInterval) clearInterval(juego.saboteadorInterval);
}

function finalizarJuego() {
    limpiarIntervalos();
    juego.jugando = false;
    juego.bloqueoTeclado = true;
    juego.puntosTotales += juego.puntosRonda; 
    actualizarInterfaz();

    let recordAnterior = localStorage.getItem("ruleta_felina_record") || 0;
    let mensajeFinal = `Fin de la partida. Puntuación final: ${juego.puntosTotales} puntos.`;

    if (juego.puntosTotales > recordAnterior) {
        localStorage.setItem("ruleta_felina_record", juego.puntosTotales);
        mensajeFinal += ` ¡NUEVO RÉCORD HISTÓRICO!`;
    } else {
        mensajeFinal += ` Tu récord actual es ${recordAnterior} puntos.`;
    }

    decir(mensajeFinal);
    setTimeout(iniciarMenu, 5000);
}

function ejecutarSalir() {
    sonidos.menu_select.play();
    detenerTodoElAudio();
    limpiarIntervalos();
    enMenuPrincipal = false;
    juego.jugando = false;
    
    document.getElementById("cats-container").innerHTML = "";
    actualizarInterfaz();
    decir("¡Gracias por jugar Ruleta Felina!");
    
    setTimeout(() => { 
        window.close(); 
        document.body.innerHTML = `
            <div style="background:#0d0d0d; color:#888; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
                <p style="font-size: 1.5rem;">Has salido de Ruleta Felina. Ya puedes cerrar esta pestaña.</p>
            </div>
        `;
    }, 1000);
}

// ==========================================
// INTERCEPTOR ÚNICO DE TECLADO
// ==========================================
window.addEventListener("keydown", (event) => {
    if (!sistemaVozElegido) {
        if (event.key === "1") configurarVozInicial(1);
        if (event.key === "2") configurarVozInicial(2);
        return; 
    }

    if (enMenuPrincipal) {
        if (event.key === "ArrowDown") { event.preventDefault(); moverMenu("abajo"); }
        if (event.key === "ArrowUp") { event.preventDefault(); moverMenu("arriba"); }
        if (event.key === "Enter") { event.preventDefault(); seleccionarMenu(); }
        if (event.key === "Escape") { event.preventDefault(); ejecutarSalir(); }
    } else if (enTienda) {
        if (event.key === "ArrowDown") { event.preventDefault(); moverTienda("abajo"); }
        if (event.key === "ArrowUp") { event.preventDefault(); moverTienda("arriba"); }
        if (event.key === "Enter") { event.preventDefault(); comprarItem(); }
        if (event.key === "Escape") { event.preventDefault(); iniciarMenu(); }
    } else {
        // En Partida
        if (event.key === "Escape" || !isNaN(event.key) || ["e","l","s","E","L","S"].includes(event.key)) {
            event.preventDefault();
            procesarEntradaJugador(event.key);
        }
    }
});

window.onload = () => {
    document.body.focus();
    mostrarPantallaInicio();
};