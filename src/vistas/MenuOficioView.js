import { uiDinamicaServicio } from '../servicios/uiDinamicaServicio.js';

/* Paleta de acento por oficio, alineada a la identidad Ocean Allure */
const PALETA_OFICIO = {
  'Electromecánico':    { acento: '#4FC3E8', suave: 'rgba(79,195,232,0.16)' },
  'Mecánico de Cocina': { acento: '#F5B960', suave: 'rgba(245,185,96,0.16)' },
  'Alberquero':         { acento: '#7FE0F5', suave: 'rgba(127,224,245,0.16)' },
  'Pintor':             { acento: '#E7DCC9', suave: 'rgba(231,220,201,0.16)' }
};

const paletaDe = (subArea) =>
  PALETA_OFICIO[subArea] || { acento: '#4FC3E8', suave: 'rgba(79,195,232,0.16)' };

export default {
  html: (trabajador) => {
    const ui = uiDinamicaServicio.obtenerMenuPorOficio(trabajador.subArea);
    const { acento, suave } = paletaDe(trabajador.subArea);

    const grillaHerramientas = ui.herramientas.map((h, i) => `
      <button onclick="alert('Abriendo: ${h.titulo}')"
        class="tarjeta-oficio panel-cristal rounded-2xl px-3 py-3.5 border border-white/8 text-left anim-entrar"
        style="animation-delay: ${0.34 + i * 0.05}s">
        <div class="flex items-start justify-between mb-3">
          <span class="text-[16px] leading-none opacity-90">${h.icono}</span>
          <span class="w-1 h-1 rounded-full mt-1.5" style="background:${acento}; box-shadow: 0 0 7px ${acento}90;"></span>
        </div>
        <h4 class="text-[10.5px] font-semibold text-white/90 leading-tight">${h.titulo}</h4>
        <p class="text-[9px] text-white/30 mt-1 font-light leading-snug">${h.desc}</p>
      </button>
    `).join('');

    const promptsHtml = ui.prompts.map(p => `
      <button onclick="window.consultarCopiloto('${p}')"
        class="shrink-0 text-[10px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors active:scale-95"
        style="background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.10); color: rgba(245,239,228,0.72);">
        ${p}
      </button>
    `).join('');


    return `
      <div class="flex-1 fondo-operaciones flex flex-col overflow-hidden text-white relative">

        <!-- CABECERA -->
        <header class="relative shrink-0 z-20 px-5 pt-11 pb-4 anim-entrar" style="animation-delay: 0.05s">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[17px]"
                   style="background: ${suave}; border: 1px solid ${acento}55;">
                ${ui.iconoGlobal}
              </div>
              <div class="min-w-0">
                <h1 class="text-[13px] font-semibold tracking-tight text-white leading-tight truncate">${trabajador.subArea}</h1>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="punto-activo"></span>
                  <span class="text-[8px] font-bold tracking-[0.2em] uppercase" style="color:${acento}">Turno activo</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <img src="assets/logo-ocean-mark-white.svg" alt="Ocean Allure" class="w-6 h-6 opacity-40" />
              <button onclick="window.cerrarSesion()" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);">
                <svg class="w-3.5 h-3.5 text-white/55" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
          <div class="divisor-ola mt-4"></div>

        <!-- CONTENIDO -->
        <div class="flex-1 overflow-y-auto px-5 pb-24 scrollbar-oculto">

          <!-- Acciones rápidas -->
          <div class="grid grid-cols-2 gap-2.5 mb-6 anim-entrar" style="animation-delay: 0.14s">
            <button onclick="alert('Abriendo Walkie-Talkie Digital: Canal ${trabajador.departamento}')"
              class="panel-cristal-suave rounded-xl py-3 px-3 flex items-center gap-2.5 active:scale-[0.97] transition-transform">
              <span class="text-[13px]">📻</span>
              <div class="text-left">
                <span class="block text-[10.5px] font-semibold text-white/90 leading-tight">Radio PTT</span>
                <span class="block text-[8px] uppercase tracking-[0.14em] text-white/30 mt-0.5">${trabajador.departamento}</span>
              </div>
            </button>

            <button onclick="window.abrirVistaTraductor()"
              class="rounded-xl py-3 px-3 flex items-center gap-2.5 active:scale-[0.97] transition-transform btn-primario">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.05 4.5A8.96 8.96 0 0112 12.5M4.5 8.5a7 7 0 007.5 6M13 21l4-9 4 9M15.5 17h3"/></svg>
              <div class="text-left">
                <span class="block text-[10.5px] font-semibold leading-tight">Intérprete</span>
                <span class="block text-[8px] uppercase tracking-[0.14em] text-white/60 mt-0.5">Voz en vivo</span>
              </div>
            </button>
          </div>

          <!-- Asistente operativo -->
          <div class="panel-cristal borde-agua rounded-2xl p-4 mb-6 anim-entrar" style="animation-delay: 0.22s">

            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5" style="color:${acento}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span class="text-[9px] font-bold uppercase tracking-[0.2em]" style="color:${acento}">Asistente operativo</span>
              </div>
              <span class="text-[7.5px] uppercase tracking-[0.16em] text-white/25">IA · v3.0</span>
            </div>

            <div id="pantalla-ia" class="panel-consola w-full h-[112px] rounded-xl p-3 overflow-y-auto text-[10px] leading-relaxed mb-3 scrollbar-oculto" style="color: rgba(127,224,245,0.82);">
              <div class="consola-linea">&gt; Sesión iniciada · ${trabajador.subArea}</div>
              <div class="consola-linea" style="animation-delay: 0.1s">&gt; Módulo de consulta técnica listo.</div>
            </div>

            <div class="flex gap-2 mb-3">
              <input id="input-pregunta" type="text" inputmode="text" placeholder="Escribe tu consulta técnica…"
                class="flex-1 rounded-lg px-3 py-2 text-[11px] text-white/90 placeholder-white/25 focus:outline-none transition-colors"
                style="background: rgba(2,9,15,0.6); border: 1px solid rgba(255,255,255,0.09);" />
              <button onclick="window.enviarPregunta()"
                class="btn-primario rounded-lg px-3.5 text-[11px] active:scale-95">Ir</button>
            </div>

            <div class="flex overflow-x-auto gap-2 pb-0.5 scrollbar-oculto">
              ${promptsHtml}
            </div>
          </div>

          <!-- Herramientas -->
          <div class="flex items-center justify-between mb-3.5 anim-entrar" style="animation-delay: 0.3s">
            <h3 class="etiqueta-seccion">Herramientas</h3>
            <span class="text-[8px] uppercase tracking-[0.16em] text-white/25">${ui.herramientas.length} módulos</span>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            ${grillaHerramientas}
          </div>

          <div class="divisor-ola mt-8 mb-4"></div>
          <p class="text-center text-[7.5px] uppercase tracking-[0.24em] text-white/20 pb-4">Ocean Allure · Costa Mujeres</p>

        </div>

        <!-- Sombra inferior -->
        <div class="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-[#02090F] via-[#02090F]/70 to-transparent pointer-events-none z-10"></div>
      </div>
    `;
  },

  iniciar: async (trabajador) => {

    const pantallaIa = document.getElementById('pantalla-ia');
    if (!pantallaIa) return;

    window.consultarCopiloto = (pregunta) => {
      pantallaIa.insertAdjacentHTML('beforeend',
        `<div class="consola-linea mt-1.5" style="color:#FBF9F5">&gt; ${pregunta}</div>`);
      pantallaIa.scrollTop = pantallaIa.scrollHeight;

      setTimeout(() => {
        pantallaIa.insertAdjacentHTML('beforeend',
          `<div class="consola-linea mt-1" style="color:#34D399">&#10003; Parámetro verificado. Protocolo seguro para ${trabajador.subArea}. Regístrelo al terminar.</div>`);
        pantallaIa.scrollTop = pantallaIa.scrollHeight;
      }, 600);
    };

    window.enviarPregunta = () => {
      const input = document.getElementById('input-pregunta');
      if (input && input.value.trim()) {
        window.consultarCopiloto(input.value.trim());
        input.value = '';
      }
    };
  }
};
