"use strict";

/**
 * @fileoverview Motor de Asistente de Voz Bidireccional - Arquitectura Corporativa
 * @version 3.0.0 (Enterprise Edition)
 * 
 * @typedef {Object} Hablante
 * @property {string} [icono_persona]
 * @property {string} [bandera]
 * @property {string} [nombre_idioma]
 * @property {string} [frase_original]
 * @property {string} [texto_original]
 * @property {string} [frase_traducida]
 * @property {string} [texto_traducida]
 * @property {string} [iso]
 * 
 * @typedef {Object} APIRespuesta
 * @property {string} etiqueta
 * @property {Hablante[]} hablantes
 * @property {string} texto_traducido
 * @property {string} iso_destino
 * @property {string} [nombre_destino]
 * @property {string} [audio_voz]
 * @property {boolean} [debug_error]
 * 
 * @typedef {Object} EstadoApp
 * @property {string|null} grabandoRol
 * @property {boolean} bloqueoTransicion
 * @property {boolean} canceladoManualmente
 * @property {number} tiempoInicio
 * @property {string|null} idEscribiendo
 * @property {string|null} idPastillaReintento
 * @property {string|null} etiquetaUltimaValida
 * @property {number} contadorTurnos
 * @property {Set<string>} etiquetasProcesadas
 * @property {Object|null} ultimoAudioFallido
 * @property {Object} memoriaIdiomas
 */

/* ==========================================================================
   MODULO 0.1: TELEMETRÍA Y OBSERVABILIDAD (CAJA NEGRA)
   ========================================================================== */
const moduloTelemetria = {
  logError: (contexto, error) => {
    const reporte = {
      timestamp: new Date().toISOString(),
      nivel: 'CRITICAL',
      contexto: contexto,
      mensaje: error.message || error,
      navegador: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido'
    };
    console.error("[TELEMETRÍA CORPORATIVA] Error capturado:", reporte);
  },
  logEvento: (evento, metricas = {}) => {
    console.info(`[TELEMETRÍA CORPORATIVA] Evento: ${evento}`, metricas);
  }
};

/* ==========================================================================
   MODULO 0.2: UTILIDADES BÁSICAS Y SEGURIDAD (ANTI-XSS & UX)
   ========================================================================== */
const moduloUtilidades = {
  escaparHTML: (texto) => {
    if (!texto) return "";
    return texto.toString().replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  },

  mostrarNotificacionUX: (mensaje) => {
    try {
      const toast = document.createElement('div');
      toast.className = 'fixed top-12 left-1/2 transform -translate-x-1/2 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md z-[100] text-[12px] font-semibold tracking-wide flex items-center gap-2 border';
      toast.style.background = 'rgba(239, 68, 68, 0.94)';
      toast.style.borderColor = 'rgba(252, 165, 165, 0.5)';
      toast.style.animation = 'animacion-pop-derecha 0.3s ease-out';
      toast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <span>${moduloUtilidades.escaparHTML(mensaje)}</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px) scale(0.9)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4500);
    } catch (e) {
      moduloTelemetria.logError('mostrarNotificacionUX', e);
    }
  }
};

/* ==========================================================================
   MODULO 1: ESTILOS Y ANIMACIONES CSS DE ALTO RENDIMIENTO POR GPU
   ========================================================================== */
const moduloAnimacionesYEstilos = {
  obtenerCss: () => `
    <style>
      :root {
        --sat: env(safe-area-inset-top, 0px);
        --sab: env(safe-area-inset-bottom, 0px);
        --sal: env(safe-area-inset-left, 0px);
        --sar: env(safe-area-inset-right, 0px);
        --header-h: calc(var(--sat) + 94px);
        --footer-h: calc(var(--sab) + 116px);
        --agua: #0184B8;
        --agua-clara: #4FC3E8;
        --profundo: #054F7C;
        --arena: #F5EFE4;
        --vidrio-borde: 1px solid rgba(255, 255, 255, 0.12);
        --vidrio-luz: inset 0 1px 0 rgba(255, 255, 255, 0.16);
        --font-display: 'Cormorant Garamond', 'Playfair Display', Didot, serif;
        --font-ui: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .app-viewport-total {
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        max-height: -webkit-fill-available;
        overflow: hidden;
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        padding-left: var(--sal);
        padding-right: var(--sar);
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        contain: strict;
        font-family: var(--font-ui);
        background:
          radial-gradient(ellipse 130% 60% at 50% -12%, rgba(1, 132, 184, 0.30) 0%, transparent 62%),
          radial-gradient(ellipse 100% 55% at 105% 105%, rgba(5, 79, 124, 0.42) 0%, transparent 60%),
          linear-gradient(176deg, #061E2C 0%, #030F18 58%, #02090F 100%);
      }

      /* Rejilla náutica de fondo */
      .app-viewport-total::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        opacity: 0.32;
        background-image:
          linear-gradient(rgba(79, 195, 232, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(79, 195, 232, 0.06) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, #000 15%, transparent 82%);
        -webkit-mask-image: radial-gradient(ellipse 85% 55% at 50% 0%, #000 15%, transparent 82%);
      }

      #chat-container {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        padding-top: calc(var(--header-h) + 14px);
        padding-bottom: calc(var(--footer-h) + 18px);
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        z-index: 10;
      }


      @keyframes animacion-pop-izquierda { 0% { opacity: 0; transform: translate3d(-24px, 0, 0) scale(0.96); } 100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
      @keyframes animacion-pop-derecha { 0% { opacity: 0; transform: translate3d(24px, 0, 0) scale(0.96); } 100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
      @keyframes animacion-orbe-flotante { 0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); } 50% { transform: translate3d(16px, -16px, 0) scale(1.05) rotate(6deg); } 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); } }
      @keyframes rebote-puntos-escritura { 0%, 80%, 100% { transform: translate3d(0, 0, 0); } 40% { transform: translate3d(0, -6px, 0); } }

      .punto-escritura { animation: rebote-puntos-escritura 1.2s infinite ease-in-out both; will-change: transform; backface-visibility: hidden; }
      .orbe-ambiente { position: absolute; border-radius: 50%; pointer-events: none; will-change: transform; backface-visibility: hidden; }

      .burbuja-personal {
        background: linear-gradient(150deg, rgba(1, 132, 184, 0.52) 0%, rgba(5, 79, 124, 0.68) 100%);
        backdrop-filter: blur(10px) saturate(130%); -webkit-backdrop-filter: blur(10px) saturate(130%);
        border: 1px solid rgba(79, 195, 232, 0.28);
        box-shadow: var(--vidrio-luz), 0 10px 26px -14px rgba(1, 132, 184, 0.55);
        border-bottom-left-radius: 8px !important; animation: animacion-pop-izquierda 0.3s cubic-bezier(0, 0, 0.2, 1) forwards;
        will-change: auto; backface-visibility: visible; transform: none;
      }

      .burbuja-huesped {
        background: linear-gradient(150deg, rgba(245, 239, 228, 0.16) 0%, rgba(205, 191, 166, 0.10) 100%);
        backdrop-filter: blur(10px) saturate(130%); -webkit-backdrop-filter: blur(10px) saturate(130%);
        border: 1px solid rgba(231, 220, 201, 0.26);
        box-shadow: var(--vidrio-luz), 0 10px 26px -14px rgba(0, 0, 0, 0.6);
        border-bottom-right-radius: 8px !important; animation: animacion-pop-derecha 0.3s cubic-bezier(0, 0, 0.2, 1) forwards;
        will-change: auto; backface-visibility: visible; transform: none;
      }

      .encabezado-cristal {
        position: absolute; top: 0; left: 0; right: 0; height: var(--header-h);
        background: linear-gradient(180deg, rgba(6, 30, 44, 0.86) 0%, rgba(4, 20, 31, 0.62) 100%);
        backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%);
        border-bottom: 1px solid rgba(79, 195, 232, 0.16);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
        padding-top: var(--sat); display: flex; flex-direction: column; align-items: center; justify-content: center;
        transform: translateZ(0); z-index: 30;
      }

      .encabezado-cristal::after {
        content: '';
        position: absolute;
        bottom: -1px; left: 18%; right: 18%; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(79, 195, 232, 0.7), transparent);
      }

      .pie-pagina-cristal {
        position: absolute; bottom: 0; left: 0; right: 0; height: var(--footer-h);
        background: linear-gradient(0deg, rgba(3, 14, 23, 0.94) 0%, rgba(6, 28, 41, 0.74) 100%);
        backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%);
        border-top: 1px solid rgba(79, 195, 232, 0.16);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 -8px 28px rgba(0, 0, 0, 0.5);
        padding-bottom: var(--sab); display: flex; align-items: center; justify-content: center; transform: translateZ(0);
        transition: transform 0.25s cubic-bezier(0, 0, 0.2, 1); z-index: 30;
      }

      .pastilla-vidrio-luz {
        background: rgba(255, 255, 255, 0.07); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
        border: 1px solid rgba(79, 195, 232, 0.22); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 6px 18px rgba(0, 0, 0, 0.28);
      }

      .boton-ios-vidrio {
        backdrop-filter: blur(12px) saturate(140%); -webkit-backdrop-filter: blur(12px) saturate(140%);
        border: 1px solid rgba(255, 255, 255, 0.32); box-shadow: inset 0 1.5px 2px rgba(255, 255, 255, 0.45), inset 0 -2px 6px rgba(0, 0, 0, 0.25), 0 8px 22px rgba(0, 0, 0, 0.4);
      }

      .onda-medusa-base {
        position: absolute; inset: -14px; border-radius: 42% 58% 62% 38% / 45% 40% 60% 55%;
        opacity: 0; pointer-events: none; will-change: transform, opacity; transform: scale(0); transition: opacity 0.2s ease-out;
      }

      #wave-staff { background: radial-gradient(circle, rgba(79, 195, 232, 0.62) 0%, rgba(1, 132, 184, 0.26) 58%, transparent 80%); }
      #wave-guest { background: radial-gradient(circle, rgba(231, 220, 201, 0.55) 0%, rgba(205, 191, 166, 0.24) 58%, transparent 80%); }


      .pastilla-cancelar {
        width: 0px; opacity: 0; pointer-events: none; transition: width 0.3s cubic-bezier(0, 0, 0.2, 1), opacity 0.25s ease;
        white-space: nowrap; overflow: hidden; position: absolute; top: 50%; transform: translateY(-50%);
      }
      
      #btn-cancelar-staff.activo { width: clamp(105px, 28vw, 130px); opacity: 1; pointer-events: auto; transform: translateY(-50%) translateX(12px); }
      #btn-cancelar-guest.activo { width: clamp(105px, 28vw, 130px); opacity: 1; pointer-events: auto; transform: translateY(-50%) translateX(-12px); }

      .contenedor-lateral { transition: opacity 0.25s cubic-bezier(0, 0, 0.2, 1), transform 0.25s cubic-bezier(0, 0, 0.2, 1); }
      .lateral-oculto { opacity: 0; transform: scale(0.85); pointer-events: none; }

      @keyframes pop-icono-rostro { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      .animacion-rostro-pop { animation: pop-icono-rostro 0.35s cubic-bezier(0, 0, 0.2, 1) forwards; display: inline-flex; will-change: auto; }

      #banner-red-flotante {
        position: absolute; left: 50%; bottom: calc(var(--sab) + 112px); transform: translate3d(-50%, 14px, 0) scale(0.94);
        opacity: 0; pointer-events: none; transition: transform 0.3s cubic-bezier(0, 0, 0.2, 1), opacity 0.25s ease; z-index: 40;
      }
      #banner-red-flotante.visible { transform: translate3d(-50%, 0, 0) scale(1); opacity: 1; }

      @keyframes pulso-punto-rojo { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
      .punto-pulso-red { animation: pulso-punto-rojo 1.4s infinite ease-in-out; }

      /* ----------------------------------------------------------------
         Marca editorial
         ---------------------------------------------------------------- */
      .marca-titulo {
        font-family: var(--font-display);
        font-weight: 400;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        line-height: 1;
        color: #FBF9F5;
      }

      .marca-sub {
        font-family: var(--font-ui);
        font-size: 7.5px;
        font-weight: 600;
        letter-spacing: 0.34em;
        text-transform: uppercase;
        color: rgba(79, 195, 232, 0.95);
      }

      /* Firma del autor: serif editorial con presencia */
      .credito-autor {
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 700;
        font-style: normal;
        letter-spacing: 0.05em;
        text-transform: none;
        color: #FBF9F5;
        text-shadow: 0 1px 7px rgba(0, 0, 0, 0.55);
        white-space: nowrap;
        line-height: 1;
      }

      /* Líneas ornamentales a ambos lados de la firma */
      .linea-firma {
        height: 1px; width: 22px; flex: 0 0 auto;
        background: linear-gradient(90deg, transparent, rgba(79, 195, 232, 0.85));
        box-shadow: 0 0 5px rgba(79, 195, 232, 0.45);
      }
      .linea-firma:last-child { transform: scaleX(-1); }

      .indicador-turno {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 7.5px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
        color: rgba(251, 249, 245, 0.7);
      }

      .indicador-turno .punto {
        width: 5px; height: 5px; border-radius: 50%; background: #10B981;
        animation: latido-turno 2.6s ease-out infinite;
      }

      @keyframes latido-turno {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
        70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      .etiqueta-idioma {
        font-size: 8px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
      }

      .item-mensaje { contain: content; }
      ::-webkit-scrollbar { width: 0px; height: 0px; background: transparent; }
    </style>
  `
};


/* ==========================================================================
   MODULO 1.5: OPTIMIZACIÓN DE MEMORIA HEAP (BASE64 A PUNTERO BLOB)
   ========================================================================== */
const moduloOptimizacionMemoria = {
  base64ABlobUrl: (base64, mimeType = 'audio/mp3') => {
    if (!base64) return '';
    try {
      const inicioProc = performance.now();
      const binario = atob(base64);
      const longitud = binario.length;
      const buffer = new Uint8Array(longitud);
      for (let i = 0; i < longitud; i++) buffer[i] = binario.charCodeAt(i);
      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      moduloTelemetria.logEvento('Base64_Decodificado', { ms: performance.now() - inicioProc, size: longitud });
      return url;
    } catch (e) {
      moduloTelemetria.logError('base64ABlobUrl', e);
      return '';
    }
  }
};

/* ==========================================================================
   MODULO 2: PLANTILLAS VISUALES DE INTERFAZ HTML
   ========================================================================== */
const moduloPlantillasInterfaz = {
  generarEstructuraPrincipal: () => `
    ${moduloAnimacionesYEstilos.obtenerCss()}
    <div class="app-viewport-total text-white select-none relative">
      <div class="orbe-ambiente -top-24 -left-20 w-[75vw] h-[75vw] max-w-[460px] max-h-[460px] bg-[#0184B8]/22 blur-[52px]" style="animation: animacion-orbe-flotante 15s infinite alternate ease-in-out;"></div>
      <div class="orbe-ambiente -bottom-24 -right-20 w-[75vw] h-[75vw] max-w-[440px] max-h-[440px] bg-[#054F7C]/40 blur-[52px]" style="animation: animacion-orbe-flotante 19s infinite alternate-reverse ease-in-out;"></div>
      <div class="orbe-ambiente top-1/2 left-1/3 w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#4FC3E8]/10 blur-[60px] pointer-events-none"></div>

      <!-- CABECERA: identidad Ocean Allure -->
      <header class="encabezado-cristal shrink-0 z-30 w-full px-5">
        <div class="flex flex-col items-center justify-center w-full relative">

          <!-- Bloque de marca centrado: logo completo + Intérprete -->
          <div class="flex items-center justify-center gap-3 w-full">
            <img src="assets/logo-ocean-mark-white.svg" alt="Ocean Allure Costa Mujeres" class="w-[52px] h-[52px] shrink-0 drop-shadow-lg" />
            <div class="flex flex-col items-center">
              <h1 class="marca-titulo text-[17px] leading-none tracking-[0.18em] uppercase text-center pl-[0.18em]">Ocean Allure</h1>
              <span class="marca-sub mt-[5px] text-[7.5px] tracking-[0.34em] text-center pl-[0.34em]">Costa Mujeres</span>
              <div class="flex items-center gap-2 mt-[7px] pl-[0.3em]">
                <span class="h-[1px] w-4 bg-[#4FC3E8]/45"></span>
                <span class="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#4FC3E8] drop-shadow-sm">Intérprete</span>
                <span class="h-[1px] w-4 bg-[#4FC3E8]/45"></span>
              </div>
            </div>
          </div>

          <!-- Firma del autor, centrada bajo Intérprete -->
          <div class="flex items-center justify-center gap-2 w-full mt-[6px]">
            <span class="linea-firma"></span>
            <span class="credito-autor">By Ricardo Nájera</span>
            <span class="linea-firma"></span>
          </div>

        </div>
      </header>


      <div id="chat-container" class="px-2 sm:px-4 flex flex-col select-none">
        <!-- Tarjeta de bienvenida editorial -->
        <div class="w-full flex flex-col items-center mb-5 shrink-0 px-2">
          <div class="pastilla-vidrio-luz px-4 py-1.5 rounded-full text-[8.5px] font-bold tracking-[0.26em] uppercase text-white/85 mb-3">
            Conversación en vivo
          </div>
          <p class="text-[10px] text-center leading-relaxed text-white/40 font-light max-w-[280px]">
            Presiona tu micrófono y habla con naturalidad.<br />La traducción aparece al instante.
          </p>
        </div>
        <div id="mensajes-wrapper" class="flex flex-col w-full"></div>
        <div id="scroll-anchor" class="w-full h-4 shrink-0 pointer-events-none"></div>
      </div>

      <div id="banner-red-flotante" class="pointer-events-none">
        <div id="banner-red-contenido" class="px-4 py-2 rounded-full pastilla-vidrio-luz flex items-center gap-2 border text-[11px] font-semibold tracking-wide transition-all">
          <span id="banner-red-indicador" class="w-2.5 h-2.5 rounded-full"></span>
          <span id="banner-red-texto">Comprobando conexión...</span>
        </div>
      </div>


      <div id="footer-container" class="pie-pagina-cristal shrink-0 z-30 w-full">
        <div class="flex w-full max-w-2xl justify-between items-center px-3 sm:px-6 relative">
          
          <div id="wrapper-staff" class="contenedor-lateral flex flex-row items-center gap-3 relative p-1.5">
            <div class="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] max-w-[110px]">
              <div id="iconos-staff" class="flex flex-wrap items-center justify-center gap-1 text-[15px] drop-shadow-sm leading-none mb-1"></div>
              <p id="lang-staff" class="text-[9px] font-semibold text-[#4FC3E8] drop-shadow-sm transition-colors text-center truncate max-w-[72px]"></p>
            </div>
            <div id="container-mic-staff" class="relative flex flex-col items-center justify-center rounded-full">
              <div class="relative flex items-center justify-center rounded-full p-1">
                <div id="wave-staff" class="onda-medusa-base"></div>
              <button id="btn-grabar-staff" class="boton-ios-vidrio w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-full bg-gradient-to-br from-[#0184B8] to-[#054F7C] flex items-center justify-center active:scale-95 transition-transform duration-150 relative z-20">
                <svg class="w-7 h-7 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"/><path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.91V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.09A6 6 0 0 0 18 11z"/></svg>
              </button>
              <button id="btn-cancelar-staff" class="pastilla-cancelar left-[calc(100%-4px)] h-[44px] rounded-full bg-red-500/25 border border-red-400/40 text-red-200 flex items-center justify-start backdrop-blur-md z-10 active:bg-red-500/35 shadow-md">
                <svg class="w-5 h-5 shrink-0 ml-3 mr-1.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                <span class="text-[12px] sm:text-[13px] font-bold tracking-wide mr-3">Cancelar</span>
              </button>
              </div>
              <span class="text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/55 mt-1">Equipo</span>
            </div>
          </div>

          <div id="divisor" class="w-[1px] h-9 bg-white/12 rounded-full transition-opacity duration-200 mx-3 shrink-0"></div>

          <div id="wrapper-guest" class="contenedor-lateral flex flex-row-reverse items-center gap-3 relative p-1.5">
            <div class="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] max-w-[110px]">
              <div id="iconos-guest" class="flex flex-wrap items-center justify-center gap-1 text-[15px] drop-shadow-sm leading-none mb-1"></div>
              <p id="lang-guest" class="text-[9px] font-semibold text-[#E7DCC9] drop-shadow-sm transition-colors text-center truncate max-w-[72px]"></p>
            </div>
            <div id="container-mic-guest" class="relative flex flex-col items-center justify-center rounded-full">
              <div class="relative flex items-center justify-center rounded-full p-1">
              <button id="btn-cancelar-guest" class="pastilla-cancelar right-[calc(100%-4px)] h-[44px] rounded-full bg-red-500/25 border border-red-400/40 text-red-200 flex items-center justify-end backdrop-blur-md z-10 active:bg-red-500/35 shadow-md">
                <span class="text-[12px] sm:text-[13px] font-bold tracking-wide ml-3">Cancelar</span>
                <svg class="w-5 h-5 shrink-0 mr-3 ml-1.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>

              </button>
              <div id="wave-guest" class="onda-medusa-base"></div>
              <button id="btn-grabar-guest" class="boton-ios-vidrio w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-full bg-gradient-to-br from-[#CDBFA6] to-[#8C7A5E] flex items-center justify-center active:scale-95 transition-transform duration-150 relative z-20">
                <svg class="w-7 h-7 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"/><path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.91V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.09A6 6 0 0 0 18 11z"/></svg>
              </button>
              </div>
              <span class="text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/55 mt-1">Huésped</span>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  `,


  generarBurbujaHtml: (hablantes, rol, textoTraducidoCompleto, isoDestino, iconoPersona, audioUrl) => {
    if (!hablantes || hablantes.length === 0) return "";
    
    const esStaff = rol === "staff";
    const margenContrario = esStaff ? "mr-8 sm:mr-20" : "ml-8 sm:ml-20";
    const alineacion = esStaff ? "justify-start text-left" : "justify-end text-left";
    const claseBurbuja = esStaff ? "burbuja-personal" : "burbuja-huesped";
    
    return hablantes.map((h) => {
      const emojiBandera = moduloUtilidades.escaparHTML(`${h.icono_persona || ''}${h.bandera || ''}`);
      const nombreIdioma = moduloUtilidades.escaparHTML(h.nombre_idioma || 'Idioma detectado');
      const textoPronunciar = moduloUtilidades.escaparHTML(
        h.frase_traducida || h.texto_traducida || (hablantes.length === 1 ? textoTraducidoCompleto : '') || ""
      );
      const isoPronunciar = moduloUtilidades.escaparHTML(h.iso || isoDestino || 'en');
      const iconoFinal = moduloUtilidades.escaparHTML(h.icono_persona || iconoPersona || '🗣️️');
      const fraseOriginal = moduloUtilidades.escaparHTML(h.frase_original || h.texto_original || "...");
      const fraseTraducida = moduloUtilidades.escaparHTML(h.frase_traducida || h.texto_traducida || "...");
      const audioAttr = moduloUtilidades.escaparHTML(
        h.audio_voz || h.audio_url || h.audio || (hablantes.length === 1 ? (audioUrl || '') : '')
      );

      const tagIdioma = emojiBandera ? `
        <div class="flex items-center gap-1.5 mb-2 opacity-95">
          <span class="text-[11px] bg-black/30 px-2 py-0.5 rounded-full border border-white/15 backdrop-blur-sm shadow-inner">${emojiBandera}</span>
          <span class="etiqueta-idioma text-white/75 drop-shadow-sm">${nombreIdioma}</span>
        </div>` : '';

      return `
      <div class="item-mensaje flex ${alineacion} w-full my-2.5 shrink-0">
        <div class="w-auto ${margenContrario} rounded-[24px] px-4 sm:px-5 py-3.5 ${claseBurbuja} relative group">
          ${tagIdioma}
          <p class="text-[12.5px] sm:text-[13px] font-light leading-relaxed text-white/65 break-words whitespace-pre-wrap">${fraseOriginal}</p>
          <div class="h-[1px] w-full bg-white/12 my-2.5 rounded-full"></div>
          <div class="flex items-end justify-between gap-3">
            <p class="text-[16px] sm:text-[17px] font-semibold leading-snug text-white break-words whitespace-pre-wrap tracking-tight flex-1 drop-shadow-sm">${fraseTraducida}</p>
            <button type="button" class="btn-repetir-voz p-2 -mr-1 -mb-1 rounded-full bg-white/12 hover:bg-white/22 active:scale-90 transition-transform text-white border border-white/18 backdrop-blur-sm shadow-sm shrink-0" data-texto="${textoPronunciar}" data-iso="${isoPronunciar}" data-icono="${iconoFinal}" data-audio="${audioAttr}" title="Escuchar de nuevo">
              <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
          </div>
        </div>
      </div>`;

    }).join('');
  },

  generarHtmlEscribiendo: (rol, idUnico) => {
    const esStaff = rol === "staff";
    const margenContrario = esStaff ? "mr-8 sm:mr-20" : "ml-8 sm:ml-20";
    const claseBurbuja = esStaff ? "burbuja-personal" : "burbuja-huesped";
    return `
      <div id="${moduloUtilidades.escaparHTML(idUnico)}" class="item-mensaje flex ${esStaff ? 'justify-start' : 'justify-end'} w-full my-2.5 shrink-0">
        <div class="w-auto ${margenContrario} rounded-[22px] px-5 py-3.5 ${claseBurbuja} flex items-center gap-1.5 h-[48px]">
          <div class="w-2.5 h-2.5 bg-white/90 rounded-full punto-escritura" style="animation-delay: 0s"></div>
          <div class="w-2.5 h-2.5 bg-white/90 rounded-full punto-escritura" style="animation-delay: 0.15s"></div>
          <div class="w-2.5 h-2.5 bg-white/90 rounded-full punto-escritura" style="animation-delay: 0.3s"></div>
        </div>
      </div>`;
  },

  generarMensajeSistemaHtml: (mensaje, esError = false) => {
    const colorClase = esError ? "bg-red-500/25 text-red-200 border-red-400/40" : "bg-white/10 text-white/80 border-white/20";
    return `
      <div class="item-mensaje flex w-full justify-center my-1.5 shrink-0">
        <div class="${colorClase} backdrop-blur-md border px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide shadow-md">
          ${moduloUtilidades.escaparHTML(mensaje)}
        </div>
      </div>`;
  },

  generarPastillaReintentarHtml: (idPastilla) => `
    <div id="${moduloUtilidades.escaparHTML(idPastilla)}" class="item-mensaje flex w-full justify-center my-1.5 shrink-0">
      <div class="bg-amber-500/25 text-amber-200 border border-amber-400/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide shadow-md flex items-center gap-2">
        <span>Conexión lenta sin respuesta</span>
        <button type="button" class="btn-ejecutar-reintento underline font-bold hover:text-white transition-colors cursor-pointer">Reintentar</button>
      </div>
    </div>
  `
};

/* ==========================================================================
   MODULO 3: MOTOR MATEMÁTICO DE ONDA MEDUSA (LUT INTEGRADA)
   ========================================================================== */
const moduloAnimacionMedusa = {
  idAnimacion: null,
  escalaActual: 0.2, escalaBoton: 1.0, faseRespiracion: 0, ultimoTiempo: 0, volumenSuavizado: 0,
  LUT_TAMANO: 512, LUT_MASCARA: 511, tablaSeno: new Float32Array(512), lutInicializada: false,

  inicializarLut: function() {
    if (this.lutInicializada) return;
    const factor = (2 * Math.PI) / this.LUT_TAMANO;
    for (let i = 0; i < this.LUT_TAMANO; i++) this.tablaSeno[i] = Math.sin(i * factor);
    this.lutInicializada = true;
  },

  obtenerSenoRapido: function(rad) {
    const indice = ((rad * 81.487330863) | 0) & this.LUT_MASCARA;
    return this.tablaSeno[indice];
  },

  iniciarMedusa: function(analizador, matrizFrecuencia, elementoOnda, botonActivo) {
    if (!elementoOnda) return;
    this.inicializarLut();
    this.escalaActual = 0.2; this.escalaBoton = 1.0; this.faseRespiracion = 0; this.volumenSuavizado = 0; this.ultimoTiempo = performance.now();
    elementoOnda.style.opacity = "0.4"; elementoOnda.style.transform = "scale3d(0.2, 0.2, 1)";

    const animarMedusa = (tiempoActual) => {
      this.idAnimacion = requestAnimationFrame(animarMedusa);
      const tiempoDeltaMs = tiempoActual - this.ultimoTiempo;
      this.ultimoTiempo = tiempoActual;
      const delta = (tiempoDeltaMs > 0 && tiempoDeltaMs < 100) ? tiempoDeltaMs * 0.06 : 1.0;

      let promedioVoz = 0;
      if (analizador && matrizFrecuencia) {
        analizador.getByteFrequencyData(matrizFrecuencia);
        let suma = 0;
        for (let i = 1; i < 24; i++) suma += matrizFrecuencia[i];
        promedioVoz = suma / 24;
      }

      const tasaRespuesta = promedioVoz > this.volumenSuavizado ? 0.75 : 0.25;
      this.volumenSuavizado += (promedioVoz - this.volumenSuavizado) * tasaRespuesta;
      this.faseRespiracion += (0.045 + (this.volumenSuavizado * 0.0018)) * delta;
      
      const senFase = this.obtenerSenoRapido(this.faseRespiracion);
      const cosFase = this.obtenerSenoRapido(this.faseRespiracion + 1.5708);

      let escalaObjetivo = 0.35 + (senFase * 0.05) + (this.volumenSuavizado * 0.012);
      escalaObjetivo = Math.min(1.85, Math.max(0.2, escalaObjetivo));
      const factorAmortiguacion = 1 - Math.exp(-0.35 * delta);
      this.escalaActual += (escalaObjetivo - this.escalaActual) * factorAmortiguacion;

      elementoOnda.style.opacity = Math.min(0.95, Math.max(0.3, 0.3 + (this.volumenSuavizado * 0.035))).toFixed(2);
      elementoOnda.style.transform = `scale3d(${(this.escalaActual * (1.0 + senFase * 0.045)).toFixed(3)}, ${(this.escalaActual * (1.0 - cosFase * 0.045)).toFixed(3)}, 1) rotate(${(this.faseRespiracion * 9.5).toFixed(1)}deg)`;

      if (botonActivo) {
        this.escalaBoton += ((1.0 - (Math.max(0, this.escalaActual - 0.5)) * 0.04) - this.escalaBoton) * factorAmortiguacion;
        botonActivo.style.transform = `scale3d(${this.escalaBoton.toFixed(3)}, ${this.escalaBoton.toFixed(3)}, 1)`;
      }
    };
    this.idAnimacion = requestAnimationFrame(animarMedusa);
  },

  detenerMedusa: function(elementoOnda, botonActivo) {
    if (this.idAnimacion) { cancelAnimationFrame(this.idAnimacion); this.idAnimacion = null; }
    if (elementoOnda) { elementoOnda.style.opacity = "0"; elementoOnda.style.transform = "scale3d(0, 0, 1)"; }
    if (botonActivo) { botonActivo.style.transform = "scale3d(1, 1, 1)"; }
    this.escalaActual = 0.2; this.escalaBoton = 1.0; this.faseRespiracion = 0; this.volumenSuavizado = 0;
  }
};

/* ==========================================================================
   MODULO 4: SÍNTESIS Y REPRODUCCIÓN DE VOZ
   ========================================================================== */
const moduloSintesisVoz = {
  vocesDisponibles: [], motorIniciado: false, reproductorAudioActivo: null,

  cargarVoces: function() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.vocesDisponibles = window.speechSynthesis.getVoices();
    }
  },

  iniciarMotorSilencioso: function() {
    if (!this.motorIniciado && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const locucionSilenciosa = new SpeechSynthesisUtterance('');
        locucionSilenciosa.volume = 0;
        window.speechSynthesis.speak(locucionSilenciosa);
        this.motorIniciado = true;
      } catch (e) { moduloTelemetria.logError('iniciarMotorSilencioso', e); }
    }
  },

  detenerCualquierAudio: function() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this.reproductorAudioActivo) {
      this.reproductorAudioActivo.pause();
      this.reproductorAudioActivo.currentTime = 0;
      this.reproductorAudioActivo = null;
    }
  },

  reproducirTextoVozNativa: function(texto, codigoIso, iconoDominante) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !texto) return;
    this.detenerCualquierAudio();
    try {
      const locucion = new SpeechSynthesisUtterance(texto);
      const mapaIdiomas = { 'es': 'es-MX', 'en': 'en-US', 'zh': 'zh-CN', 'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT', 'pt': 'pt-BR', 'ja': 'ja-JP', 'ru': 'ru-RU', 'ko': 'ko-KR' };
      locucion.lang = mapaIdiomas[(codigoIso || 'en').toLowerCase()] || codigoIso;
      locucion.rate = 1.05;

      if (this.vocesDisponibles.length === 0) this.cargarVoces();
      const prefijo = (codigoIso || 'en').toLowerCase();
      const vocesIdioma = this.vocesDisponibles.filter(v => v.lang.toLowerCase().startsWith(prefijo));
      
      if (vocesIdioma.length > 0) {
        const esHombre = ['👨', '👦', '👨🏽‍‍💼'].includes(iconoDominante);
        let vozElegida = vocesIdioma.find(v => (esHombre ? /(male|hombre|alvaro|jorge|carlos)/i : /(female|mujer|monica|paulina|helena)/i).test(v.name));
        locucion.voice = vozElegida || vocesIdioma.find(v => v.name.includes('Google') || v.name.includes('Natural')) || vocesIdioma[0];
      }
      window.speechSynthesis.speak(locucion);
    } catch (e) { moduloTelemetria.logError('reproducirTextoVozNativa', e); }
  },

  reproducirAudioOTexto: function(texto, codigoIso, iconoDominante, audioUrlObject) {
    this.detenerCualquierAudio();
    if (audioUrlObject && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(audioUrlObject);
        this.reproductorAudioActivo = audio;
        audio.onended = () => { this.reproductorAudioActivo = null; };
        audio.onerror = () => {
          this.reproductorAudioActivo = null;
          this.reproducirTextoVozNativa(texto, codigoIso, iconoDominante);
        };
        audio.play().catch((e) => {
          moduloTelemetria.logError('audioPlayback', e);
          this.reproductorAudioActivo = null;
          this.reproducirTextoVozNativa(texto, codigoIso, iconoDominante);
        });
        return;
      } catch (e) { this.reproductorAudioActivo = null; }
    }
    this.reproducirTextoVozNativa(texto, codigoIso, iconoDominante);
  }
};

/* ==========================================================================
   MODULO 5: MONITOR REACTIVO DE RED E INTERNET
   ========================================================================== */
const moduloMonitorConexion = {
  enLinea: typeof navigator !== 'undefined' ? navigator.onLine : true,
  temporizadorOcultar: null, domElementos: {},

  inicializar: function(elementos, alCambiarEstado) {
    this.domElementos = elementos;
    if (typeof navigator !== 'undefined') {
      this.enLinea = navigator.onLine;
      window.addEventListener('online', () => this.manejarCambio(true, alCambiarEstado), { passive: true });
      window.addEventListener('offline', () => this.manejarCambio(false, alCambiarEstado), { passive: true });
    }
    if (!this.enLinea) this.mostrarEstado(false, "Sin conexión a internet");
  },

  verificarConexionReal: async function() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(moduloServicioTraduccion.URL_SERVICIO, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      return true;
    } catch (e) { return false; }
  },

  manejarCambio: async function(posibleOnline, callback) {
    if (posibleOnline) {
      this.mostrarEstado('reconectando', "Reconectando con el servidor...");
      const conexionReal = await this.verificarConexionReal();
      this.enLinea = conexionReal;
      this.mostrarEstado(conexionReal, conexionReal ? "En línea" : "Sin acceso real a internet");
      if (callback) callback(conexionReal);
    } else {
      this.enLinea = false;
      this.mostrarEstado(false, "Sin conexión");
      if (callback) callback(false);
    }
  },

  mostrarEstado: function(estado, mensaje) {
    const { contenedor, contenido, indicador, texto } = this.domElementos;
    if (!contenedor || !contenido || !indicador || !texto) return;

    if (this.temporizadorOcultar) { clearTimeout(this.temporizadorOcultar); this.temporizadorOcultar = null; }
    texto.textContent = mensaje;
    contenedor.classList.add('visible');
    contenido.className = "px-4 py-2 rounded-full backdrop-blur-md pastilla-vidrio-luz flex items-center gap-2 border text-[10.5px] font-semibold tracking-wide transition-all";
    indicador.className = "w-2.5 h-2.5 rounded-full";

    if (estado === true) {
      contenido.classList.add('text-emerald-300');
      indicador.classList.add('bg-emerald-400', 'shadow-[0_0_8px_#34d399]');
      this.temporizadorOcultar = setTimeout(() => contenedor.classList.remove('visible'), 2500);
    } else if (estado === 'reconectando') {
      contenido.classList.add('text-amber-300');
      indicador.classList.add('bg-amber-400', 'punto-pulso-red', 'shadow-[0_0_8px_#fbbf24]');
    } else {
      contenido.classList.add('text-red-300');
      indicador.classList.add('bg-red-500', 'punto-pulso-red', 'shadow-[0_0_8px_#ef4444]');
    }
  }
};


/* ==========================================================================
   MODULO 6: SERVICIO DE RED Y ENVÍO CON ETIQUETA CORRELACIONAL
   ========================================================================== */
const moduloServicioTraduccion = {
  URL_SERVICIO: "https://asistente-backend.auraradio-cloud.workers.dev/",

  ejecutarFetch: async (blobAudio, rol, idiomaContrario, etiquetaAudio, senalAborto) => {
    try {
      const inicioProc = performance.now();
      const extension = blobAudio.type.includes('mp4') ? 'm4a' : 'webm';
      const formulario = new FormData();
      formulario.append('audio', blobAudio, `audio.${extension}`);
      formulario.append('rol', rol);
      formulario.append('idiomaContrario', idiomaContrario);
      formulario.append('etiqueta', etiquetaAudio);

      const respuesta = await fetch(moduloServicioTraduccion.URL_SERVICIO, { 
        method: 'POST', body: formulario, signal: senalAborto 
      });

      if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
      const data = await respuesta.json();
      if (!data.etiqueta) data.etiqueta = etiquetaAudio;
      
      moduloTelemetria.logEvento('Respuesta_Red_Exitosa', { ms: performance.now() - inicioProc, rol });
      return data;
    } catch (e) {
      if (e.name !== 'AbortError') moduloTelemetria.logError('ejecutarFetch', e);
      throw e;
    }
  }
};

/* ==========================================================================
   MODULO 7: CONTROLADOR PRINCIPAL Y GESTOR DE ESTADO INMUTABLE
   ========================================================================== */

class GestorEstadoApp {
  constructor(estadoInicial) {
    // Congelamos el estado inicial para garantizar inmutabilidad corporativa
    this._estado = Object.freeze({ ...estadoInicial });
  }
  obtener() { return this._estado; }
  
  actualizar(cambios) {
    this._estado = Object.freeze({ ...this._estado, ...cambios });
  }

  obtenerIdiomaContrario(rol) {
    return rol === "staff" ? this._estado.memoriaIdiomas.guest.iso : this._estado.memoriaIdiomas.staff.iso;
  }
}

export default {
  html: () => moduloPlantillasInterfaz.generarEstructuraPrincipal(),
  
  iniciar: async () => {
    const dom = {
      btnGrabarStaff: document.getElementById('btn-grabar-staff'), btnGrabarGuest: document.getElementById('btn-grabar-guest'),
      btnCancelarStaff: document.getElementById('btn-cancelar-staff'), btnCancelarGuest: document.getElementById('btn-cancelar-guest'),
      waveStaff: document.getElementById('wave-staff'), waveGuest: document.getElementById('wave-guest'),
      wrapperStaff: document.getElementById('wrapper-staff'), wrapperGuest: document.getElementById('wrapper-guest'),
      containerMicStaff: document.getElementById('container-mic-staff'), containerMicGuest: document.getElementById('container-mic-guest'),
      divisor: document.getElementById('divisor'), chatContainer: document.getElementById('chat-container'),
      mensajesWrapper: document.getElementById('mensajes-wrapper'), scrollAnchor: document.getElementById('scroll-anchor'),
      langStaff: document.getElementById('lang-staff'), langGuest: document.getElementById('lang-guest'),
      iconosStaff: document.getElementById('iconos-staff'), iconosGuest: document.getElementById('iconos-guest'),
      bannerRed: document.getElementById('banner-red-flotante'), bannerRedContenido: document.getElementById('banner-red-contenido'),
      bannerRedIndicador: document.getElementById('banner-red-indicador'), bannerRedTexto: document.getElementById('banner-red-texto')
    };

    const gestorEstado = new GestorEstadoApp({
      grabandoRol: null, bloqueoTransicion: false, canceladoManualmente: false, tiempoInicio: 0,
      idEscribiendo: null, idPastillaReintento: null, etiquetaUltimaValida: null, contadorTurnos: 0,
      etiquetasProcesadas: new Set(), ultimoAudioFallido: null,
      memoriaIdiomas: { staff: { iso: "es" }, guest: { iso: "en" } }
    });

    let mediaRecorder = null; let audioChunks = []; let audioCtx = null; let analyser = null; let dataArray = null; let activeStream = null;

    moduloSintesisVoz.cargarVoces();
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => moduloSintesisVoz.cargarVoces();
    }

    const scrollToBottom = () => { requestAnimationFrame(() => { if (dom.chatContainer) dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight; }); };

    const inyectarSistema = (mensaje, esError = false) => {
      const contenedor = dom.mensajesWrapper || dom.chatContainer;
      if (contenedor) {
        contenedor.insertAdjacentHTML('beforeend', moduloPlantillasInterfaz.generarMensajeSistemaHtml(mensaje, esError));
        scrollToBottom();
      }
    };

    const limpiarPastillaReintento = () => {
      const { idPastillaReintento } = gestorEstado.obtener();
      if (idPastillaReintento) {
        const elemento = document.getElementById(idPastillaReintento);
        if (elemento) elemento.remove();
        gestorEstado.actualizar({ idPastillaReintento: null });
      }
    };

    moduloMonitorConexion.inicializar({ contenedor: dom.bannerRed, contenido: dom.bannerRedContenido, indicador: dom.bannerRedIndicador, texto: dom.bannerRedTexto }, (estaEnLinea) => {
      const estadoActual = gestorEstado.obtener();
      if (estaEnLinea) {
        if (estadoActual.ultimoAudioFallido && !estadoActual.idPastillaReintento) {
          const nuevoId = `reintento-${Date.now()}`;
          gestorEstado.actualizar({ idPastillaReintento: nuevoId });
          const contenedor = dom.mensajesWrapper || dom.chatContainer;
          if (contenedor) {
             contenedor.insertAdjacentHTML('beforeend', moduloPlantillasInterfaz.generarPastillaReintentarHtml(nuevoId));
             scrollToBottom();
          }
        }
      } else {
        if (estadoActual.idEscribiendo) {
          const loader = document.getElementById(estadoActual.idEscribiendo);
          if (loader) loader.remove();
          gestorEstado.actualizar({ idEscribiendo: null });
          setEstadoVisual("idle");
          inyectarSistema("Se interrumpió la conexión de red.", true);
        }
      }
    });

    const setEstadoVisual = (estado, rolFuente = null) => {
      if (estado === "grabando") {
        if (dom.divisor) dom.divisor.classList.add('opacity-0');
        if (rolFuente === "staff") {
          if (dom.wrapperGuest) dom.wrapperGuest.classList.add('lateral-oculto');
          if (dom.btnCancelarStaff) dom.btnCancelarStaff.classList.add('activo'); 
        } else {
          if (dom.wrapperStaff) dom.wrapperStaff.classList.add('lateral-oculto');
          if (dom.btnCancelarGuest) dom.btnCancelarGuest.classList.add('activo'); 
        }
      } else {
        if (dom.divisor) dom.divisor.classList.remove('opacity-0');
        if (dom.wrapperStaff) dom.wrapperStaff.classList.remove('lateral-oculto');
        if (dom.wrapperGuest) dom.wrapperGuest.classList.remove('lateral-oculto');
        if (dom.btnCancelarStaff) dom.btnCancelarStaff.classList.remove('activo');
        if (dom.btnCancelarGuest) dom.btnCancelarGuest.classList.remove('activo');
        moduloAnimacionMedusa.detenerMedusa(dom.waveStaff, dom.btnGrabarStaff);
        moduloAnimacionMedusa.detenerMedusa(dom.waveGuest, dom.btnGrabarGuest);
        
        if (estado === "procesando") {
          const id = `typing-${Date.now()}`;
          gestorEstado.actualizar({ idEscribiendo: id });
          const contenedor = dom.mensajesWrapper || dom.chatContainer;
          if (contenedor) {
             contenedor.insertAdjacentHTML('beforeend', moduloPlantillasInterfaz.generarHtmlEscribiendo(rolFuente, id));
             scrollToBottom();
          }
        }
      }
    };

    const enviarAudioAlServidor = (audioBlob, rol) => {
      limpiarPastillaReintento();
      if (!moduloMonitorConexion.enLinea) {
        moduloMonitorConexion.mostrarEstado(false, "No hay internet.");
        gestorEstado.actualizar({ ultimoAudioFallido: { blob: audioBlob, rol: rol } });
        setEstadoVisual("idle");
        const nuevoId = `reintento-${Date.now()}`;
        gestorEstado.actualizar({ idPastillaReintento: nuevoId });
        const contenedor = dom.mensajesWrapper || dom.chatContainer;
        if (contenedor) {
           contenedor.insertAdjacentHTML('beforeend', moduloPlantillasInterfaz.generarPastillaReintentarHtml(nuevoId));
           scrollToBottom();
        }
        return;
      }

      setEstadoVisual("procesando", rol);
      const st = gestorEstado.obtener();
      const nuevaEtiqueta = `etiqueta_${Date.now()}_${st.contadorTurnos + 1}`;
      
      gestorEstado.actualizar({ etiquetaUltimaValida: nuevaEtiqueta, contadorTurnos: st.contadorTurnos + 1, ultimoAudioFallido: { blob: audioBlob, rol: rol } });

      const isoContrario = gestorEstado.obtenerIdiomaContrario(rol);
      const controladores = [new AbortController(), new AbortController(), new AbortController()];
      const temporizadores = [];
      let respuestaProcesada = false;

      const procesarRespuestaConEtiqueta = (data, numIntento) => {
        const estadoActual = gestorEstado.obtener();
        if (respuestaProcesada || estadoActual.etiquetasProcesadas.has(data.etiqueta) || data.etiqueta !== estadoActual.etiquetaUltimaValida) return;

        respuestaProcesada = true;
        const nuevasEtiquetas = new Set(estadoActual.etiquetasProcesadas);
        nuevasEtiquetas.add(data.etiqueta);
        gestorEstado.actualizar({ etiquetasProcesadas: nuevasEtiquetas, ultimoAudioFallido: null });

        temporizadores.forEach(clearTimeout);
        controladores.forEach((ctrl, i) => { if (i !== (numIntento - 1)) { try { ctrl.abort(); } catch (e) {} } });

        if (estadoActual.idEscribiendo) {
          const loader = document.getElementById(estadoActual.idEscribiendo);
          if (loader) loader.remove();
          gestorEstado.actualizar({ idEscribiendo: null });
        }

        const dominante = data.hablantes && data.hablantes.length > 0 ? data.hablantes[0] : null;
        const esSilencio = !dominante || (data.texto_traducido && data.texto_traducido.includes("No se detectó")) || data.debug_error || dominante.nombre_idioma === "Silencio" || dominante.nombre_idioma === "Error";

        if (!esSilencio) {
          const iconosUnicos = [...new Set(data.hablantes.map(h => h.icono_persona).filter(Boolean))];
          const htmlIconos = iconosUnicos.map((ico, idx) => `<span class="animacion-rostro-pop" style="animation-delay: ${idx * 0.08}s">${moduloUtilidades.escaparHTML(ico)}</span>`).join('');
          const multiNombre = data.hablantes.length > 1 ? dominante.nombre_idioma + " (+)" : dominante.nombre_idioma;
          
          const memoriaIdiomasActualizada = JSON.parse(JSON.stringify(estadoActual.memoriaIdiomas));
          if (rol === "staff") {
            memoriaIdiomasActualizada.staff.iso = dominante.iso;
            if (htmlIconos && dom.iconosStaff) dom.iconosStaff.innerHTML = htmlIconos;
            if (dom.langStaff) dom.langStaff.textContent = multiNombre;
            if (data.nombre_destino && data.nombre_destino !== "Silencio" && dom.langGuest) dom.langGuest.textContent = data.nombre_destino;
          } else {
            memoriaIdiomasActualizada.guest.iso = dominante.iso;
            if (htmlIconos && dom.iconosGuest) dom.iconosGuest.innerHTML = htmlIconos;
            if (dom.langGuest) dom.langGuest.textContent = multiNombre;
            if (data.nombre_destino && data.nombre_destino !== "Silencio" && dom.langStaff) dom.langStaff.textContent = data.nombre_destino;
          }
          gestorEstado.actualizar({ memoriaIdiomas: memoriaIdiomasActualizada });
        }

        const audioUrlOptimizado = data.audio_voz ? moduloOptimizacionMemoria.base64ABlobUrl(data.audio_voz) : null;
        const contenedor = dom.mensajesWrapper || dom.chatContainer;
        if (contenedor) {
           contenedor.insertAdjacentHTML('beforeend', moduloPlantillasInterfaz.generarBurbujaHtml(data.hablantes, rol, data.texto_traducido, data.iso_destino, dominante ? dominante.icono_persona : null, audioUrlOptimizado));
           scrollToBottom();
        }
        setEstadoVisual("idle");
        if (!esSilencio && dominante) moduloSintesisVoz.reproducirAudioOTexto(data.texto_traducido, data.iso_destino, dominante.icono_persona, audioUrlOptimizado);
      };

      const dispararIntento = (numIntento) => {
        if (respuestaProcesada || gestorEstado.obtener().etiquetaUltimaValida !== nuevaEtiqueta) return;
        moduloServicioTraduccion.ejecutarFetch(audioBlob, rol, isoContrario, nuevaEtiqueta, controladores[numIntento - 1].signal)
          .then(data => procesarRespuestaConEtiqueta(data, numIntento))
          .catch(err => { if (err.name !== 'AbortError' && typeof navigator !== 'undefined' && !navigator.onLine) moduloMonitorConexion.manejarCambio(false); });
      };

      dispararIntento(1);
      temporizadores.push(setTimeout(() => { if (moduloMonitorConexion.enLinea) dispararIntento(2); }, 2500));
      temporizadores.push(setTimeout(() => { if (moduloMonitorConexion.enLinea) dispararIntento(3); }, 8000));
      temporizadores.push(setTimeout(() => {
        const estadoFinal = gestorEstado.obtener();
        if (!respuestaProcesada && estadoFinal.etiquetaUltimaValida === nuevaEtiqueta) {
          controladores.forEach(ctrl => { try { ctrl.abort(); } catch (e) {} });
          if (estadoFinal.idEscribiendo) {
            const loader = document.getElementById(estadoFinal.idEscribiendo);
            if (loader) loader.remove();
            gestorEstado.actualizar({ idEscribiendo: null });
          }
          setEstadoVisual("idle");
          const nuevoIdReintento = `reintento-${Date.now()}`;
          gestorEstado.actualizar({ idPastillaReintento: nuevoIdReintento });
          const contenedor = dom.mensajesWrapper || dom.chatContainer;
          if (contenedor) {
             contenedor.insertAdjacentHTML('beforeend', moduloPlantillasInterfaz.generarPastillaReintentarHtml(nuevoIdReintento));
             scrollToBottom();
          }
        }
      }, 15000));
    };

    const iniciarGrabacion = async (rol) => {
      const estadoBloqueo = gestorEstado.obtener();
      if (estadoBloqueo.bloqueoTransicion) return;
      gestorEstado.actualizar({ bloqueoTransicion: true });

      if (!moduloMonitorConexion.enLinea) {
        moduloMonitorConexion.mostrarEstado(false, "No puedes grabar sin internet.");
        gestorEstado.actualizar({ bloqueoTransicion: false });
        return;
      }

      moduloSintesisVoz.detenerCualquierAudio();
      moduloSintesisVoz.iniciarMotorSilencioso();
      gestorEstado.actualizar({ canceladoManualmente: false, etiquetaUltimaValida: null });
      limpiarPastillaReintento();

      const { idEscribiendo } = gestorEstado.obtener();
      if (idEscribiendo) {
        const loader = document.getElementById(idEscribiendo);
        if (loader) loader.remove();
        gestorEstado.actualizar({ idEscribiendo: null });
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        activeStream = stream;
        
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        gestorEstado.actualizar({ tiempoInicio: performance.now() });

        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
        const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
        mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        audioChunks = []; 
        
        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = () => {
          const st = gestorEstado.obtener();
          const elementoOnda = st.grabandoRol === 'staff' ? dom.waveStaff : dom.waveGuest;
          const botonActivo = st.grabandoRol === 'staff' ? dom.btnGrabarStaff : dom.btnGrabarGuest;
          moduloAnimacionMedusa.detenerMedusa(elementoOnda, botonActivo);

          if (activeStream) { activeStream.getTracks().forEach(t => t.stop()); activeStream = null; }
          if (audioCtx) { audioCtx.close().catch(()=>{}); audioCtx = null; analyser = null; dataArray = null; }

          gestorEstado.actualizar({ bloqueoTransicion: false });
          
          if (st.canceladoManualmente) { setEstadoVisual("idle"); inyectarSistema("Grabación cancelada"); return; }
          if (performance.now() - st.tiempoInicio < 750) { setEstadoVisual("idle"); inyectarSistema("Audio muy breve"); return; }

          const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          audioChunks = []; 
          enviarAudioAlServidor(audioBlob, rol);
        };

        mediaRecorder.start();
        gestorEstado.actualizar({ grabandoRol: rol });
        setEstadoVisual("grabando", rol);
        moduloAnimacionMedusa.iniciarMedusa(analyser, dataArray, rol === 'staff' ? dom.waveStaff : dom.waveGuest, rol === 'staff' ? dom.btnGrabarStaff : dom.btnGrabarGuest);
        gestorEstado.actualizar({ bloqueoTransicion: false });

      } catch (err) {
        moduloTelemetria.logError('getUserMedia', err);
        gestorEstado.actualizar({ bloqueoTransicion: false });
        moduloUtilidades.mostrarNotificacionUX("Activa los permisos del micrófono en tu navegador para continuar.");
        setEstadoVisual("idle");
      }
    };

    const detenerGrabacion = () => {
      const st = gestorEstado.obtener();
      if (st.bloqueoTransicion) return;
      moduloAnimacionMedusa.detenerMedusa(st.grabandoRol === 'staff' ? dom.waveStaff : dom.waveGuest, st.grabandoRol === 'staff' ? dom.btnGrabarStaff : dom.btnGrabarGuest);

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        gestorEstado.actualizar({ bloqueoTransicion: true });
        mediaRecorder.stop();
      } else {
        setEstadoVisual("idle");
      }
      gestorEstado.actualizar({ grabandoRol: null });
    };

    const handleGrabarClick = (rol) => {
      const st = gestorEstado.obtener();
      if (st.bloqueoTransicion) return;
      if (st.grabandoRol === rol) detenerGrabacion();
      else { if (st.grabandoRol) detenerGrabacion(); iniciarGrabacion(rol); }
    };

    if (dom.btnGrabarStaff) dom.btnGrabarStaff.addEventListener('click', () => handleGrabarClick('staff'), { passive: true });
    if (dom.btnGrabarGuest) dom.btnGrabarGuest.addEventListener('click', () => handleGrabarClick('guest'), { passive: true });

    const handleCancelar = (e) => { e.stopPropagation(); gestorEstado.actualizar({ canceladoManualmente: true }); detenerGrabacion(); };
    if (dom.btnCancelarStaff) dom.btnCancelarStaff.addEventListener('click', handleCancelar, { passive: true });
    if (dom.btnCancelarGuest) dom.btnCancelarGuest.addEventListener('click', handleCancelar, { passive: true });

    if (dom.chatContainer) {
      dom.chatContainer.addEventListener('click', (e) => {
        const botonRepetir = e.target.closest('.btn-repetir-voz');
        if (botonRepetir) {
          moduloSintesisVoz.reproducirAudioOTexto(botonRepetir.dataset.texto, botonRepetir.dataset.iso, botonRepetir.dataset.icono, botonRepetir.dataset.audio);
          return;
        }
        const botonReintentar = e.target.closest('.btn-ejecutar-reintento');
        const st = gestorEstado.obtener();
        if (botonReintentar && st.ultimoAudioFallido) {
          limpiarPastillaReintento();
          enviarAudioAlServidor(st.ultimoAudioFallido.blob, st.ultimoAudioFallido.rol);
        }
      });
    }
  }
};