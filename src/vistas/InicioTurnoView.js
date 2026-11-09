export default {
  html: () => `
    <div class="flex-1 fondo-operaciones overflow-y-auto flex flex-col text-white pb-14 scrollbar-oculto">

      <!-- Bloque de marca -->
      <div class="relative px-7 pt-12 pb-8 shrink-0">
        <div class="flex items-center gap-3 anim-entrar" style="animation-delay: 0.05s">
          <img src="assets/logo-ocean-mark.png" alt="Ocean Allure" class="w-11 h-11 opacity-95" />
          <div class="flex flex-col">
            <h1 class="titulo-marca text-[15px] leading-none">Ocean Allure</h1>
            <span class="subtitulo-marca mt-1.5">Costa Mujeres</span>
          </div>
        </div>

        <div class="divisor-ola my-6 anim-entrar" style="animation-delay: 0.12s"></div>

        <div class="anim-entrar" style="animation-delay: 0.18s">
          <p class="etiqueta-seccion mb-3">Acceso de personal</p>
          <h2 class="text-[26px] leading-tight font-light text-white tracking-tight">
            Inicio de <span style="font-family: var(--font-display); font-weight: 500; color: var(--ocean-light)">turno</span>
          </h2>
          <p class="text-[11.5px] text-white/45 mt-2 font-light leading-relaxed max-w-[290px]">
            Selecciona tu área operativa para habilitar el intérprete y las herramientas del departamento.
          </p>
        </div>
      </div>

      <!-- Tarjeta lector QR -->
      <div class="px-5 mb-7 shrink-0">
        <button onclick="alert('Abriendo cámara para gafete...')" class="tarjeta-oficio panel-cristal borde-agua w-full rounded-2xl p-4 flex items-center gap-4 text-left anim-entrar" style="animation-delay: 0.26s">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
               style="background: linear-gradient(140deg, rgba(1,132,184,0.3), rgba(5,79,124,0.5)); border: 1px solid rgba(79,195,232,0.35);">
            <svg class="w-5 h-5 text-[#4FC3E8]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-[12.5px] font-semibold text-white/95 leading-tight">Escaneo rápido de gafete</h3>
            <p class="text-[10.5px] text-white/40 mt-0.5 font-light">Identificación por código QR</p>
          </div>
          <svg class="w-4 h-4 text-white/25 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- Selector manual de áreas -->
      <div class="px-5 shrink-0">
        <h3 class="etiqueta-seccion mb-4 anim-entrar" style="animation-delay: 0.32s">Selector manual</h3>

        <div class="grid grid-cols-2 gap-2.5 anim-entrar" style="animation-delay: 0.38s">
          ${[
            { dep: 'Mantenimiento', area: 'Electromecánico', nombre: 'Electromecánica', icono: '⚡', color: '#4FC3E8' },
            { dep: 'Mantenimiento', area: 'Pintor', nombre: 'Pintura · MICI', icono: '🎨', color: '#E7DCC9' },
            { dep: 'Cocina', area: 'Mecánico de Cocina', nombre: 'Mecánico Cocina', icono: '🔥', color: '#F5B960' },
            { dep: 'Albercas', area: 'Alberquero', nombre: 'Albercas', icono: '💧', color: '#7FE0F5' }
          ].map((a, i) => `
            <button onclick="window.iniciarSesion('${a.dep}', '${a.area}')"
              class="tarjeta-oficio panel-cristal rounded-2xl px-3 py-3.5 border border-white/8 text-left"
              style="animation-delay: ${0.4 + i * 0.05}s">
              <div class="flex items-start justify-between mb-3">
                <span class="text-[17px] leading-none opacity-90">${a.icono}</span>
                <span class="w-1.5 h-1.5 rounded-full mt-1" style="background:${a.color}; box-shadow: 0 0 8px ${a.color}80;"></span>
              </div>
              <h4 class="text-[11px] font-semibold leading-tight" style="color:${a.color}">${a.nombre}</h4>
              <p class="text-[8.5px] uppercase tracking-[0.16em] text-white/30 mt-1">${a.dep}</p>
            </button>
          `).join('')}

          <button onclick="window.iniciarSesion('Áreas Públicas', 'Limpieza')"
            class="tarjeta-oficio panel-cristal rounded-2xl px-4 py-3.5 border border-white/8 col-span-2 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-[15px] leading-none opacity-90">🧹</span>
              <div>
                <h4 class="text-[11px] font-semibold text-white/85 leading-tight">Áreas Públicas</h4>
                <p class="text-[8.5px] uppercase tracking-[0.16em] text-white/30 mt-1">Housekeeping · Otros</p>
              </div>
            </div>
            <svg class="w-4 h-4 text-white/25" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Pie de página institucional -->
      <div class="px-7 mt-10 mb-2 shrink-0 anim-entrar" style="animation-delay: 0.7s">
        <div class="divisor-ola mb-5"></div>
        <div class="flex items-center justify-between">
          <span class="text-[8px] uppercase tracking-[0.22em] text-white/25">Ocean Signature Resorts</span>
          <span class="text-[8px] uppercase tracking-[0.22em] text-white/25">v3.0 Enterprise</span>
        </div>
      </div>

    </div>
  `,
  iniciar: async () => {}
};

