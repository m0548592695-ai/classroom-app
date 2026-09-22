import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import DrawingToolbar from './DrawingToolbar'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

function useImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    if (!src) return
    const image = new Image()
    image.onload = () => setImg(image)
    image.src = src
    return () => { image.onload = null }
  }, [src])
  return img
}

export default function WorksheetViewer({ task, student, onSubmitted, onBack }) {
  const sourceCanvasRef = useRef(null)
  const drawCanvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const historyRef = useRef([])
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)

  const image = task.file_type?.startsWith('image/') ? useImage(task.file_url) : null
  const [pdf, setPdf] = useState(null)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfTotal, setPdfTotal] = useState(0)
  const [pdfRendering, setPdfRendering] = useState(false)

  const [color, setColor] = useState('#ef4444')
  const [size, setSize] = useState(5)
  const [eraser, setEraser] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!task.file_type?.includes('pdf')) return
    let cancelled = false
    setPdfRendering(true)
    pdfjsLib.getDocument(task.file_url).promise.then(doc => {
      if (cancelled) return
      setPdf(doc)
      setPdfTotal(doc.numPages)
    }).catch(() => setNotice('לא הצלחתי לפתוח את ה-PDF. נסי קובץ אחר.'))
      .finally(() => setPdfRendering(false))
    return () => { cancelled = true }
  }, [task.file_url, task.file_type])

  useEffect(() => {
    if (image) drawSourceImage(image)
  }, [image])

  useEffect(() => {
    if (pdf) renderPdfPage(pdf, pdfPage)
  }, [pdf, pdfPage])

  function resetDrawingCanvas(width, height) {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    canvas.style.aspectRatio = `${width} / ${height}`
    canvas.getContext('2d').clearRect(0, 0, width, height)
    historyRef.current = []
  }

  function drawSourceImage(img) {
    const max = 1400
    const ratio = Math.min(1, max / img.naturalWidth)
    const w = Math.round(img.naturalWidth * ratio)
    const h = Math.round(img.naturalHeight * ratio)
    const source = sourceCanvasRef.current
    source.width = w
    source.height = h
    source.getContext('2d').drawImage(img, 0, 0, w, h)
    resetDrawingCanvas(w, h)
  }

  async function renderPdfPage(doc, pageNumber) {
    setPdfRendering(true)
    const page = await doc.getPage(pageNumber)
    const unscaled = page.getViewport({ scale: 1 })
    const maxWidth = 1400
    const scale = Math.min(2, maxWidth / unscaled.width)
    const viewport = page.getViewport({ scale })
    const source = sourceCanvasRef.current
    source.width = Math.ceil(viewport.width)
    source.height = Math.ceil(viewport.height)
    await page.render({ canvasContext: source.getContext('2d'), viewport }).promise
    resetDrawingCanvas(source.width, source.height)
    setPdfRendering(false)
  }

  function getPoint(e) {
    const canvas = drawCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  function snapshot() {
    const canvas = drawCanvasRef.current
    historyRef.current.push(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height))
    if (historyRef.current.length > 30) historyRef.current.shift()
  }

  function startDraw(e) {
    e.preventDefault()
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.setPointerCapture?.(e.pointerId)
    snapshot()
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
  }

  function moveDraw(e) {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = drawCanvasRef.current
    const ctx = canvas.getContext('2d')
    const p = getPoint(e)
    const last = lastPointRef.current
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.restore()
    lastPointRef.current = p
  }

  function endDraw() {
    drawingRef.current = false
    lastPointRef.current = null
  }

  function undo() {
    const canvas = drawCanvasRef.current
    const ctx = canvas.getContext('2d')
    const previous = historyRef.current.pop()
    if (previous) ctx.putImageData(previous, 0, 0)
  }

  function clear() {
    const canvas = drawCanvasRef.current
    snapshot()
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  async function canvasToBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  }

  async function composeCurrentPage() {
    const source = sourceCanvasRef.current
    const drawing = drawCanvasRef.current
    const out = document.createElement('canvas')
    out.width = source.width
    out.height = source.height
    const ctx = out.getContext('2d')
    ctx.drawImage(source, 0, 0)
    ctx.drawImage(drawing, 0, 0)
    return out
  }

  async function composeAllPdfPages() {
    if (!pdf || pdfTotal <= 1) return composeCurrentPage()

    const pages = []
    let totalHeight = 0
    let width = 0
    const current = pdfPage

    for (let n = 1; n <= pdfTotal; n++) {
      const page = await pdf.getPage(n)
      const viewport0 = page.getViewport({ scale: 1 })
      const scale = Math.min(2, 1400 / viewport0.width)
      const viewport = page.getViewport({ scale })
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = Math.ceil(viewport.width)
      pageCanvas.height = Math.ceil(viewport.height)
      await page.render({ canvasContext: pageCanvas.getContext('2d'), viewport }).promise

      if (n === current) {
        pageCanvas.getContext('2d').drawImage(drawCanvasRef.current, 0, 0)
      }
      pages.push(pageCanvas)
      totalHeight += pageCanvas.height
      width = Math.max(width, pageCanvas.width)
    }

    const out = document.createElement('canvas')
    out.width = width
    out.height = totalHeight
    const ctx = out.getContext('2d')
    let y = 0
    for (const pageCanvas of pages) {
      ctx.drawImage(pageCanvas, 0, y)
      y += pageCanvas.height
    }
    return out
  }

  async function submit() {
    setSubmitting(true)
    setNotice('')
    try {
      const composed = await composeAllPdfPages()
      const blob = await canvasToBlob(composed)
      onSubmitted({ blob })
    } catch (e) {
      setNotice(e.message || 'אירעה שגיאה בשליחת העבודה.')
      setSubmitting(false)
    }
  }

  return (
    <div className="worksheet-screen">
      <div className="worksheet-header">
        <button className="back-button compact" onClick={onBack}>← משימות</button>
        <div className="worksheet-title">
          <span>{student.flower}</span>
          <strong>{task.title}</strong>
        </div>
        {task.file_type?.includes('pdf') && pdfTotal > 1 ? (
          <div className="page-nav">
            <button disabled={pdfPage <= 1} onClick={() => setPdfPage(p => p - 1)}>הקודם</button>
            <span>עמוד {pdfPage} מתוך {pdfTotal}</span>
            <button disabled={pdfPage >= pdfTotal} onClick={() => setPdfPage(p => p + 1)}>הבא</button>
          </div>
        ) : <div />}
      </div>

      {notice && <div className="error-box worksheet-notice">{notice}</div>}

      <div className="worksheet-area" ref={wrapperRef}>
        {pdfRendering && <div className="loading-overlay">טוען את דף העבודה…</div>}
        <div className="paper">
          <canvas ref={sourceCanvasRef} className="source-canvas" />
          <canvas
            ref={drawCanvasRef}
            className="drawing-canvas"
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
            onPointerLeave={endDraw}
          />
        </div>
      </div>

      <DrawingToolbar
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        eraser={eraser}
        setEraser={setEraser}
        undo={undo}
        clear={clear}
        onSubmit={submit}
        submitting={submitting}
      />
    </div>
  )
}
