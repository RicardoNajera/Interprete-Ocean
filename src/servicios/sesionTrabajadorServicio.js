export const sesionTrabajadorServicio = {
  obtenerTrabajador: () => {
    try {
      const datos = localStorage.getItem('aura_staff');
      return datos ? JSON.parse(datos) : null;
    } catch {
      return null;
    }
  },
  guardarTrabajador: (datosTrabajador) => {
    localStorage.setItem('aura_staff', JSON.stringify(datosTrabajador));
  },
  limpiarTrabajador: () => {
    localStorage.removeItem('aura_staff');
  }
};
