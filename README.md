# Cervantes Asociados — Sistema de Gestión de Casos Legales

Bienvenido al repositorio oficial del **Sistema de Gestión de Casos Legales** para el prestigioso despacho Cervantes Asociados. 

## Resumen Ejecutivo

### Descripción
**Cervantes Asociados** es una plataforma web Full-Stack diseñada a medida para modernizar el flujo de trabajo de la firma, centralizando expedientes, clientes y estatus legales en un solo entorno unificado.

### La Solución y Estética
La plataforma abandona por completo la dependencia del software ofimático (Excel) y comunicaciones informales (WhatsApp). A nivel visual, el sistema fue dotado de un rediseño de **Minimalismo Premium Estilo Apple** (macOS/iOS), integrando fondos claros (`#F5F5F7`), desenfoques nativos (Glassmorphism esmerilado con `backdrop-filter`), tarjetas con esquinas ultra-redondeadas (Squircles) y acentos en **Azul Apple (`#0071E3`)**. La experiencia de usuario es inmersiva, limpia y libre de fatiga visual.

### Arquitectura Técnica
El proyecto está estructurado con las siguientes tecnologías:
- **Frontend SPA (Single Page Application)**: Vanilla JS, CSS3, HTML5 nativo sin frameworks pesados. Transiciones ágiles.
- **Backend Node.js**: Express 4.x, CORS, manejo de JSON.
- **Base de Datos Local**: SQLite3 para un despliegue y portabilidad inmediata.
- **Seguridad**: Autenticación mediante **JWT (JSON Web Tokens)** con expiración, y almacenamiento seguro de contraseñas mediante **Bcrypt (costo 12)**.

---

## Características Principales

1. **Dashboard Visual (Chart.js):** Métricas automatizadas y distribución en vivo del estatus de todos los casos del bufete.
2. **Generación Automática de Folios:** Al dar de alta un caso, el sistema asigna y audita su propio identificador secuencial (e.g. `CA-2026-0004`).
3. **Control de Acceso (RBAC):** Separación de privilegios entre Administradores y Abogados.
4. **Buscador Inteligente con *Debounce*:** Filtrado y renderizado instantáneo de la tabla sin sobrecargar el servidor de base de datos.
5. **Doble Ejecución Flexible (Resiliencia):** El Frontend es lo suficientemente inteligente para auto-adaptarse y hacer peticiones al servidor si entras desde `http://localhost:3000` o si eres un usuario inexperto que abriste el archivo `index.html` dándole doble clic en Windows (`file:///C:/...`).

---

## Requerimientos e Instalación

### Requisitos Previos
- **Node.js**: v18.x LTS o superior.
- **NPM**: v8.x o superior.

### Inicio Rápido (Local)

1. **Clona o descarga el repositorio** y abre una terminal en la carpeta principal.
2. **Instala las dependencias** del proyecto:
   ```bash
   npm install
   ```
3. **Inicializa la base de datos** (Este comando es crítico para crear el archivo SQLite, construir las tablas y sembrar los dos usuarios de prueba):
   ```bash
   npm run db:init
   ```
4. **Ejecuta el servidor en modo desarrollo**:
   ```bash
   npm run dev
   ```
5. **Entra a la aplicación**: 
   Abre tu navegador de preferencia y visita **http://localhost:3000**. *(Alternativamente, puedes darle doble clic a `public/login.html` en tu explorador de archivos gracias a la configuración CORS avanzada).*

---

## Usuarios de Prueba

La inicialización de la base de datos (`npm run db:init`) te proporcionará los siguientes accesos:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@cervantes.com` | `admin123` | Control total. Puede agregar/editar/borrar tanto expedientes como clientes del directorio central. |
| **Abogado** | `abogado@cervantes.com` | `abogado123` | Modo lectura y trabajo operativo. Puede gestionar y crear casos, pero **no** puede borrar clientes (Restringido vía Backend). |

---

## Documentación Completa

Para revisar cada detalle de las 4 fases de implementación (desde el backend de SQLite hasta el Front-end estilo macOS), dirígete al archivo que he añadido en este directorio.
