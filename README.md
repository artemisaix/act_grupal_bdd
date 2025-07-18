# 🏛️ Proyecto de Gestión de Terrazas Madrid - MongoDB & Neo4j

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema de gestión y análisis de datos de terrazas en Madrid, utilizando **MongoDB** para operaciones de actualización masiva y **Neo4j** para análisis de grafos y visualización de relaciones geográficas.

### 🎯 Objetivos

1. **Actualización masiva de datos** en MongoDB siguiendo 10 literales específicos
2. **Migración de datos** de MongoDB a Neo4j para análisis de grafos
3. **Visualización de relaciones** entre locales, barrios y distritos
4. **Demostración práctica** de integración MongoDB-Neo4j con Node.js

---

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **MongoDB** - Base de datos NoSQL para almacenamiento de documentos
- **Neo4j** - Base de datos de grafos para análisis de relaciones
- **JavaScript** - Lenguaje de programación principal

---

## 📦 Requisitos Previos

### 1. Software Necesario

- **Node.js** (versión 14 o superior)
- **MongoDB Community Server** (versión 4.4 o superior)
- **Neo4j Desktop** o **Neo4j Community Edition**

### 2. Dependencias de Node.js

```bash
npm install mongodb neo4j-driver
```

---

## ⚙️ Configuración del Entorno

### 🍃 MongoDB Setup

1. **Instalar MongoDB:**
   - Descargar desde [mongodb.com](https://www.mongodb.com/try/download/community)
   - Instalar siguiendo las instrucciones para tu sistema operativo

2. **Iniciar MongoDB:**
   ```bash
   # Windows
   mongod
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

3. **Verificar conexión:**
   ```bash
   mongo
   # Debería conectarse a localhost:27017
   ```

4. **Configurar datos:**
   - Asegúrate de tener una base de datos llamada `Madrid`
   - Con una colección llamada `Terrazas`
   - Con datos de terrazas de Madrid

### 🔗 Neo4j Setup

1. **Instalar Neo4j:**
   - **Opción 1:** Descargar [Neo4j Desktop](https://neo4j.com/download/)
   - **Opción 2:** Instalar Neo4j Community Edition

2. **Crear una base de datos:**
   - Abrir Neo4j Desktop
   - Crear un nuevo proyecto
   - Crear una nueva base de datos local
   - Configurar credenciales (usuario: `neo4j`, contraseña: `Password`)

3. **Iniciar Neo4j:**
   - Hacer clic en "Start" en Neo4j Desktop
   - O ejecutar: `neo4j start` desde línea de comandos

4. **Verificar conexión:**
   - Abrir navegador en: `http://localhost:7474`
   - Iniciar sesión con tus credenciales

---

## 🔧 Configuración de Conexiones

### Editar parámetros de conexión en `index.js`:

```javascript
// MONGODB
const mongoUri = 'mongodb://localhost:27017';
const mongoDbName = 'Madrid';           // Cambiar si tu BD tiene otro nombre
const mongoCollection = 'Terrazas';     // Cambiar si tu colección tiene otro nombre

// NEO4J
const neo4jUri = 'neo4j://localhost:7687';  // Cambiar si usas otra dirección
const neo4jUser = 'neo4j';                  // Cambiar si usas otro usuario
const neo4jPassword = 'Password';           // ⚠️ CAMBIAR por tu contraseña
```

---

## 🚀 Uso del Script

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar el script completo
```bash
node index.js
```

### 3. ¿Qué hace el script?

#### 📊 **FASE 1: Actualizaciones en MongoDB**
El script ejecuta 10 literales específicos:

1. **Literal 1:** Cerrar locales de Guindalera (Salamanca)
2. **Literal 2:** Añadir campo `inspeccionar` a terrazas en acera
3. **Literal 3:** Incrementar mesas auxiliares y sillas en terrazas inspeccionadas
4. **Literal 4:** Añadir campo `estado` a terrazas no inspeccionadas
5. **Literal 5:** Actualizar horarios lunes-jueves (máximo 00:00:00)
6. **Literal 6:** Actualizar horarios viernes-sábado (de 02:30:00 a 02:00:00)
7. **Literal 7:** Marcar para inspección locales en calle Alcalá
8. **Literal 8:** Añadir campo `revision` a terrazas abiertas
9. **Literal 9:** Crear colección `Zona1` (distrito Villaverde)
10. **Literal 10:** Crear colección `Zona2` (distrito Salamanca, barrio Castellana)

#### 🔗 **FASE 2: Migración a Neo4j**
- Limpia la base de datos de Neo4j
- Migra 20 registros de MongoDB a Neo4j
- Crea nodos: `Local`, `Terraza`, `Barrio`, `Distrito`
- Establece relaciones: `UBICADO_EN`, `PERTENECE_A`, `TIENE_TERRAZA`

---

## 📊 Visualización en Neo4j

### 1. Abrir Neo4j Browser
```
http://localhost:7474
```

### 2. Consultas útiles para visualización

#### Ver todos los nodos y relaciones:
```cypher
MATCH (n) RETURN n LIMIT 25
```

#### Ver relaciones Local-Barrio-Distrito:
```cypher
MATCH (l:Local)-[:UBICADO_EN]->(b:Barrio)-[:PERTENECE_A]->(d:Distrito)
RETURN l, b, d
LIMIT 10
```

#### Ver locales con sus terrazas:
```cypher
MATCH (l:Local)-[:TIENE_TERRAZA]->(t:Terraza)
RETURN l.nombre, t.mesas, t.sillas
LIMIT 10
```

#### Análisis por distrito:
```cypher
MATCH (d:Distrito)<-[:PERTENECE_A]-(b:Barrio)<-[:UBICADO_EN]-(l:Local)
RETURN d.nombre, COUNT(l) as total_locales
ORDER BY total_locales DESC
```

---

## 🛡️ Solución de Problemas

### ❌ Error: "Cannot connect to MongoDB"
- Verificar que MongoDB esté ejecutándose
- Comprobar la URI de conexión
- Verificar que el puerto 27017 esté disponible

### ❌ Error: "Neo4j authentication failed"
- Verificar credenciales en el código
- Asegurarse de que Neo4j esté ejecutándose
- Comprobar que el puerto 7687 esté disponible

### ❌ Error: "Cannot apply $inc to non-numeric type"
- El script incluye normalización automática de datos
- Si persiste, verificar la estructura de datos en MongoDB

### ❌ Error: "Collection not found"
- Verificar que la base de datos `Madrid` exista
- Verificar que la colección `Terrazas` tenga datos

---

## 📁 Estructura del Proyecto

```
act_grupal_bdd/
├── index.js          # Script principal
├── package.json      # Dependencias del proyecto
├── README.md         # Este archivo
└── node_modules/     # Dependencias instaladas
```

---

## 🎯 Resultados Esperados

### MongoDB
- ✅ 10 operaciones de actualización completadas
- ✅ Nuevos campos añadidos (inspeccionar, estado, revision)
- ✅ Colecciones Zona1 y Zona2 creadas
- ✅ Horarios y situaciones actualizados

### Neo4j
- ✅ Grafo de relaciones creado
- ✅ Nodos: Locales, Terrazas, Barrios, Distritos
- ✅ Relaciones geográficas establecidas
- ✅ Datos listos para análisis visual

---

## 👥 Contribución

Este proyecto es parte de una actividad grupal de Base de Datos. Para contribuir:

1. Fork el repositorio
2. Crear una rama feature
3. Commit los cambios
4. Push a la rama
5. Crear un Pull Request

---

## 📄 Licencia

Este proyecto es de uso académico y educativo.

---

## 📞 Soporte

Si encuentras problemas:
1. Verificar que todos los servicios estén ejecutándose
2. Revisar los logs de error en la consola
3. Comprobar las configuraciones de conexión
4. Consultar la documentación oficial de MongoDB y Neo4j

---

**EQUIPO MAYO 1B UNIR** 