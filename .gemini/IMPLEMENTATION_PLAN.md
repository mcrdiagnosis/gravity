# Plan de Implementación Actualizado

## ✅ Completado:
1. **Servicio de Exportación PDF** - Listo
2. **Tipos actualizados** (attachments, audioSize) - Listo
3. **Settings con WhatsApp** - ✅ Implementado
4. **@capacitor/share** - Instalado

---

## 🎯 Funcionalidades a Implementar:

### 1. Grabación de Video + Audio ⭐ NUEVO
**Prioridad**: Alta
- Botón para cambiar entre Audio/Video
- Usar `getUserMedia` con `video: true`
- Capturar video + audio simultáneamente
- Guardar como `.webm` o `.mp4`
- Enviar video al backend para análisis con GPT-4 Vision

### 2. Timeline: Mostrar Tamaño de Archivos
- Calcular y mostrar tamaño de cada grabación
- Formato: "2.5 MB", "450 KB", etc.
- Icono de almacenamiento

### 3. Botón Exportar PDF
- En `AnalysisDashboard.tsx`
- Botón "Compartir PDF"
- Usa número de WhatsApp de settings

### 4. Panel de Adjuntos (Fotos + Notas)
- Componente `AttachmentsPanel.tsx`
- Añadir fotos (cámara/galería)
- Añadir notas de texto
- Preview de adjuntos
- Eliminar adjuntos

### 5. Backend: Análisis con IA Vision
- Endpoint `/analyze-with-attachments`
- GPT-4 Vision para fotos
- Analizar frames de video
- Incluir descripciones en resumen

---

## � Flujo de Video:

1. Usuario selecciona modo "Video"
2. Graba video con audio
3. Puede añadir fotos/notas adicionales
4. Backend:
   - Extrae audio → Whisper (transcripción)
   - Extrae frames → GPT-4 Vision (descripción visual)
   - Combina todo en análisis completo
5. PDF incluye:
   - Transcripción
   - Descripción visual
   - Fotos adjuntas
   - Notas

---

## 🚀 Orden de Implementación:

1. ✅ Settings WhatsApp - HECHO
2. Timeline file size - 5 min
3. Modo Video en AudioRecorder - 15 min
4. Export PDF button - 10 min
5. Attachments panel - 20 min
6. Backend vision analysis - 20 min

**Total**: ~1.5 horas
