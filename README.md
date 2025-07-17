# Actividad Grupal - Bases de Datos NoSQL

## Descripción
Proyecto para la actividad grupal sobre uso avanzado de bases de datos NoSQL utilizando MongoDB y Neo4J.

## Objetivos
- Utilizar funcionalidades avanzadas de MongoDB
- Monitorizar la actividad de la base de datos
- Diseñar un grafo en Neo4J para visualizar datos extraídos de MongoDB

## Estructura del Proyecto
```
act_grupal_bdd/
├── index.js                              # Archivo principal (script único ejecutable)
├── package.json                          # Configuración del proyecto
├── README.md                            # Este archivo
├── data/                                # Archivos de datos
│   ├── act-grupal-city_inspections.json
│   ├── act-grupal-countries-small.json
│   ├── act-grupal-countries-big.json
│   ├── act-grupal-openDataLocalesMadrid.csv
│   ├── act-grupal-openDataLocalesMadrid.JSON
│   ├── fichero.js                       # Archivo con var datos_insertar = [...]
│   └── dump/                            # Directorio para restaurar BD
│       └── people/
│           ├── people.bson
│           └── people.metadata.json
└── scripts_actividad_grupal.txt         # Scripts generados automáticamente
```

## Requisitos Previos
- Node.js (versión 14 o superior)
- MongoDB (versión 4.2 o superior) - OBLIGATORIO
- Neo4J (versión 4.0 o superior) - OBLIGATORIO para Criterio 3
- MongoDB Tools

## Instalación
```bash
npm install
```

## Configuración de Datos
Asegúrate de tener todos los archivos de datos en el directorio `data/` como se muestra en la estructura anterior.

## Uso
```bash
# Ejecutar el script único
node index.js

# O usando npm
npm start
```

## Pasos de la Actividad

### 1. Preparar el entorno de trabajo
- [ ] Configurar MongoDB (Docker o instalación local)
- [ ] Instalar MongoDB Tools
- [ ] Configurar monitorización (mongostat y mongotop)

### 2. Importar bases de datos
- [ ] Crear BD inspections con colección city_inspections
- [ ] Crear BD countries con colecciones countries-small y countries-big

### 3. Exportar y restaurar datos
- [ ] Exportar colección inspections
- [ ] Restaurar BD people desde dump

### 4. Caso de uso: Terrazas Madrid COVID-19
- [ ] Convertir CSV a JSON
- [ ] Cargar datos en MongoDB
- [ ] Realizar actualizaciones solicitadas

### 5. Modelo Neo4J
- [ ] Diseñar modelo de datos
- [ ] Crear grafo con locales y terrazas
- [ ] Generar consultas CQL

## Autor
artemisaix 