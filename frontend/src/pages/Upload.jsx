import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { uploadSchemaFile, uploadSchemaText, uploadQueries, runAnalysis } from '../api/client'
import { DEMO_SCHEMAS } from '../data/sampleSchemas'

const SAMPLE_SCHEMA = `-- Paste your PostgreSQL schema here
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    category_id INTEGER
);`

const SAMPLE_QUERIES = `-- Paste your SQL queries here, one per block separated by semicolons
SELECT u.name, o.total, o.status
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.id = 5;

SELECT id, email FROM users WHERE email LIKE '%@example.com';

INSERT INTO orders (user_id, total, status) VALUES (1, 99.99, 'pending');`

export default function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [schemaMode, setSchemaMode] = useState('text') // 'text' | 'file'
  const [schemaText, setSchemaText] = useState('')
  const [schemaFile, setSchemaFile] = useState(null)
  const [queryText, setQueryText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(null)
  const [activeDemoId, setActiveDemoId] = useState(null)

  const loadDemo = (demo) => {
    setSchemaText(demo.schema)
    setQueryText(demo.sampleQueries)
    setSchemaMode('text')
    setActiveDemoId(demo.id)
    toast.success(`Loaded: ${demo.label}`)
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) setSchemaFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.sql')) {
      setSchemaFile(f)
      setSchemaMode('file')
    } else {
      toast.error('Please drop a .sql file')
    }
  }

  const handleAnalyze = async () => {
    if (schemaMode === 'text' && !schemaText.trim()) {
      toast.error('Please paste or upload a schema.')
      return
    }
    if (schemaMode === 'file' && !schemaFile) {
      toast.error('Please select a .sql file.')
      return
    }

    setLoading(true)
    try {
      // Step 1: Upload schema
      setStep('Parsing schema...')
      let schemaResult
      if (schemaMode === 'file') {
        schemaResult = await uploadSchemaFile(schemaFile)
      } else {
        schemaResult = await uploadSchemaText(schemaText)
      }
      const sessionId = schemaResult.session_id
      toast.success(`Parsed ${schemaResult.table_count} tables, ${schemaResult.fk_count} FKs`)

      // Step 2: Upload queries (optional)
      if (queryText.trim()) {
        setStep('Parsing queries...')
        const rawQueries = queryText
          .split(';')
          .map(q => q.trim())
          .filter(q => q.length > 0)
          .map(q => q + ';')

        await uploadQueries(sessionId, rawQueries)
        toast.success(`Parsed ${rawQueries.length} queries`)
      }

      // Step 3: Run analysis
      setStep('Running AI analysis...')
      await runAnalysis(sessionId)

      toast.success('Analysis complete!')
      navigate(`/dashboard/${sessionId}`)

    } catch (err) {
      const msg = err.response?.data?.detail?.message
        || err.response?.data?.detail
        || err.message
        || 'Something went wrong'
      toast.error(String(msg))
      setLoading(false)
      setStep(null)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-grid relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
            Database Intelligence
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            <span className="gradient-text">SchemaMorph</span>
            <span className="text-white"> AI</span>
          </h1>
          <p className="text-surface-400 text-lg max-w-xl mx-auto leading-relaxed">
            Analyze monolithic PostgreSQL schemas and discover natural microservice boundaries — powered by graph analysis and AI.
          </p>
        </div>

        {/* Main card */}
        <div className="glass p-8 animate-slide-up">

          {/* Demo schema quick-load bar */}
          <div className="mb-8 p-4 rounded-xl border border-surface-700 bg-surface-800/50">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">
              ⚡ Try a Demo Schema — powered by public APIs
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_SCHEMAS.map(demo => (
                <button
                  key={demo.id}
                  onClick={() => loadDemo(demo)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    activeDemoId === demo.id
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-surface-700 border-surface-600 text-surface-300 hover:border-brand-500/40 hover:text-white'
                  }`}
                  title={demo.description}
                >
                  <span>{demo.emoji}</span>
                  <span>{demo.label}</span>
                  {activeDemoId === demo.id && <span className="text-brand-400">✓</span>}
                </button>
              ))}
            </div>
            {activeDemoId && (
              <p className="text-xs text-surface-500 mt-2">
                {DEMO_SCHEMAS.find(d => d.id === activeDemoId)?.description}
              </p>
            )}
          </div>

          {/* Schema Input */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white">
                PostgreSQL Schema <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-1 p-1 bg-surface-800 rounded-lg">
                <button
                  onClick={() => setSchemaMode('text')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    schemaMode === 'text'
                      ? 'bg-brand-500 text-white shadow'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  Paste SQL
                </button>
                <button
                  onClick={() => setSchemaMode('file')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    schemaMode === 'file'
                      ? 'bg-brand-500 text-white shadow'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {schemaMode === 'text' ? (
              <textarea
                value={schemaText}
                onChange={e => setSchemaText(e.target.value)}
                placeholder={SAMPLE_SCHEMA}
                rows={12}
                className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-3
                           font-mono text-xs text-surface-300 placeholder-surface-600
                           focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30
                           resize-y transition-all"
              />
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-600 hover:border-brand-500/50
                           rounded-lg p-12 text-center cursor-pointer transition-all
                           hover:bg-surface-800/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {schemaFile ? (
                  <div>
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-brand-400 font-semibold">{schemaFile.name}</p>
                    <p className="text-surface-500 text-xs mt-1">{(schemaFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-surface-300 font-medium">Drop your .sql file here</p>
                    <p className="text-surface-500 text-xs mt-1">or click to browse</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Query Input */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-white block mb-1">
              SQL Queries{' '}
              <span className="text-surface-500 font-normal">(optional — separate with semicolons)</span>
            </label>
            <p className="text-xs text-surface-500 mb-3">
              Queries that JOIN tables across service boundaries will be flagged as broken.
            </p>
            <textarea
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              placeholder={SAMPLE_QUERIES}
              rows={8}
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-3
                         font-mono text-xs text-surface-300 placeholder-surface-600
                         focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30
                         resize-y transition-all"
            />
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {step || 'Working...'}
              </span>
            ) : (
              '→  Analyze Schema'
            )}
          </button>

          {/* Info pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              '🔍 Graph Analysis',
              '🤖 Gemini AI Narration',
              '⚡ Louvain Clustering',
              '✅ Deterministic Validation',
            ].map(label => (
              <span key={label} className="px-3 py-1 rounded-full bg-surface-700 text-surface-400 text-xs border border-surface-600">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
