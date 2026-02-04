# Gravity - Asistente de Conversaciones con IA

## 🎯 Propósito

Gravity es un **asistente inteligente de conversaciones** que te ayuda a capturar y procesar notas de voz con IA, especialmente útil después de llamadas telefónicas importantes.

## ✨ Características Principales

### 1. **Detección Automática de Llamadas**
- Monitorea cuando finalizan tus llamadas telefónicas
- Muestra notificaciones para recordarte grabar notas
- No intenta grabar la llamada (respeta privacidad y limitaciones de Android)

### 2. **Grabación de Notas de Voz**
- Graba notas manualmente en cualquier momento
- Interfaz simple con botón de grabar/detener
- Optimizado para capturar tu voz claramente

### 3. **Procesamiento con IA**
- Transcripción automática usando Whisper
- Análisis inteligente con GPT-4
- Extracción de:
  - Resumen ejecutivo
  - Puntos clave
  - Acciones pendientes
  - Eventos de calendario
  - Sentimiento y categorización

### 4. **Gestión de Notas**
- Historial completo de grabaciones
- Búsqueda y filtrado
- Exportación y compartir

## 🚫 Limitaciones de Android

**Importante:** Android 10+ NO permite grabar llamadas telefónicas por razones de privacidad y legales.

### ¿Por qué no se puede grabar llamadas?

- **Seguridad:** Android bloquea el audio durante llamadas activas
- **Privacidad:** Protección de datos personales
- **Legal:** Cumplimiento con regulaciones de grabación

### Solución de Gravity

En lugar de intentar lo imposible, Gravity te ayuda a:

1. **Detectar** cuando termina una llamada
2. **Recordarte** grabar notas inmediatamente
3. **Procesar** tus notas con IA para extraer información valiosa

## 📱 Flujo de Uso

### Escenario 1: Después de una Llamada

```
1. Llamada finaliza
   ↓
2. Gravity muestra notificación: "Toca para grabar notas"
   ↓
3. Abres la app y pulsas "Grabar"
   ↓
4. Hablas: "Llamada con Juan sobre el proyecto X. 
   Acordamos entregar el viernes. Pendiente: enviar presupuesto"
   ↓
5. Detienes la grabación
   ↓
6. IA procesa y extrae:
   - Resumen: Reunión con Juan sobre proyecto X
   - Acción: Enviar presupuesto (Due: viernes)
   - Evento: Entrega proyecto X (viernes)
```

### Escenario 2: Grabación Manual

```
1. Estás en una reunión presencial
   ↓
2. Abres Gravity y pulsas "Grabar Manualmente"
   ↓
3. Grabas la conversación (con permiso de los participantes)
   ↓
4. IA procesa automáticamente
```

## 🛠️ Tecnologías

### Frontend
- **React + TypeScript**: UI moderna y tipada
- **Capacitor**: Bridge nativo para Android
- **Lucide Icons**: Iconografía consistente

### Backend
- **Python FastAPI**: API REST rápida
- **OpenAI Whisper**: Transcripción de audio
- **GPT-4**: Análisis inteligente de contenido

### Android Nativo
- **AccessibilityService**: Detección de llamadas
- **MediaRecorder**: Grabación de audio con `VOICE_COMMUNICATION`
- **NotificationManager**: Notificaciones post-llamada

## 🔧 Configuración

### 1. Activar Servicio de Accesibilidad

```
Ajustes → Accesibilidad → Servicios instalados → Gravity → Activar
```

Esto permite a Gravity:
- Detectar cuando finalizan llamadas
- Mostrar notificaciones automáticas
- NO graba audio automáticamente

### 2. Permisos Necesarios

- ✅ **RECORD_AUDIO**: Grabar notas de voz
- ✅ **READ_PHONE_STATE**: Detectar estado de llamadas
- ✅ **POST_NOTIFICATIONS**: Mostrar notificaciones

## 📊 Arquitectura

```
┌─────────────────────────────────────────┐
│         Frontend (React/Capacitor)       │
│  ┌─────────────────────────────────┐   │
│  │  AccessibilitySetup Component   │   │
│  │  - ManualRecorderButton         │   │
│  │  - Status Monitoring            │   │
│  └─────────────────────────────────┘   │
│                 ↓                        │
│  ┌─────────────────────────────────┐   │
│  │  Native Plugins (Capacitor)     │   │
│  │  - SystemAudioRecorder          │   │
│  │  - AccessibilityServiceManager  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Android Native (Java/Kotlin)       │
│  ┌─────────────────────────────────┐   │
│  │  CallRecorderAccessibilityService│  │
│  │  - PhoneStateListener           │   │
│  │  - Notification Trigger         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  GravityAudioRecorderPlugin     │   │
│  │  - MediaRecorder (VOICE_COMM)   │   │
│  │  - File Management              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Backend (Python/FastAPI)        │
│  ┌─────────────────────────────────┐   │
│  │  Transcription Service          │   │
│  │  - Whisper API                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Analysis Service (Gravity Core)│   │
│  │  - GPT-4 Processing             │   │
│  │  - Structured Output            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 🎨 UX Mejorada

### Estados de la App

#### 1. Servicio Desactivado
```
┌──────────────────────────────────────┐
│ ⚠️ Activar Asistente de Conversaciones│
│                                      │
│ Recibe notificaciones al finalizar  │
│ llamadas para grabar notas de voz.  │
│                                      │
│ [Configurar Asistente]               │
│                                      │
│ ─────────────────────────────────   │
│ O graba notas manualmente:           │
│ [🎤 Grabar Manualmente]              │
└──────────────────────────────────────┘
```

#### 2. Servicio Activado
```
┌──────────────────────────────────────┐
│ ✅ Asistente de Conversaciones Activo │
│                                      │
│ Recibirás notificaciones al finalizar│
│ llamadas para grabar notas de voz.  │
│                                      │
│ 💡 Graba notas de voz en cualquier   │
│    momento:                          │
│                                      │
│ [🎤 Grabar Manualmente]              │
│                                      │
│ 💡 Tip: Después de una llamada       │
│    importante, graba un resumen.     │
└──────────────────────────────────────┘
```

#### 3. Notificación Post-Llamada
```
┌──────────────────────────────────────┐
│ 📞 Llamada Finalizada                 │
│                                      │
│ Toca para grabar notas sobre esta    │
│ llamada                              │
└──────────────────────────────────────┘
```

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Integración con calendario nativo
- [ ] Compartir resúmenes por WhatsApp/Email
- [ ] Etiquetas personalizadas

### Medio Plazo
- [ ] Soporte para múltiples idiomas
- [ ] Búsqueda semántica en historial
- [ ] Exportación a PDF/Markdown

### Largo Plazo
- [ ] Integración con CRM
- [ ] Análisis de tendencias
- [ ] Asistente de voz en tiempo real

## 📝 Notas de Desarrollo

### Cambios Recientes (v2.0)

**Pivote de Producto:**
- ❌ Eliminado: Intento de grabar llamadas telefónicas
- ✅ Añadido: Asistente de notas post-llamada
- ✅ Mejorado: UX de grabación manual
- ✅ Actualizado: Mensajería y onboarding

**Razones del Cambio:**
1. Android 10+ bloquea grabación de llamadas
2. Enfoque en privacidad y legalidad
3. Mejor experiencia de usuario con expectativas realistas

### Código Limpio

Archivos actualizados:
- `CallRecorderAccessibilityService.java`: Solo detecta llamadas
- `AccessibilitySetup.tsx`: UI actualizada para notas de voz
- `GravityAudioRecorderPlugin.java`: Usa `VOICE_COMMUNICATION`

Archivos eliminados/deprecados:
- Referencias a "True Phone"
- Mensajes sobre "grabación nativa automática"
- Código de intento de grabación durante llamadas

## 📄 Licencia

MIT License - Ver LICENSE file

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una branch para tu feature
3. Commit tus cambios
4. Push a la branch
5. Abre un Pull Request

## 📧 Soporte

Para reportar bugs o solicitar features:
- GitHub Issues: [link]
- Email: support@gravity.app

---

**Gravity** - Tu asistente inteligente de conversaciones 🚀
