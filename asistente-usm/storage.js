// Almacenamiento local persistente usando localStorage del navegador.
// Misma interfaz simplificada que window.storage del artefacto original.

const PREFIX = "asistente-usm:";

export const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return { key, value: raw };
    } catch (e) {
      return null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
      return { key, value };
    } catch (e) {
      return null;
    }
  },

  async delete(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      return { key, deleted: true };
    } catch (e) {
      return null;
    }
  },
};
