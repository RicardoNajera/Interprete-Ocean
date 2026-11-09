export const uiDinamicaServicio = {
  obtenerMenuPorOficio: (subArea) => {
    const catalogo = {
      'Electromecánico': {
        color: 'indigo',
        iconoGlobal: '⚡',
        herramientas: [
          { titulo: 'Cálculo de Motores', desc: 'Amperaje y caída', icono: '⚙️' },
          { titulo: 'Manual Danfoss', desc: 'Códigos VFD', icono: '📟' },
          { titulo: 'Tickets Cuartos', desc: 'Asignaciones', icono: '📋' },
          { titulo: 'Bitácora Tableros', desc: 'Registro diario', icono: '📝' }
        ],
        prompts: ['Diagrama estrella-triángulo', 'Alarma F0002', 'Cálculo térmico 7.5 HP']
      },
      'Mecánico de Cocina': {
        color: 'amber',
        iconoGlobal: '🔥',
        herramientas: [
          { titulo: 'Diagnóstico Rational', desc: 'Hornos combinados', icono: '🍳' },
          { titulo: 'Hobart Manual', desc: 'Lavado a 82°C', icono: '🍽️' },
          { titulo: 'Cámaras Frías', desc: 'Presiones R404A', icono: '❄️' },
          { titulo: 'Refacciones', desc: 'Solicitar a almacén', icono: '📦' }
        ],
        prompts: ['Error E12 horno', 'Hobart no calienta', 'Deshielo pegado']
      },
      'Alberquero': {
        color: 'cyan',
        iconoGlobal: '💧',
        herramientas: [
          { titulo: 'Dosis Químicos', desc: 'Calculador pH/Cloro', icono: '🧪' },
          { titulo: 'Filtros Arena', desc: 'Lavado y enjuague', icono: '🔄' },
          { titulo: 'Bitácora Sanitaria', desc: 'Inspección', icono: '📝' },
          { titulo: 'Limpieza Perimetral', desc: 'Checklist', icono: '🧹' }
        ],
        prompts: ['pH 7.8 y cloro 0.5', 'Dosis floculante', 'Alcalinidad baja']
      },
      'Pintor': {
        color: 'rose',
        iconoGlobal: '🎨',
        herramientas: [
          { titulo: 'Catálogo Colores', desc: 'Códigos Comex', icono: '🖌️' },
          { titulo: 'Rendimiento', desc: 'Cálculo por m²', icono: '📐' },
          { titulo: 'MICI Cuartos', desc: 'Pendientes', icono: '🚪' },
          { titulo: 'Insumos', desc: 'Pedir lijas/cinta', icono: '📦' }
        ],
        prompts: ['Dilución sellador 5x1', 'Código marfil suites', 'Humedad en muro']
      }
    };

    return catalogo[subArea] || {
      color: 'purple',
      iconoGlobal: '🏢',
      herramientas: [
        { titulo: 'Mis Tareas', desc: 'Pendientes', icono: '📋' },
        { titulo: 'Bitácora', desc: 'Registro de turno', icono: '📝' },
        { titulo: 'Reportar', desc: 'Nueva incidencia', icono: '📷' },
        { titulo: 'Insumos', desc: 'Pedir almacén', icono: '📦' }
      ],
      prompts: ['Protocolo de seguridad', 'Entrega de turno']
    };
  }
};
