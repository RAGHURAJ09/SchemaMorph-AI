import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'

// Character set excluding easily confused characters: 0, O, 1, I, l
const CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_LENGTH = 6

function generateRandomCode(length = CODE_LENGTH) {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHAR_SET.charAt(Math.floor(Math.random() * CHAR_SET.length))
  }
  return result
}

// Vibrant cyber colors for characters
const TEXT_COLORS = [
  '#22d3ee', // Cyan
  '#10b981', // Emerald
  '#38bdf8', // Sky
  '#a78bfa', // Purple
  '#34d399', // Mint
  '#fbbf24', // Amber
  '#f472b6', // Pink
]

const Captcha = forwardRef(function Captcha({ onChange, onValidateChange }, ref) {
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const canvasRef = useRef(null)

  // Generate and draw captcha code on canvas
  const drawCaptcha = useCallback((code) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = 160
    const height = 44

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#060a14')
    bgGrad.addColorStop(1, '#0c1527')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)

    // Draw subtle grid / security noise lines in the background
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.08 + Math.random() * 0.12})`
      ctx.lineWidth = 1 + Math.random() * 1.5
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      )
      ctx.stroke()
    }

    // Draw random noise dots
    for (let i = 0; i < 45; i++) {
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.25})`
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw each character with rotation, color, and jitter
    const charSpacing = (width - 24) / code.length
    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      const color = TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)]
      const angle = (Math.random() - 0.5) * 0.45 // -13deg to +13deg
      const x = 16 + i * charSpacing + (Math.random() - 0.5) * 4
      const y = 30 + (Math.random() - 0.5) * 5

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      // Character shadow for 3D depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      ctx.fillStyle = color
      ctx.font = `bold ${22 + Math.floor(Math.random() * 4)}px 'Space Grotesk', 'Courier New', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(char, 0, 0)

      ctx.restore()
    }

    // Draw 2 foreground interference lines
    for (let i = 0; i < 2; i++) {
      ctx.beginPath()
      ctx.strokeStyle = i === 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(167, 139, 250, 0.35)'
      ctx.lineWidth = 1.2
      ctx.moveTo(0, Math.random() * height)
      ctx.lineTo(width, Math.random() * height)
      ctx.stroke()
    }
  }, [])

  const refreshCaptcha = useCallback(() => {
    setIsSpinning(true)
    const newCode = generateRandomCode()
    setCaptchaCode(newCode)
    setIsError(false)
    setErrorMessage('')
    setUserInput('')
    if (onChange) onChange('')
    if (onValidateChange) onValidateChange(false)
    setTimeout(() => {
      drawCaptcha(newCode)
      setIsSpinning(false)
    }, 180)
  }, [drawCaptcha, onChange, onValidateChange])

  // Initial code generation
  useEffect(() => {
    const code = generateRandomCode()
    setCaptchaCode(code)
    drawCaptcha(code)
  }, [drawCaptcha])

  // Audio readout using Web Speech API
  const speakCaptcha = () => {
    if (!('speechSynthesis' in window)) {
      alert('Audio CAPTCHA is not supported in this browser.')
      return
    }
    window.speechSynthesis.cancel()
    setIsSpeaking(true)

    // Formulate clear, spaced readout: e.g. "Letter A. Number 7. Letter K."
    const phrases = captchaCode.split('').map((char) => {
      if (/[0-9]/.test(char)) {
        return `Number ${char}`
      }
      return `Letter ${char}`
    })

    const utterance = new SpeechSynthesisUtterance(phrases.join('. ') + '.')
    utterance.rate = 0.82
    utterance.pitch = 1.0
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // Handle input change
  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
    setUserInput(val)
    setIsError(false)
    setErrorMessage('')
    if (onChange) onChange(val)

    const isMatch = val.trim().toLowerCase() === captchaCode.trim().toLowerCase()
    if (onValidateChange) onValidateChange(isMatch)
  }

  // Expose validation methods to parent via ref
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!userInput.trim()) {
        setIsError(true)
        setErrorMessage('Please enter the CAPTCHA code.')
        return false
      }
      const isMatch = userInput.trim().toLowerCase() === captchaCode.trim().toLowerCase()
      if (!isMatch) {
        setIsError(true)
        setErrorMessage('Incorrect CAPTCHA code. New code generated.')
        refreshCaptcha()
        return false
      }
      setIsError(false)
      setErrorMessage('')
      return true
    },
    refresh: () => {
      refreshCaptcha()
    },
    reset: () => {
      setUserInput('')
      refreshCaptcha()
    },
    getValue: () => userInput,
  }))

  const isMatched = userInput.length === CODE_LENGTH && userInput.toLowerCase() === captchaCode.toLowerCase()

  return (
    <div style={{ width: '100%' }}>
      {/* Label and Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontFamily: 'Space Grotesk,sans-serif' }}>
            Security CAPTCHA
          </label>
        </div>
        <span style={{ fontSize: 11, color: isMatched ? '#10b981' : '#22d3ee', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          {isMatched ? (
            <>
              <span>✓</span> Verified Human
            </>
          ) : (
            'Verify you are human'
          )}
        </span>
      </div>

      {/* CAPTCHA Display & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '0.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 10,
          padding: '6px 8px',
          marginBottom: 8,
          boxSizing: 'border-box',
        }}
      >
        {/* Canvas Display */}
        <div
          style={{
            position: 'relative',
            borderRadius: 8,
            overflow: 'hidden',
            border: '0.5px solid rgba(34, 211, 238, 0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            background: '#060a14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', cursor: 'pointer' }} onClick={refreshCaptcha} title="Click to refresh CAPTCHA" />
        </div>

        {/* Action Buttons: Refresh + Audio */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Refresh button */}
          <button
            type="button"
            onClick={refreshCaptcha}
            title="Generate new CAPTCHA"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '0.5px solid rgba(255, 255, 255, 0.12)',
              color: '#22d3ee',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.4s ease',
                transform: isSpinning ? 'rotate(360deg)' : 'none',
              }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>

          {/* Audio speak button */}
          <button
            type="button"
            onClick={speakCaptcha}
            title="Listen to audio CAPTCHA"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: isSpeaking ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: isSpeaking ? '0.5px solid rgba(16, 185, 129, 0.4)' : '0.5px solid rgba(255, 255, 255, 0.12)',
              color: isSpeaking ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = isSpeaking ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Input Field */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          maxLength={CODE_LENGTH}
          placeholder="Enter 6-character code"
          style={{
            width: '100%',
            padding: '11px 40px 11px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: isError
              ? '1px solid rgba(239, 68, 68, 0.6)'
              : isMatched
              ? '1px solid rgba(16, 185, 129, 0.6)'
              : '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '2px',
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            fontFamily: 'Space Grotesk, monospace',
            boxSizing: 'border-box',
            textTransform: 'uppercase',
            boxShadow: isError ? '0 0 8px rgba(239, 68, 68, 0.2)' : isMatched ? '0 0 8px rgba(16, 185, 129, 0.2)' : 'none',
          }}
        />

        {/* Verification status icon on right */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isMatched ? (
            <span style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>✓</span>
          ) : isError ? (
            <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>✕</span>
          ) : null}
        </div>
      </div>

      {/* Error message */}
      {isError && errorMessage && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
})

export default Captcha
