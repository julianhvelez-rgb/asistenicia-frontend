import React, { useState } from 'react';

function GrupoDetalle({ grupo, estudiantes, onInscribir, onMarcarAsistencia, onVolver }) {
    // ...existing code...
  // Persistencia en localStorage
  const storageKey = `inscripcion_${grupo.id}`;
  const getPersisted = () => {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey));
      return data || { nombre: '', fechaNacimiento: '' };
    } catch {
      return { nombre: '', fechaNacimiento: '' };
    }
  };
  const [nombre, setNombre] = useState(getPersisted().nombre);
  const [fechaNacimiento, setFechaNacimiento] = useState(getPersisted().fechaNacimiento);

  // Guardar en localStorage al cambiar
  const persist = (nombre, fechaNacimiento) => {
    localStorage.setItem(storageKey, JSON.stringify({ nombre, fechaNacimiento }));
  };

  const handleNombreChange = (e) => {
    setNombre(e.target.value);
    persist(e.target.value, fechaNacimiento);
  };
  const handleFechaNacimientoChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2 && value[2] !== '/') {
      value = value.slice(0,2) + '/' + value.slice(2);
    }
    if (value.length > 5 && value[5] !== '/') {
      value = value.slice(0,5) + '/' + value.slice(5);
    }
    setFechaNacimiento(value);
    persist(nombre, value);
  };

  const handleInscribir = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !fechaNacimiento) {
      alert('Completa todos los campos');
      return;
    }
    onInscribir(grupo.id, { nombre, fechaNacimiento });
    setNombre('');
    setFechaNacimiento('');
    localStorage.removeItem(storageKey);
  };

  // Estado local para reflejar asistencia visualmente
  const [asistencias, setAsistencias] = useState({});

  // Actualiza asistencia local y backend
  const handleMarcarAsistencia = (grupoId, estudianteId, asistio) => {
    setAsistencias(prev => ({ ...prev, [estudianteId]: asistio }));
    onMarcarAsistencia(grupoId, estudianteId, asistio);
  };

  return (
    <div>
      <h3>Inscripción en {grupo.nombre}</h3>
      <form onSubmit={handleInscribir} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={handleNombreChange}
        />
        <input
          type="text"
          placeholder="dd/mm/aaaa"
          value={fechaNacimiento}
          onChange={handleFechaNacimientoChange}
          style={{ marginLeft: 10 }}
        />
        <button type="submit" style={{ marginLeft: 10 }}>Inscribir</button>
      </form>
      <h4>Estudiantes inscritos</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {estudiantes.length === 0 ? (
          <li>No hay estudiantes inscritos.</li>
        ) : (
          estudiantes.map(est => (
            <li key={est.id} style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 500 }}>
                Nombre: {est.nombre || 'Sin nombre'} | Fecha de nacimiento: {est.fechaNacimiento || 'Sin fecha'}
              </span>
              <span style={{ marginLeft: 16 }}>
                <label style={{ marginRight: 8 }}>
                  <input
                    type="checkbox"
                    checked={asistencias[est.id] === true || (!!est.asistio && asistencias[est.id] === undefined)}
                    onChange={() => handleMarcarAsistencia(grupo.id, est.id, true)}
                  />
                  <span role="img" aria-label="Asistió">✔️ Asistió</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={asistencias[est.id] === false || (est.asistio === false && asistencias[est.id] === undefined)}
                    onChange={() => handleMarcarAsistencia(grupo.id, est.id, false)}
                  />
                  <span role="img" aria-label="No asistió">❌ No asistió</span>
                </label>
              </span>
            </li>
          ))
        )}
      </ul>
      <button style={{ marginTop: 20 }} onClick={onVolver}>Volver a Grupos</button>
    </div>
  );
}

export default GrupoDetalle;
