import React, { useState, useEffect } from 'react';
import { addToOfflineQueue, setupSyncOnReconnect } from './offlineSync';
import GrupoDetalle from './GrupoDetalle';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];


function GestionGrupos({ grupos, onCrear, onEditar, onEliminar }) {
  useEffect(() => {
    setupSyncOnReconnect();
  }, []);
  const [grupoDetalle, setGrupoDetalle] = useState(null);
  const [estudiantesPorGrupo, setEstudiantesPorGrupo] = useState({});

  // Inscribir estudiante en backend
  const inscribirEstudiante = async (grupoId, estudiante) => {
    if (!navigator.onLine) {
      addToOfflineQueue({
        url: `http://localhost:3001/grupos/${grupoId}/estudiantes`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(estudiante)
        }
      });
      setEstudiantesPorGrupo(prev => {
        const lista = prev[grupoId] || [];
        return { ...prev, [grupoId]: [...lista, { ...estudiante, id: Date.now() }] };
      });
      alert('Inscripción guardada offline. Se sincronizará cuando vuelva la conexión.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/grupos/${grupoId}/estudiantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estudiante)
      });
      if (!res.ok) throw new Error('No se pudo inscribir');
      const data = await res.json();
      setEstudiantesPorGrupo(prev => {
        const lista = prev[grupoId] || [];
        return { ...prev, [grupoId]: [...lista, data.estudiante] };
      });
    } catch (err) {
      alert('Error al inscribir: ' + err.message);
    }
  };

  // Listar estudiantes de grupo desde backend
  const cargarEstudiantes = async (grupo) => {
    try {
      const res = await fetch(`http://localhost:3001/grupos/${grupo.id}/estudiantes`);
      if (!res.ok) throw new Error('No se pudo obtener estudiantes');
      const data = await res.json();
      setEstudiantesPorGrupo(prev => ({ ...prev, [grupo.id]: data.estudiantes }));
      setGrupoDetalle(grupo);
    } catch (err) {
      alert('Error al cargar estudiantes: ' + err.message);
      setGrupoDetalle(grupo);
    }
  };

  // Marcar asistencia en backend (sí/no)
  const marcarAsistencia = async (grupoId, estudianteId, asistio) => {
    if (!navigator.onLine) {
      addToOfflineQueue({
        url: `http://localhost:3001/grupos/${grupoId}/asistencia`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estudianteId, asistio })
        }
      });
      alert('Asistencia guardada offline. Se sincronizará cuando vuelva la conexión.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/grupos/${grupoId}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudianteId, asistio })
      });
      if (!res.ok) throw new Error('No se pudo marcar asistencia');
      // No mostrar mensaje
    } catch (err) {
      alert('Error al marcar asistencia: ' + err.message);
    }
  };

  // Volver a la lista de grupos
  const volverALista = () => setGrupoDetalle(null);
  const [nombre, setNombre] = useState('');
  const [dias, setDias] = useState([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [editando, setEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDias, setNuevoDias] = useState([]);
  const [nuevoHoraInicio, setNuevoHoraInicio] = useState('');
  const [nuevoHoraFin, setNuevoHoraFin] = useState('');

  const toggleDia = (dia, selected, setSelected) => {
    setSelected(selected.includes(dia) ? selected.filter(d => d !== dia) : [...selected, dia]);
  };

  const handleCrear = () => {
    if (!nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (!dias.length) {
      alert('Selecciona al menos un día');
      return;
    }
    if (!horaInicio || !horaFin) {
      alert('Debes ingresar hora de inicio y fin');
      return;
    }
    if (horaFin <= horaInicio) {
      alert('La hora de fin debe ser mayor a la de inicio');
      return;
    }
    onCrear({ nombre: nombre.trim(), dias, horaInicio, horaFin });
    setNombre('');
    setDias([]);
    setHoraInicio('');
    setHoraFin('');
  };

  const handleEditar = (id) => {
    if (!nuevoNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (!nuevoDias.length) {
      alert('Selecciona al menos un día');
      return;
    }
    if (!nuevoHoraInicio || !nuevoHoraFin) {
      alert('Debes ingresar hora de inicio y fin');
      return;
    }
    if (nuevoHoraFin <= nuevoHoraInicio) {
      alert('La hora de fin debe ser mayor a la de inicio');
      return;
    }
    onEditar(id, { nombre: nuevoNombre.trim(), dias: nuevoDias, horaInicio: nuevoHoraInicio, horaFin: nuevoHoraFin });
    setEditando(null);
    setNuevoNombre('');
    setNuevoDias([]);
    setNuevoHoraInicio('');
    setNuevoHoraFin('');
  };

  if (grupoDetalle) {
    return (
      <GrupoDetalle
        grupo={grupoDetalle}
        estudiantes={estudiantesPorGrupo[grupoDetalle.id] || []}
        onInscribir={inscribirEstudiante}
        onMarcarAsistencia={marcarAsistencia}
        onVolver={volverALista}
      />
    );
  }

  return (
    <div>
      <h3>Gestión de Grupos</h3>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nuevo grupo"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
        <div style={{ margin: '10px 0' }}>
          <span>Días de entrenamiento: </span>
          {DIAS.map(dia => (
            <label key={dia} style={{ marginRight: 8 }}>
              <input
                type="checkbox"
                checked={dias.includes(dia)}
                onChange={() => toggleDia(dia, dias, setDias)}
              />
              {dia}
            </label>
          ))}
        </div>
        <div style={{ margin: '10px 0' }}>
          <span>Hora inicio: </span>
          <input
            type="time"
            value={horaInicio}
            onChange={e => setHoraInicio(e.target.value)}
          />
          <span style={{ marginLeft: 10 }}>Hora fin: </span>
          <input
            type="time"
            value={horaFin}
            onChange={e => setHoraFin(e.target.value)}
          />
        </div>
        <button onClick={handleCrear}>Crear</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {grupos.map(grupo => (
          <li key={grupo.id} style={{ marginBottom: 10 }}>
            {editando === grupo.id ? (
              <>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                />
                <div style={{ margin: '10px 0' }}>
                  <span>Días: </span>
                  {DIAS.map(dia => (
                    <label key={dia} style={{ marginRight: 8 }}>
                      <input
                        type="checkbox"
                        checked={nuevoDias.includes(dia)}
                        onChange={() => toggleDia(dia, nuevoDias, setNuevoDias)}
                      />
                      {dia}
                    </label>
                  ))}
                </div>
                <div style={{ margin: '10px 0' }}>
                  <span>Hora inicio: </span>
                  <input
                    type="time"
                    value={nuevoHoraInicio}
                    onChange={e => setNuevoHoraInicio(e.target.value)}
                  />
                  <span style={{ marginLeft: 10 }}>Hora fin: </span>
                  <input
                    type="time"
                    value={nuevoHoraFin}
                    onChange={e => setNuevoHoraFin(e.target.value)}
                  />
                </div>
                <button onClick={() => handleEditar(grupo.id)}>Guardar</button>
                <button onClick={() => setEditando(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => cargarEstudiantes(grupo)}>{grupo.nombre}</span>
                <span> - Días: {grupo.dias ? grupo.dias.join(', ') : ''} - Horario: {grupo.horaInicio || ''} a {grupo.horaFin || ''}</span>
                <button style={{ marginLeft: 10 }} onClick={() => { setEditando(grupo.id); setNuevoNombre(grupo.nombre); setNuevoDias(grupo.dias || []); setNuevoHoraInicio(grupo.horaInicio || ''); setNuevoHoraFin(grupo.horaFin || ''); }}>Editar</button>
                <button style={{ marginLeft: 5 }} onClick={() => onEliminar(grupo.id)}>Eliminar</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GestionGrupos;
