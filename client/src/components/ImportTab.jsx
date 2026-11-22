import { useState, useRef, useEffect } from 'react';
import { useLang } from '../LangContext';
import { extractTitles, ALLOWED_IMAGE_TYPES } from '../api';
import { parseFilmsCSV, MAX_CSV_BYTES } from '../csv';

export default function ImportTab({ addMany, onImported }) {
  const { t } = useLang();
  const errorText = (err) => t.errors[err?.code] || t.errors.ERR_UNKNOWN;
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const imgRef = useRef();
  const csvRef = useRef();

  // libera l'object URL precedente quando cambia l'anteprima o il componente viene smontato
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = ''; // permette di riselezionare lo stesso file
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResults([]); setSelected([]); setError('');
  };

  const handleExtract = async () => {
    setLoading(true); setError('');
    try {
      const films = await extractTitles(file);
      setResults(films);
      setSelected(films.map((_, i) => i));
    } catch (err) {
      setError(errorText(err));
    } finally { setLoading(false); }
  };

  const handleImport = () => {
    const toImport = results.filter((_, i) => selected.includes(i));
    if (!toImport.length) return;
    addMany(toImport);
    onImported();
  };

  const handleCSV = async (e) => {
    const f = e.target.files[0];
    e.target.value = ''; // permette di ricaricare lo stesso file
    if (!f) return;
    if (f.size > MAX_CSV_BYTES) return alert(t.errors.ERR_FILE_TOO_LARGE);
    const rows = parseFilmsCSV(await f.text());
    if (!rows.length) return alert(t.errors.ERR_CSV_EMPTY);
    const added = addMany(rows);
    alert(`${added} ${t.import.csvImported}`);
    onImported();
  };

  const toggleSelect = (i) =>
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Screenshot */}
      <div>
        <h2 style={{ marginBottom: 12 }}>{t.import.screenshotTitle}</h2>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: 13, color: 'var(--muted)', marginBottom: 12
        }}>
          <strong style={{ color: 'var(--text)' }}>{t.import.screenshotHint}</strong>
        </div>

        <div onClick={() => imgRef.current.click()} style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
          padding: preview ? 8 : 40, textAlign: 'center', cursor: 'pointer',
          background: 'var(--surface)', transition: 'border-color 0.2s'
        }}>
          <input ref={imgRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handleFile} style={{ display: 'none' }} />
          {preview
            ? <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 6 }} />
            : <p style={{ color: 'var(--muted)' }}>{t.import.dropzone}</p>}
        </div>

        {file && !results.length && (
          <button onClick={handleExtract} disabled={loading} style={{ marginTop: 12, width: '100%' }}>
            {loading ? t.import.extracting : t.import.extractBtn}
          </button>
        )}

        {error && <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: 13 }}>{error}</p>}

        {results.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: 'var(--muted)', marginBottom: 8, fontSize: 13 }}>
              {results.length} {t.import.found}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {results.map((film, i) => (
                <label key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  background: 'var(--surface)', padding: '10px 14px',
                  borderRadius: 'var(--radius)', cursor: 'pointer'
                }}>
                  <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleSelect(i)} />
                  <span style={{ flex: 1 }}>
                    {film.type === 'serie' ? '📺' : '🎬'} {film.title}
                  </span>
                  {film.genre && <small style={{ color: 'var(--muted)' }}>{film.genre}</small>}
                </label>
              ))}
            </div>
            <button onClick={handleImport} style={{ width: '100%' }}>
              ➕ {t.import.importBtn} {selected.length} {t.import.importBtn2}
            </button>
          </div>
        )}
      </div>

      {/* CSV */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <h2 style={{ marginBottom: 4 }}>{t.import.csvTitle}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
          {t.import.csvHint} <code style={{ color: 'var(--accent)' }}>title,genre,type</code>
        </p>
        <input ref={csvRef} type="file" accept=".csv"
          onChange={handleCSV} style={{ display: 'none' }} />
        <button className="ghost" onClick={() => csvRef.current.click()}>
          {t.import.csvBtn}
        </button>
      </div>

    </div>
  );
}