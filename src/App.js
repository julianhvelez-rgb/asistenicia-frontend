import React, { useState } from 'react';
import GestionGrupos from './GestionGrupos';
import ReporteAsistencia from './ReporteAsistencia';
import './App.css';

function App() {
  const [pantalla, setPantalla] = useState('menu');
  const [grupos, setGrupos] = useState([]);
  const [error, setError] = useState('');
  const [grupoId, setGrupoId] = useState(1);

  // Funciones para gestión de grupos
  const crearGrupo = async (grupo) => {
    // grupo: { nombre, dias, horaInicio, horaFin }
    try {
      // Guardar en backend
      const res = await fetch('http://localhost:3001/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grupo)
      });
      if (!res.ok) throw new Error('No se pudo guardar el grupo');
      const data = await res.json();
      setGrupos([...grupos, { ...grupo, id: data.id || grupoId }]);
      setGrupoId((prev) => (data.id ? Math.max(prev, data.id + 1) : prev + 1));
    } catch (err) {
      setError('Error al guardar grupo: ' + err.message);
    }
  };

  const editarGrupo = async (id, grupoEditado) => {
    try {
      // Actualizar en backend
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
    try {
      // Eliminar en backend
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
