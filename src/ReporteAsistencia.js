import React, { useState } from 'react';

function ReporteAsistencia({ grupos, onVolver }) {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);
  const [fecha, setFecha] = useState('');

  const obtenerEstadisticas = async () => {
    if (!grupoSeleccionado) return;
    try {
      let url = `http://localhost:3001/reportes?grupo=${grupoSeleccionado}`;
      if (fecha) url += `&fecha=${fecha}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo obtener el reporte');
      const data = await res.json();
      setEstadisticas(data);
    } catch (err) {
      setEstadisticas({ error: err.message });
    }
  };

  return (
    <div>
      <h3>Reporte de Asistencia</h3>
      <div style={{ marginBottom: 20, display: 'flex', gap: '16px', alignItems: 'center' }}>
        <select value={grupoSeleccionado} onChange={e => setGrupoSeleccionado(e.target.value)} style={{ minWidth: '180px' }}>
          <option value="">Selecciona un grupo</option>
          {grupos.map(grupo => (
            <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
          ))}
        </select>
        <input type="month" value={fecha} onChange={e => setFecha(e.target.value)} style={{ minWidth: '120px' }} />
        <button onClick={obtenerEstadisticas} disabled={!grupoSeleccionado}>Ver Estadísticas</button>
      </div>
      {estadisticas && (
        <div style={{ marginTop: 20 }}>
          {estadisticas.error ? (
            <div style={{ color: 'red' }}>{estadisticas.error}</div>
          ) : (
            <>
              <div className="card" style={{ margin: '0 auto', maxWidth: 600 }}>
                <h4>Estadísticas mensuales</h4>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Total estudiantes: {estadisticas.total}</div>
                <div style={{ color: '#4caf50', fontWeight: 600 }}>Asistieron: {estadisticas.asistieron} ({estadisticas.porcAsist}%)</div>
                <div style={{ color: '#e74c3c', fontWeight: 600 }}>Faltaron: {estadisticas.faltaron} ({estadisticas.porcFalt}%)</div>
                <h4 style={{ marginTop: 20 }}>Listado</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {estadisticas.listado.map((est, idx) => (
                    <li key={idx} style={{ marginBottom: 8, background: '#f7fafd', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{est.nombre} - {est.fechaNacimiento}</span>
                      <span style={{ color: est.asistio === 'Sí' ? '#4caf50' : est.asistio === 'No' ? '#e74c3c' : '#888', fontWeight: 600 }}>
                        {est.asistio}
                        {est.fechaAsistencia ? ` | Fecha: ${est.fechaAsistencia}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
      <button style={{ marginTop: 20 }} onClick={onVolver}>Volver al Menú</button>
    </div>
  );
}

export default ReporteAsistencia;
