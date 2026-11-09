import TraductorView from './vistas/TraductorView.js';

const enrutador = async () => {
  const contenedor = document.getElementById('mobile-container');
  if (!contenedor) return;

  contenedor.innerHTML = TraductorView.html();
  if (TraductorView.iniciar) {
    await TraductorView.iniciar();
  }
};

window.addEventListener('DOMContentLoaded', enrutador);

// Botón de "volver/cerrar" del traductor: refresca la vista sin salir del módulo
window.cerrarTraductor = () => {
  enrutador();
};
