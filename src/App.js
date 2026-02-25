import React, { useState, useEffect } from 'react';
import { addToOfflineQueue, setupSyncOnReconnect } from './offlineSync';
import GestionGrupos from './GestionGrupos';
import ReporteAsistencia from './ReporteAsistencia';
import './App.css';

function App() {
  useEffect(() => {
    setupSyncOnReconnect();
  }, []);
  const [pantalla, setPantalla] = useState('menu');
  // Persistencia offline de grupos
  const gruposStorageKey = 'asistencia_grupos_offline';
  const getPersistedGrupos = () => {
    try {
      const data = JSON.parse(localStorage.getItem(gruposStorageKey));
      return data || [];
    } catch {
      return [];
    }
  };
  // Siempre cargar los grupos desde localStorage al iniciar (incluso online)
  const [grupos, setGrupos] = useState(getPersistedGrupos());

  // Sincronizar grupos entre pestañas/dispositivos usando el evento 'storage'
  useEffect(() => {
    const syncGrupos = (e) => {
      if (e.key === gruposStorageKey) {
        try {
          const nuevos = JSON.parse(e.newValue) || [];
          setGrupos(nuevos);
        } catch { setGrupos([]); }
      }
    };
    window.addEventListener('storage', syncGrupos);
    return () => window.removeEventListener('storage', syncGrupos);
  }, []);
  const [error, setError] = useState('');
  const [grupoId, setGrupoId] = useState(1);

  // Funciones para gestión de grupos
  const crearGrupo = async (grupo) => {
    // Siempre crear el grupo localmente y actualizar la UI inmediatamente
    try {
      const nuevoGrupo = { ...grupo, id: grupoId };
      // Leer los grupos actuales desde localStorage para evitar sobrescribir si hay varias pestañas o apps abiertas
      let gruposActuales = [];
      try {
        gruposActuales = JSON.parse(localStorage.getItem(gruposStorageKey)) || [];
      } catch (e) {
        gruposActuales = [];
        alert('Error leyendo localStorage: ' + e.message);
        console.error('Error leyendo localStorage', e);
      }
      const nuevosGrupos = [...gruposActuales, nuevoGrupo];
      setGrupos(nuevosGrupos);
      try {
        localStorage.setItem(gruposStorageKey, JSON.stringify(nuevosGrupos));
      } catch (e) {
        alert('Error guardando en localStorage: ' + e.message);
        console.error('Error guardando en localStorage', e);
      }
      setGrupoId((prev) => prev + 1);
      setError(''); // No mostrar error ni mensaje

      // Intentar sincronizar con el backend en segundo plano
      const syncAction = {
        url: 'http://localhost:3001/grupos',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(grupo)
        }
      };
      if (!navigator.onLine) {
        addToOfflineQueue(syncAction);
        return;
      }
      try {
        const res = await fetch(syncAction.url, syncAction.options);
        if (res.ok) {
          const data = await res.json();
          // Si el backend devuelve un id diferente, actualizar el grupo en localStorage y estado
          if (data.id && data.id !== nuevoGrupo.id) {
            const gruposActualizados = nuevosGrupos.map(g => g.id === nuevoGrupo.id ? { ...g, id: data.id } : g);
            setGrupos(gruposActualizados);
            try {
              localStorage.setItem(gruposStorageKey, JSON.stringify(gruposActualizados));
            } catch (e) {
              alert('Error actualizando localStorage: ' + e.message);
              console.error('Error actualizando localStorage', e);
            }
            setGrupoId((prev) => Math.max(prev, data.id + 1));
          }
        } else {
          // Si falla la petición, guardar en cola offline
          addToOfflineQueue(syncAction);
        }
      } catch (err) {
        // Si hay error de red, guardar en cola offline
        addToOfflineQueue(syncAction);
      }
    } catch (fatal) {
      alert('Error inesperado al crear grupo: ' + fatal.message);
      console.error('Error inesperado al crear grupo', fatal);
    }
  };

  const editarGrupo = async (id, grupoEditado) => {
    if (!navigator.onLine) {
      addToOfflineQueue({
        url: `http://localhost:3001/grupos/${id}`,
        options: {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(grupoEditado)
        }
      });
      setGrupos(grupos.map(g => g.id === id ? { ...g, ...grupoEditado } : g));
      setError('Editado en modo offline. Se sincronizará cuando vuelva la conexión.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/grupos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grupoEditado)
      });
      if (!res.ok) throw new Error('No se pudo editar el grupo');
      setGrupos(grupos.map(g => g.id === id ? { ...g, ...grupoEditado } : g));
    } catch (err) {
      setError('Error al editar grupo: ' + err.message);
    }
  };
  const eliminarGrupo = async (id) => {
    if (!navigator.onLine) {
      addToOfflineQueue({
        url: `http://localhost:3001/grupos/${id}`,
        options: {
          method: 'DELETE'
        }
      });
      setGrupos(grupos.filter(g => g.id !== id));
      setError('Eliminado en modo offline. Se sincronizará cuando vuelva la conexión.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/grupos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('No se pudo eliminar el grupo');
      setGrupos(grupos.filter(g => g.id !== id));
    } catch (err) {
      setError('Error al eliminar grupo: ' + err.message);
    }
  };

  return (
    <div className="App">
      <h2>Control de Asistencia WH</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      {pantalla === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', marginTop: '40px' }}>
          <button style={{ width: '320px', height: '64px', fontSize: '22px', letterSpacing: '1px' }} onClick={() => setPantalla('grupos')}>Gestión de Grupos</button>
          <button style={{ width: '320px', height: '64px', fontSize: '22px', letterSpacing: '1px' }} onClick={() => setPantalla('reporte')}>Reporte de Asistencia</button>
        </div>
      )}
      {pantalla === 'grupos' && (
        <div>
          <GestionGrupos
            grupos={grupos}
            onCrear={crearGrupo}
            onEditar={editarGrupo}
            onEliminar={eliminarGrupo}
          />
          <button style={{ marginTop: 20 }} onClick={() => setPantalla('menu')}>Volver al Menú</button>
        </div>
      )}
      {pantalla === 'reporte' && (
        <ReporteAsistencia
          grupos={grupos}
          onVolver={() => setPantalla('menu')}
        />
      )}
    </div>
  );
}

export default App;
