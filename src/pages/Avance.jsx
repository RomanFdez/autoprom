import { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Trash2, TrendingUp, ChevronDown, ChevronUp, Edit3, Check, X, Upload, FileText, Loader2 } from 'lucide-react';
// Lazy import to avoid loading pdf.js until needed
const parseCertificacionPDF = async (file) => {
    const { parseCertificacionPDF: parse } = await import('../utils/pdfParser');
    return parse(file);
};

const CAPITULOS = [
    { id: 'cap-01', nombre: 'Acondicionamiento del terreno', peso: 5.39 },
    { id: 'cap-02', nombre: 'Cimentaciones', peso: 11.86 },
    { id: 'cap-03', nombre: 'Estructuras', peso: 10.33 },
    { id: 'cap-04', nombre: 'Fachadas y particiones', peso: 7.05 },
    { id: 'cap-05', nombre: 'Carpintería, cerrajería, vidrios y protecciones solares', peso: 7.45 },
    { id: 'cap-06', nombre: 'Remates y ayudas', peso: 3.60 },
    { id: 'cap-07', nombre: 'Instalaciones', peso: 5.95 },
    { id: 'cap-08', nombre: 'Aislamientos e impermeabilizaciones', peso: 8.77 },
    { id: 'cap-09', nombre: 'Cubiertas', peso: 1.82 },
    { id: 'cap-10', nombre: 'Revestimientos y trasdosados', peso: 22.04 },
    { id: 'cap-11', nombre: 'Señalización y equipamiento', peso: 1.32 },
    { id: 'cap-12', nombre: 'Urbanización interior de la parcela', peso: 11.67 },
    { id: 'cap-13', nombre: 'Dotación servicios urbanísticos', peso: 0.14 },
    { id: 'cap-14', nombre: 'Gestión de residuos', peso: 0.60 },
    { id: 'cap-15', nombre: 'Control de calidad y ensayos', peso: 0.21 },
    { id: 'cap-16', nombre: 'Seguridad y salud', peso: 1.81 },
];

export default function Avance() {
    const { certificaciones, addCertificacion, updateCertificacion, deleteCertificacion } = useData();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [formNombre, setFormNombre] = useState('');
    const [expandedCert, setExpandedCert] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfResult, setPdfResult] = useState(null);
    const fileInputRef = useRef(null);

    // Sort certificaciones by number/date
    const sortedCerts = [...(certificaciones || [])].sort((a, b) => {
        return (a.numero || 0) - (b.numero || 0);
    });

    // Get the latest certification values for each chapter
    const getLatestValue = (capId) => {
        if (sortedCerts.length === 0) return 0;
        const last = sortedCerts[sortedCerts.length - 1];
        return last.valores?.[capId] || 0;
    };

    // Calculate total progress: sum of (latest cert value for each chapter)
    const totalAvance = CAPITULOS.reduce((sum, cap) => sum + getLatestValue(cap.id), 0);

    // Calculate progress per chapter (latest value / peso * 100)
    const getCapProgress = (cap) => {
        const val = getLatestValue(cap.id);
        if (cap.peso === 0) return 0;
        return Math.min((val / cap.peso) * 100, 100);
    };

    const handleNewCert = () => {
        const nextNum = sortedCerts.length + 1;
        setFormNombre(`Certificación ${nextNum}`);
        // Pre-fill with last cert values
        const lastCert = sortedCerts[sortedCerts.length - 1];
        const initial = {};
        CAPITULOS.forEach(cap => {
            initial[cap.id] = lastCert?.valores?.[cap.id] || 0;
        });
        setFormValues(initial);
        setEditingId(null);
        setShowForm(true);
    };

    const handleEditCert = (cert) => {
        setFormNombre(cert.nombre);
        setFormValues({ ...cert.valores });
        setEditingId(cert.id);
        setShowForm(true);
    };

    const handleSave = () => {
        // Validate: no value should exceed its chapter weight
        for (const cap of CAPITULOS) {
            const val = parseFloat(formValues[cap.id]) || 0;
            if (val < 0) {
                alert(`${cap.nombre}: el valor no puede ser negativo`);
                return;
            }
            if (val > cap.peso) {
                alert(`${cap.nombre}: el valor (${val}%) no puede superar el peso del capítulo (${cap.peso}%)`);
                return;
            }
        }

        const certData = {
            nombre: formNombre,
            numero: editingId
                ? sortedCerts.find(c => c.id === editingId)?.numero || sortedCerts.length
                : sortedCerts.length + 1,
            fecha: new Date().toISOString(),
            valores: {},
        };

        CAPITULOS.forEach(cap => {
            certData.valores[cap.id] = parseFloat(formValues[cap.id]) || 0;
        });

        if (editingId) {
            updateCertificacion({ ...certData, id: editingId });
        } else {
            addCertificacion(certData);
        }

        setShowForm(false);
        setFormValues({});
        setFormNombre('');
        setEditingId(null);
    };

    const handleDeleteCert = (id) => {
        if (window.confirm('¿Eliminar esta certificación?')) {
            deleteCertificacion(id);
        }
    };

    const handlePdfImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPdfLoading(true);
        setPdfResult(null);

        try {
            const result = await parseCertificacionPDF(file);
            setPdfResult(result);

            // Pre-fill form with extracted values
            const newValues = { ...formValues };
            CAPITULOS.forEach(cap => {
                if (result.valores[cap.id] !== undefined) {
                    newValues[cap.id] = result.valores[cap.id];
                }
            });
            setFormValues(newValues);
        } catch (err) {
            console.error('Error parsing PDF:', err);
            alert('Error al leer el PDF. Asegúrate de que es un archivo PDF válido.');
        } finally {
            setPdfLoading(false);
            // Reset file input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleValueChange = (capId, value) => {
        // Allow empty string for easier editing
        setFormValues(prev => ({
            ...prev,
            [capId]: value === '' ? '' : value,
        }));
    };

    const formatPct = (val) => {
        return typeof val === 'number' ? val.toFixed(2).replace('.', ',') + '%' : '0,00%';
    };

    return (
        <div className="avance-container">
            <div className="avance-header">
                <h1 className="page-title">Avance de Obra</h1>
                <button className="new-cert-btn" onClick={handleNewCert}>
                    <Plus size={18} />
                    <span>Nueva Certificación</span>
                </button>
            </div>

            {/* Global Progress */}
            <div className="global-progress-card">
                <div className="global-progress-header">
                    <TrendingUp size={20} />
                    <span>Avance Global</span>
                    <span className="global-pct">{formatPct(totalAvance)}</span>
                </div>
                <div className="progress-bar-container large">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(totalAvance, 100)}%` }}
                    />
                </div>
                {sortedCerts.length > 0 && (
                    <div className="cert-count">
                        {sortedCerts.length} certificación{sortedCerts.length !== 1 ? 'es' : ''} registrada{sortedCerts.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Chapters Table */}
            <div className="chapters-card">
                <h2 className="section-title">Capítulos</h2>
                <div className="chapters-table">
                    <div className="table-header">
                        <span className="col-name">Capítulo</span>
                        <span className="col-peso">Peso</span>
                        <span className="col-cert">Certificado</span>
                        <span className="col-progress">Progreso</span>
                    </div>
                    {CAPITULOS.map(cap => {
                        const latestVal = getLatestValue(cap.id);
                        const progress = getCapProgress(cap);
                        return (
                            <div key={cap.id} className="table-row">
                                <span className="col-name">{cap.nombre}</span>
                                <span className="col-peso">{formatPct(cap.peso)}</span>
                                <span className="col-cert">{formatPct(latestVal)}</span>
                                <span className="col-progress">
                                    <div className="mini-progress-bar">
                                        <div
                                            className={`mini-progress-fill ${progress >= 100 ? 'complete' : ''}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="mini-pct">{progress.toFixed(0)}%</span>
                                </span>
                            </div>
                        );
                    })}
                    <div className="table-row total-row">
                        <span className="col-name"><strong>TOTAL</strong></span>
                        <span className="col-peso"><strong>100,00%</strong></span>
                        <span className="col-cert"><strong>{formatPct(totalAvance)}</strong></span>
                        <span className="col-progress"></span>
                    </div>
                </div>
            </div>

            {/* Certifications History */}
            <div className="certs-card">
                <h2 className="section-title">Historial de Certificaciones</h2>
                {sortedCerts.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay certificaciones registradas aún.</p>
                        <p>Pulsa "Nueva Certificación" para empezar a registrar el avance.</p>
                    </div>
                ) : (
                    <div className="certs-list">
                        {sortedCerts.map(cert => {
                            const certTotal = CAPITULOS.reduce((sum, cap) => sum + (cert.valores?.[cap.id] || 0), 0);
                            const isExpanded = expandedCert === cert.id;
                            return (
                                <div key={cert.id} className="cert-item">
                                    <div className="cert-item-header" onClick={() => setExpandedCert(isExpanded ? null : cert.id)}>
                                        <div className="cert-item-info">
                                            <span className="cert-name">{cert.nombre}</span>
                                            <span className="cert-date">
                                                {new Date(cert.fecha).toLocaleDateString('es-ES')}
                                            </span>
                                        </div>
                                        <div className="cert-item-right">
                                            <span className="cert-total">{formatPct(certTotal)}</span>
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="cert-detail">
                                            <div className="cert-detail-table">
                                                {CAPITULOS.map(cap => {
                                                    const val = cert.valores?.[cap.id] || 0;
                                                    return val > 0 ? (
                                                        <div key={cap.id} className="cert-detail-row">
                                                            <span className="detail-name">{cap.nombre}</span>
                                                            <span className="detail-val">{formatPct(val)}</span>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                            <div className="cert-actions">
                                                <button className="cert-edit-btn" onClick={(e) => { e.stopPropagation(); handleEditCert(cert); }}>
                                                    <Edit3 size={16} />
                                                    <span>Editar</span>
                                                </button>
                                                <button className="cert-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCert(cert.id); }}>
                                                    <Trash2 size={16} />
                                                    <span>Eliminar</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New/Edit Certification Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Certificación' : 'Nueva Certificación'}</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formNombre}
                                    onChange={(e) => setFormNombre(e.target.value)}
                                    placeholder="Ej: Certificación 3"
                                />
                            </div>

                            {/* PDF Import */}
                            <div className="pdf-import-section">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    onChange={handlePdfImport}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="pdf-import-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={pdfLoading}
                                >
                                    {pdfLoading ? (
                                        <>
                                            <Loader2 size={16} className="spin" />
                                            <span>Procesando PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            <span>Importar desde PDF</span>
                                        </>
                                    )}
                                </button>
                                {pdfResult && (
                                    <div className={`pdf-result ${pdfResult.matchedCount > 0 ? 'success' : 'warning'}`}>
                                        <FileText size={14} />
                                        <span>
                                            {pdfResult.matchedCount > 0
                                                ? `Se encontraron ${pdfResult.matchedCount} de ${pdfResult.totalChapters} capítulos. Revisa los valores antes de guardar.`
                                                : 'No se encontraron datos de certificación en el PDF. Prueba con otro archivo.'
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="form-chapters">
                                <div className="form-table-header">
                                    <span className="ft-name">Capítulo</span>
                                    <span className="ft-peso">Peso</span>
                                    <span className="ft-val">Valor (%)</span>
                                </div>
                                {CAPITULOS.map(cap => (
                                    <div key={cap.id} className="form-table-row">
                                        <span className="ft-name">{cap.nombre}</span>
                                        <span className="ft-peso">{formatPct(cap.peso)}</span>
                                        <div className="ft-val">
                                            <input
                                                type="number"
                                                className="form-input-small"
                                                value={formValues[cap.id] ?? 0}
                                                onChange={(e) => handleValueChange(cap.id, e.target.value)}
                                                min="0"
                                                max={cap.peso}
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="form-table-row total-row">
                                    <span className="ft-name"><strong>TOTAL</strong></span>
                                    <span className="ft-peso"><strong>100,00%</strong></span>
                                    <span className="ft-val">
                                        <strong>
                                            {formatPct(
                                                CAPITULOS.reduce((sum, cap) => sum + (parseFloat(formValues[cap.id]) || 0), 0)
                                            )}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSave}>
                                <Check size={18} />
                                <span>{editingId ? 'Actualizar' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .avance-container {
                    padding: 20px;
                    max-width: 700px;
                    margin: 0 auto;
                }
                .avance-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .page-title {
                    font-size: 1.5rem;
                    color: var(--md-sys-color-on-background);
                    margin: 0;
                }
                .new-cert-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--md-sys-color-primary);
                    color: var(--md-sys-color-on-primary);
                    border: none;
                    padding: 10px 16px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .new-cert-btn:active { opacity: 0.8; }

                /* Global Progress */
                .global-progress-card {
                    background: var(--md-sys-color-surface);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: var(--elevation-1);
                }
                .global-progress-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    color: var(--md-sys-color-on-surface);
                    font-weight: 600;
                }
                .global-pct {
                    margin-left: auto;
                    font-size: 1.3rem;
                    color: var(--md-sys-color-primary);
                    font-weight: 700;
                }
                .progress-bar-container {
                    width: 100%;
                    background: var(--md-sys-color-outline);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .progress-bar-container.large { height: 12px; }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4caf50, #2196f3);
                    border-radius: 8px;
                    transition: width 0.5s ease;
                }
                .cert-count {
                    margin-top: 8px;
                    font-size: 0.8rem;
                    color: var(--md-sys-color-secondary);
                }

                /* Chapters Table */
                .chapters-card, .certs-card {
                    background: var(--md-sys-color-surface);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: var(--elevation-1);
                }
                .section-title {
                    font-size: 1.1rem;
                    color: var(--md-sys-color-on-surface);
                    margin: 0 0 16px 0;
                }
                .chapters-table { width: 100%; }
                .table-header, .table-row {
                    display: grid;
                    grid-template-columns: 1fr 70px 80px 120px;
                    gap: 8px;
                    padding: 10px 0;
                    align-items: center;
                    border-bottom: 1px solid var(--md-sys-color-outline);
                }
                .table-header {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--md-sys-color-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .table-row {
                    font-size: 0.85rem;
                    color: var(--md-sys-color-on-surface);
                }
                .table-row.total-row {
                    border-bottom: none;
                    border-top: 2px solid var(--md-sys-color-primary);
                    margin-top: 4px;
                    padding-top: 12px;
                }
                .col-peso, .col-cert {
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }
                .col-progress {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .mini-progress-bar {
                    flex: 1;
                    height: 6px;
                    background: var(--md-sys-color-outline);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .mini-progress-fill {
                    height: 100%;
                    background: #4caf50;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                .mini-progress-fill.complete {
                    background: #2196f3;
                }
                .mini-pct {
                    font-size: 0.75rem;
                    min-width: 30px;
                    text-align: right;
                    color: var(--md-sys-color-secondary);
                }

                /* Certifications History */
                .certs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .cert-item {
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .cert-item-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .cert-item-header:hover {
                    background: rgba(0,0,0,0.02);
                }
                .cert-item-info { display: flex; flex-direction: column; gap: 2px; }
                .cert-name { font-weight: 600; font-size: 0.95rem; color: var(--md-sys-color-on-surface); }
                .cert-date { font-size: 0.75rem; color: var(--md-sys-color-secondary); }
                .cert-item-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--md-sys-color-secondary);
                }
                .cert-total {
                    font-weight: 700;
                    font-size: 1rem;
                    color: var(--md-sys-color-primary);
                }
                .cert-detail {
                    padding: 0 16px 16px;
                    border-top: 1px solid var(--md-sys-color-outline);
                }
                .cert-detail-table { margin-top: 12px; }
                .cert-detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 0.85rem;
                    color: var(--md-sys-color-on-surface);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .detail-val { font-weight: 500; font-variant-numeric: tabular-nums; }
                .cert-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 16px;
                    justify-content: flex-end;
                }
                .cert-edit-btn, .cert-delete-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 12px;
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    background: transparent;
                    color: var(--md-sys-color-on-surface);
                    transition: all 0.2s;
                }
                .cert-edit-btn:hover { border-color: var(--md-sys-color-primary); color: var(--md-sys-color-primary); }
                .cert-delete-btn:hover { border-color: #f44336; color: #f44336; }

                .empty-state {
                    text-align: center;
                    color: var(--md-sys-color-secondary);
                    padding: 20px 0;
                    font-size: 0.9rem;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    backdrop-filter: blur(2px);
                }
                .modal-content {
                    background: var(--md-sys-color-surface);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                }
                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    border-bottom: 1px solid var(--md-sys-color-outline);
                }
                .modal-header h2 {
                    margin: 0;
                    font-size: 1.2rem;
                    color: var(--md-sys-color-on-surface);
                }
                .modal-close {
                    background: none;
                    border: none;
                    color: var(--md-sys-color-secondary);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 50%;
                }
                .modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: var(--md-sys-color-on-surface);
                }
                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: 8px;
                    font-size: 0.95rem;
                    background: var(--md-sys-color-surface);
                    color: var(--md-sys-color-on-surface);
                    outline: none;
                    box-sizing: border-box;
                }
                .form-input:focus { border-color: var(--md-sys-color-primary); }

                /* PDF Import */
                .pdf-import-section {
                    margin-bottom: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .pdf-import-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border: 2px dashed var(--md-sys-color-outline);
                    border-radius: 10px;
                    background: transparent;
                    color: var(--md-sys-color-secondary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pdf-import-btn:hover {
                    border-color: var(--md-sys-color-primary);
                    color: var(--md-sys-color-primary);
                    background: rgba(33,150,243,0.04);
                }
                .pdf-import-btn:disabled {
                    opacity: 0.6;
                    cursor: default;
                }
                .pdf-result {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    line-height: 1.4;
                }
                .pdf-result.success {
                    background: rgba(76,175,80,0.1);
                    color: #2e7d32;
                }
                .pdf-result.warning {
                    background: rgba(255,152,0,0.1);
                    color: #e65100;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .form-chapters { margin-top: 8px; }
                .form-table-header, .form-table-row {
                    display: grid;
                    grid-template-columns: 1fr 70px 80px;
                    gap: 8px;
                    padding: 8px 0;
                    align-items: center;
                }
                .form-table-header {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--md-sys-color-secondary);
                    text-transform: uppercase;
                    border-bottom: 1px solid var(--md-sys-color-outline);
                }
                .form-table-row {
                    font-size: 0.82rem;
                    color: var(--md-sys-color-on-surface);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .form-table-row.total-row {
                    border-top: 2px solid var(--md-sys-color-primary);
                    border-bottom: none;
                    padding-top: 12px;
                    margin-top: 4px;
                }
                .ft-peso { text-align: right; font-variant-numeric: tabular-nums; }
                .ft-val { text-align: right; }
                .form-input-small {
                    width: 70px;
                    padding: 6px 8px;
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: 6px;
                    font-size: 0.85rem;
                    text-align: right;
                    background: var(--md-sys-color-surface);
                    color: var(--md-sys-color-on-surface);
                    outline: none;
                }
                .form-input-small:focus { border-color: var(--md-sys-color-primary); }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 16px 20px;
                    border-top: 1px solid var(--md-sys-color-outline);
                }
                .btn-cancel {
                    padding: 10px 20px;
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: 10px;
                    background: transparent;
                    color: var(--md-sys-color-on-surface);
                    font-size: 0.9rem;
                    cursor: pointer;
                }
                .btn-save {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 10px;
                    background: var(--md-sys-color-primary);
                    color: var(--md-sys-color-on-primary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-save:active { opacity: 0.8; }

                /* Mobile */
                @media (max-width: 480px) {
                    .avance-container { padding: 12px; }
                    .table-header, .table-row {
                        grid-template-columns: 1fr 55px 60px 90px;
                        gap: 4px;
                        font-size: 0.75rem;
                    }
                    .table-header { font-size: 0.65rem; }
                    .col-name { font-size: 0.75rem; }
                    .form-table-header, .form-table-row {
                        grid-template-columns: 1fr 55px 70px;
                    }
                    .modal-content { max-height: 90vh; }
                    .new-cert-btn span { display: none; }
                }
            `}</style>
        </div>
    );
}
