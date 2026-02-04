# 📞 Detección de Llamadas de VoIP (WhatsApp, Telegram, Messenger)

## ✅ Soporte Multi-App Completado

He rediseñado el motor de detección para que sea genérico y soporte las aplicaciones de mensajería más populares. Además, he corregido un fallo crítico que impedía detectar el fin de la llamada en algunos dispositivos.

### 📱 Apps Soportadas:
- ✅ **WhatsApp** (Normal y Business)
- ✅ **Telegram** (Normal y Telegram X)
- ✅ **Facebook Messenger**
- ✅ **Llamadas del Sistema** (Normales)

## 🔧 Mejoras de la "Versión Robusta"

### Detección de Fin de Llamada (Corregido)
Antes, si colgabas y la aplicación se cerraba instantáneamente volviendo al escritorio (Launcher), el sistema podía perder el evento de "Fin de Llamada". Ahora, el servicio rastrea la transición de paquetes: si detecta que has salido de una pantalla de llamada hacia **cualquier otra aplicación** (incluyendo el escritorio), dispara automáticamente la notificación de Gravity.

### Patrones de Pantalla Globales
He añadido patrones de búsqueda de interfaz que cubren casi todas las apps de VoIP:
- `VoipActivity`
- `VoiceCallActivity`
- `VideoCallActivity`
- `CallActivity`
- `InCallActivity`
- `CallScreen`

## 🧪 Cómo Probar

### 1. Recompilar y Sincronizar
```bash
# En la carpeta frontend
npm run build
npx cap copy android
```

### 2. Actualizar en Android Studio
- Pulsa el botón **Play**
- **IMPORTANTE**: Ve a Ajustes → Accesibilidad, **desactiva Gravity y vuélvelo a activar** para que cargue la nueva lista de aplicaciones (WhatsApp, Telegram, Messenger).

### 3. Prueba Multi-App
1. **WhatsApp**: Llama 10 segundos y cuelga.
2. **Telegram**: Haz una llamada de prueba.
3. **Messenger**: Prueba con un contacto.
4. **Desktop**: Prueba a colgar y salir rápidamente al escritorio del móvil.

## 📊 Depuración Avanzada (Logcat)

Filtra por `GravityCallMonitor` para ver el rastro exacto:

```
# Inicio de llamada en Telegram
Screen transition: [org.telegram.messenger] org.telegram.ui.VoIPActivity
📞 VoIP Call STARTED in [org.telegram.messenger]: org.telegram.ui.VoIPActivity

# Fin de llamada al volver al escritorio
Screen transition: [com.oppo.launcher] com.oppo.launcher.Launcher
🏁 VoIP Call ENDED (org.telegram.messenger). Duration: 12450ms
✅ Valid VoIP call detected in [org.telegram.messenger], showing notification
```

## ⚠️ Notas Importantes
- El **Servicio de Accesibilidad** debe estar encendido para estas apps.
- Las llamadas telefónicas normales (GSM) no dependen de accesibilidad y funcionan siempre.
- Al igual que antes, solo notificamos llamadas de **más de 3 segundos**.
