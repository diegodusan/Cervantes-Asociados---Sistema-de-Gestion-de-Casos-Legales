# Cervantes Asociados — Sistema de Gestión de Casos Legales

Bienvenido al repositorio oficial del **Sistema de Gestión de Casos Legales** de Cervantes Asociados. Este proyecto es una plataforma web completa e intuitiva, desarrollada para la digitalización y seguimiento eficiente de expedientes.

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Justificación de la Arquitectura](#justificación-de-la-arquitectura)
3. [Requerimientos del Sistema](#requerimientos-del-sistema)
4. [Guías de Instalación y Configuración](#guías-de-instalación-y-configuración)
5. [Manual de Usuario Final (Abogados)](#manual-de-usuario-final-abogados)
6. [Manual de Administrador](#manual-de-administrador)
7. [Guía de Contribución](#guía-de-contribución)

---

## 1. Resumen Ejecutivo
**Cervantes Asociados** es una solución de software "Full-Stack" cuyo objetivo es erradicar los procesos manuales (como hojas de cálculo y grupos de WhatsApp) en la administración diaria de un despacho legal.

El sistema permite centralizar los **Expedientes (Casos)** y el **Directorio de Clientes** en un solo entorno seguro. Los usuarios pueden visualizar métricas gráficas en tiempo real, generar folios inalterables de manera automática (ej. `CA-2026-0004`), cambiar de manera ágil los estatus operativos y buscar información instantáneamente. Todo esto enmarcado en una interfaz con **Minimalismo Premium Estilo Apple** que prioriza la claridad, la tipografía limpia y la eficiencia de clics.

---

## 2. Justificación de la Arquitectura
La plataforma se construyó utilizando un enfoque de separación de intereses (cliente-servidor), priorizando la ligereza, mantenibilidad y resiliencia.

* **Frontend (Vanilla JS + SPA):** Se evitó deliberadamente el uso de frameworks pesados (React/Angular) para asegurar tiempos de carga menores a un segundo. Se emplea una arquitectura *Single Page Application (SPA)* donde las vistas, cuadros de diálogo (modales) y notificaciones (toasts estilo iOS) se inyectan en el DOM dinámicamente mediante `fetch`.
* **Backend (Node.js + Express):** La capa de la API RESTful. Provee seguridad y maneja la persistencia. Es asíncrono y altamente escalable para operaciones simultáneas.
* **Seguridad (JWT y Bcrypt):** El sistema es completamente *Stateless*. La seguridad se garantiza mediante JSON Web Tokens con una expiración de 8 horas, y las contraseñas se resguardan cifradas usando Bcrypt (costo de salting = 12).
* **Base de Datos (SQLite3):** Para la fase actual de desarrollo y puesta en marcha inmediata, se optó por una base de datos local SQLite. No requiere configuración de servidores externos y ofrece las garantías ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad) suficientes para despachos pequeños a medianos.

---

## 3. Requerimientos del Sistema

### Hardware Mínimo Recomendado
* CPU: 1 GHz (Dual-Core)
* Memoria RAM: 1 GB (Servidor)
* Espacio en Disco: 50 MB de almacenamiento (sin contar dependencias npm)

### Software y Dependencias
* **Sistema Operativo**: Multiplataforma (Windows, macOS, Linux).
* **Entorno de Ejecución**: [Node.js](https://nodejs.org/es/) versión **18.x LTS** (Garantizado para compatibilidad).
* **Gestor de Paquetes**: `npm` v8.x o superior.
* **Navegador**: Versiones recientes de Chrome, Safari, Firefox o Edge. (Requiere soporte para ES6+, CSS Grid, y `backdrop-filter`).

---

## 4. Guías de Instalación y Configuración

El proyecto ha sido diseñado para "levantarse" en menos de 2 minutos.

### 4.1 Clonación y Dependencias
1. Abre tu terminal o consola de comandos.
2. Clona el repositorio:
   ```bash
   git clone https://github.com/usuario/cervantes-asociados.git
   cd cervantes-asociados
   ```
3. Instala los paquetes:
   ```bash
   npm install
   ```

### 4.2 Inicialización de la Base de Datos
El proyecto incluye un script de inicialización automatizada. **Debes ejecutarlo en tu primer uso** para que se construya el archivo de base de datos (`database.sqlite`), se forjen las tablas relacionales y se creen los dos usuarios de prueba.
```bash
npm run db:init
```

### 4.3 Ejecución del Servidor
Para iniciar el sistema en modo desarrollo (con monitoreo de errores y *live reload* de consola):
```bash
npm run dev
```
*(Para ambientes de producción se recomienda usar `npm start` en combinación con manejadores de procesos como PM2).*

### 4.4 Acceso Resiliente a la Aplicación
* **Modo Estándar (Recomendado):** Abre tu navegador e ingresa a `http://localhost:3000`.
* **Modo Respaldo (Local):** La app detecta si la abriste con doble clic. Puedes navegar a `public/login.html` en el explorador de archivos y darle doble clic; el sistema conectará con el servidor backend automáticamente mediante configuración CORS.

---

## 5. Manual de Usuario Final (Abogados)

Este rol está pensado para la **operación diaria** (Lectura, creación y actualización de casos).

* **Inicio de Sesión:**
  * Correo de prueba: `abogado@cervantes.com`
  * Contraseña: `abogado123`
* **Tablero Principal (Dashboard):** 
  Al ingresar, verás un resumen estadístico (gráfica de anillos estilo iOS). Usa el buscador superior izquierdo para filtrar rápidamente por "Folio" o por "Nombre del cliente".
* **Registro de Expedientes:** 
  1. Haz clic en "Nuevo Expediente". 
  2. Selecciona un cliente del menú desplegable.
  3. Ingresa una descripción detallada. 
  4. El sistema autogenerará el Folio y la Fecha y lo catalogará como "Abierto".
* **Avanzar el Estatus de un Caso:**
  En la tabla de expedientes, ubica la columna de acciones. Utiliza los botones rápidos (iconos de "Play", "Pausa", "Check") para ir transicionando la fase legal (Ej. *Abierto* -> *En Progreso* -> *Cerrado*).
* **Directorio de Clientes:**
  Puedes navegar a la sección de "Clientes" desde el menú lateral izquierdo para consultar los datos de contacto y números telefónicos. 
  **(Nota: El abogado NO puede borrar clientes. Su perfil es operativo).**

---

## 6. Manual de Administrador

El administrador tiene acceso irrestricto y la responsabilidad de mantener el catálogo base.

* **Inicio de Sesión:**
  * Correo de prueba: `admin@cervantes.com`
  * Contraseña: `admin123`
* **Privilegios (Role-Based Access Control):** 
  El administrador posee todas las facultades del Abogado, sumado al **Control Total del Directorio de Clientes**.
* **Gestión de Clientes (Altas, Bajas y Cambios):**
  1. Ve a la vista de "Clientes" en el menú izquierdo.
  2. **Agregar:** Usa "Nuevo Cliente" para dar de alta una razón social o persona física.
  3. **Editar:** Haz clic en el icono del "lápiz" (Edit_Square) sobre un cliente existente para actualizar correos o teléfonos.
  4. **Eliminar:** Usa el icono del "bote de basura". El backend validará de forma segura el rol administrativo antes de ejecutar el borrado en cascada (o soft-delete según reglas).

---

## 7. Guía de Contribución

Nos encanta que la comunidad (y el equipo de ingeniería interno) propongan mejoras. Sigue estrictamente este flujo de trabajo para garantizar la calidad del código:

1. **Fork y Clonación:** Crea tu propia copia del repositorio mediante Fork en GitHub, clónala y haz *checkout* desde la rama `main`.
2. **Sistema de Ramas (Branching):**
   Usa prefijos descriptivos para tus ramas.
   * Nuevas funciones: `git checkout -b feature/nombre-de-la-funcion`
   * Corrección de fallos: `git checkout -b fix/falla-detectada`
   * Documentación: `git checkout -b docs/actualizacion-readme`
3. **No subas la base de datos:** El archivo `database.sqlite` ya se encuentra en nuestro archivo `.gitignore`. Por favor, abstente de enviar tu propia base local en los commits.
4. **Validación:**
   Antes de hacer el *commit*, asegúrate de inicializar nuevamente tu base de datos de pruebas (`npm run db:init`) y validar que el servidor inicie correctamente y ninguna funcionalidad Front-End se haya roto.
5. **Pull Request (PR):**
   Envía tus cambios (`git push origin feature/tu-rama`) y abre un PR en GitHub. Un revisor validará tu código (especialmente los archivos `app.js` y `server.js`) y te otorgará los permisos de integración.
