/**
 * Actividad Grupal - Uso avanzado de bases de datos NoSQL
 * MongoDB y Neo4J
 * 
 * REQUISITOS PREVIOS:
 * 1. Node.js instalado (https://nodejs.org/)
 * 2. MongoDB ejecutándose en localhost:27017
 * 3. Neo4J ejecutándose en localhost:7687 (OBLIGATORIO)
 * 4. Archivos de datos en directorio data/
 * 
 * INSTALACIÓN:
 * 1. npm install
 * 2. Colocar archivos de datos en carpeta data/
 * 3. Iniciar MongoDB y Neo4J
 * 4. node index.js
 * 
 * CONFIGURACIÓN:
 * - Modificar constantes de conexión si es necesario
 * - OBLIGATORIO: MongoDB y Neo4J deben estar ejecutándose
 * - Neo4J es requerido para el Criterio 3 (Modelado)
 */

const { MongoClient } = require('mongodb');
const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

// Configuración de conexiones (modificar si es necesario)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

/**
 * Clase principal para gestionar la actividad grupal de bases de datos NoSQL
 */
class ActividadGrupalBDD {
    constructor() {
        this.mongoClient = null;
        this.neo4jDriver = null;
        this.dataPath = path.join(__dirname, 'data');
        this.archivosRequeridos = [
            'act-grupal-city_inspections.json',
            'act-grupal-countries-small.json',
            'act-grupal-countries-big.json',
            'act-grupal-openDataLocalesMadrid.JSON'
        ];
    }

    /**
     * Verificar que existan los archivos de datos necesarios
     */
    verificarArchivos() {
        console.log('\n=== VERIFICACIÓN DE ARCHIVOS ===');
        
        if (!fs.existsSync(this.dataPath)) {
            console.log('❌ Directorio data/ no encontrado');
            console.log('   Crear directorio: mkdir data');
            return false;
        }

        let archivosEncontrados = 0;
        for (const archivo of this.archivosRequeridos) {
            const rutaCompleta = path.join(this.dataPath, archivo);
            if (fs.existsSync(rutaCompleta)) {
                console.log(`✅ ${archivo}`);
                archivosEncontrados++;
            } else {
                console.log(`❌ ${archivo} - No encontrado`);
            }
        }

        // Verificar dump de people
        const dumpPath = path.join(this.dataPath, 'dump', 'people', 'people.bson');
        if (fs.existsSync(dumpPath)) {
            console.log('✅ dump/people/people.bson');
            archivosEncontrados++;
        } else {
            console.log('❌ dump/people/people.bson - Descomprimir act-grupal-people.zip');
        }

        console.log(`\nArchivos encontrados: ${archivosEncontrados}/${this.archivosRequeridos.length + 1}`);
        
        if (archivosEncontrados === 0) {
            console.log('\n⚠️  INSTRUCCIONES PARA OBTENER ARCHIVOS:');
            console.log('1. Descargar archivos de datos de la actividad');
            console.log('2. Colocar en directorio data/:');
            console.log('   - act-grupal-city_inspections.json');
            console.log('   - act-grupal-countries-small.json');
            console.log('   - act-grupal-countries-big.json');
            console.log('   - act-grupal-openDataLocalesMadrid.JSON');
            console.log('3. Descomprimir act-grupal-people.zip en data/dump/');
            return false;
        }

        return true;
    }

    /**
     * Verificar que las dependencias estén instaladas
     */
    verificarDependencias() {
        console.log('\n=== VERIFICACIÓN DE DEPENDENCIAS ===');
        
        try {
            require('mongodb');
            console.log('✅ mongodb');
        } catch (error) {
            console.log('❌ mongodb - Ejecutar: npm install mongodb');
            return false;
        }

        try {
            require('neo4j-driver');
            console.log('✅ neo4j-driver');
        } catch (error) {
            console.log('❌ neo4j-driver - Ejecutar: npm install neo4j-driver');
            return false;
        }

        return true;
    }

    /**
     * Limpiar objetos JSON que contienen campos $oid
     * @param {Object} obj - Objeto a limpiar
     * @returns {Object} - Objeto limpio
     */
    limpiarObjeto(obj) {
        if (obj && typeof obj === 'object') {
            if (obj.$oid) {
                return obj.$oid;
            }
            
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null) {
                    cleaned[key] = this.limpiarObjeto(value);
                } else {
                    cleaned[key] = value;
                }
            }
            return cleaned;
        }
        return obj;
    }

    /**
     * Inicializa las conexiones a MongoDB y Neo4J
     * @returns {Promise<void>}
     */
    async inicializar() {
        console.log('\n=== INICIALIZACIÓN DE CONEXIONES ===');
        
        // Verificar MongoDB
        try {
            console.log(`Conectando a MongoDB: ${MONGO_URI}`);
            this.mongoClient = new MongoClient(MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000
            });
            await this.mongoClient.connect();
            await this.mongoClient.db('admin').command({ ping: 1 });
            console.log('✅ MongoDB conectado correctamente');
        } catch (error) {
            console.log('❌ Error conectando a MongoDB:', error.message);
            console.log('   Verificar que MongoDB esté ejecutándose en puerto 27017');
            this.mostrarConfiguracion();
            throw new Error('MongoDB no disponible');
        }

        // Verificar Neo4J (OBLIGATORIO para Criterio 3)
        try {
            console.log(`Conectando a Neo4J: ${NEO4J_URI}`);
            
            // Probar diferentes configuraciones
            const configuraciones = [
                { uri: 'bolt://localhost:7687', descripcion: 'bolt' },
                { uri: 'neo4j://localhost:7687', descripcion: 'neo4j' },
                { uri: 'bolt://127.0.0.1:7687', descripcion: 'bolt IP' }
            ];

            let conectado = false;
            for (const config of configuraciones) {
                try {
                    this.neo4jDriver = neo4j.driver(config.uri, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
                    const session = this.neo4jDriver.session();
                    await session.run('RETURN 1');
                    await session.close();
                    console.log(`✅ Neo4J conectado (${config.descripcion})`);
                    conectado = true;
                    break;
                } catch (configError) {
                    if (this.neo4jDriver) {
                        await this.neo4jDriver.close();
                        this.neo4jDriver = null;
                    }
                }
            }

            if (!conectado) {
                throw new Error('No se pudo conectar con ninguna configuración');
            }
            
        } catch (error) {
            console.log('❌ Error conectando a Neo4J:', error.message);
            console.log('   OBLIGATORIO: Neo4J es requerido para el Criterio 3 (Modelado)');
            console.log('   Para instalar Neo4J:');
            console.log('   1. Descargar Neo4J Desktop: https://neo4j.com/download/');
            console.log('   2. Crear nueva base de datos en puerto 7687');
            console.log('   3. Configurar usuario/contraseña: neo4j/password');
            console.log('   4. Iniciar la base de datos');
            this.mostrarConfiguracion();
            throw new Error('Neo4J no disponible - REQUERIDO para completar actividad');
        }
    }

    /**
     * Mostrar configuración básica (solo si hay problemas)
     */
    mostrarConfiguracion() {
        console.log('\n=== INFORMACIÓN DEL SISTEMA ===');
        console.log(`Directorio: ${path.basename(__dirname)}`);
        console.log(`Node.js: ${process.version}`);
        console.log(`MongoDB: ${MONGO_URI}`);
        console.log(`Neo4J: ${NEO4J_URI} (OBLIGATORIO)`);
    }

    /**
     * Punto c: Instrucciones para monitorización con mongostat y mongotop
     * Criterio 1: Monitorización, Importar, Exportar y Restaurar
     */
    mostrarInstruccionesMonitorizacion() {
        console.log('\n=== PASO 1: MONITORIZACIÓN ===');
        console.log('Ejecutar en terminales separadas:');
        console.log('Terminal 1: mongostat --discover');
        console.log('Terminal 2: mongotop 5');
        console.log('');
        console.log('mongostat --discover: Muestra estadísticas de rendimiento en tiempo real');
        console.log('mongotop 5: Muestra las colecciones más activas cada 5 segundos');
    }

    /**
     * Punto d: Crear base de datos inspections con colección city_inspections
     * Criterio 1: Monitorización, Importar, Exportar y Restaurar
     * @returns {Promise<void>}
     */
    async importarInspections() {
        console.log('\n=== IMPORTAR INSPECTIONS ===');
        
        const filePath = path.join(this.dataPath, 'act-grupal-city_inspections.json');
        
        if (!fs.existsSync(filePath)) {
            console.log('Archivo no encontrado:', filePath);
            return;
        }

        try {
            // Leer archivo línea por línea (formato JSONL)
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.trim().split('\n');
            const documents = [];
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const obj = JSON.parse(line);
                        documents.push(this.limpiarObjeto(obj));
                    } catch (parseError) {
                        console.log('Error parseando línea, saltando...');
                    }
                }
            }
            
            const db = this.mongoClient.db('inspections');
            const collection = db.collection('city_inspections');
            
            await collection.deleteMany({});
            const result = await collection.insertMany(documents);
            console.log(`Insertados ${result.insertedCount} documentos en inspections.city_inspections`);
            
        } catch (error) {
            console.log('Error al importar inspections:', error.message);
        }
    }

    /**
     * Punto e: Crear base de datos countries con dos colecciones
     * Criterio 1: Monitorización, Importar, Exportar y Restaurar
     * @returns {Promise<void>}
     */
    async importarCountries() {
        console.log('\n=== IMPORTAR COUNTRIES ===');
        
        const db = this.mongoClient.db('countries');
        
        // Countries Small
        const smallPath = path.join(this.dataPath, 'act-grupal-countries-small.json');
        if (fs.existsSync(smallPath)) {
            try {
                const fileContent = fs.readFileSync(smallPath, 'utf8');
                const lines = fileContent.trim().split('\n');
                const documents = [];
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const obj = JSON.parse(line);
                            documents.push(this.limpiarObjeto(obj));
                        } catch (parseError) {
                            console.log('Error parseando línea en countries-small, saltando...');
                        }
                    }
                }
                
                const smallCollection = db.collection('countries_small');
                await smallCollection.deleteMany({});
                const smallResult = await smallCollection.insertMany(documents);
                console.log(`Insertados ${smallResult.insertedCount} documentos en countries.countries_small`);
            } catch (error) {
                console.log('Error al importar countries-small:', error.message);
            }
        }

        // Countries Big
        const bigPath = path.join(this.dataPath, 'act-grupal-countries-big.json');
        if (fs.existsSync(bigPath)) {
            try {
                const fileContent = fs.readFileSync(bigPath, 'utf8');
                const lines = fileContent.trim().split('\n');
                const documents = [];
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const obj = JSON.parse(line);
                            documents.push(this.limpiarObjeto(obj));
                        } catch (parseError) {
                            console.log('Error parseando línea en countries-big, saltando...');
                        }
                    }
                }
                
                const bigCollection = db.collection('countries_big');
                await bigCollection.deleteMany({});
                const bigResult = await bigCollection.insertMany(documents);
                console.log(`Insertados ${bigResult.insertedCount} documentos en countries.countries_big`);
            } catch (error) {
                console.log('Error al importar countries-big:', error.message);
            }
        }
    }

    /**
     * Punto f: Exportar colección inspections
     * Criterio 1: Monitorización, Importar, Exportar y Restaurar
     * @returns {Promise<void>}
     */
    async exportarInspections() {
        console.log('\n=== EXPORTAR INSPECTIONS ===');
        
        const db = this.mongoClient.db('inspections');
        const collection = db.collection('city_inspections');
        const documents = await collection.find({}).toArray();
        
        const exportPath = path.join(this.dataPath, 'inspections.json');
        fs.writeFileSync(exportPath, JSON.stringify(documents, null, 2));
        
        console.log(`Exportados ${documents.length} documentos a ${exportPath}`);
        console.log('Comando equivalente: mongoexport --collection=city_inspections --db=inspections --out=inspections.json');
    }

    /**
     * Restaurar base de datos people desde dump
     * Criterio 1: Monitorización, Importar, Exportar y Restaurar
     */
    mostrarInstruccionesRestore() {
        console.log('\n=== RESTAURAR PEOPLE ===');
        
        const dumpPath = path.join(this.dataPath, 'dump', 'people');
        const bsonPath = path.join(dumpPath, 'people.bson');
        
        if (fs.existsSync(bsonPath)) {
            console.log('Estructura de dump encontrada');
            console.log('Para restaurar ejecutar: mongorestore --port 27017 ' + path.join(this.dataPath, 'dump'));
        } else {
            console.log('Descomprimir act-grupal-people.zip en data/dump/');
        }
    }

    /**
     * Puntos a-h: Preparación de datos CSV para MongoDB
     * Criterio 2: Caso de uso
     */
    mostrarProcesoCSV() {
        console.log('\n=== PROCESO CSV A MONGODB ===');
        
        const csvPath = path.join(this.dataPath, 'act-grupal-openDataLocalesMadrid.csv');
        const jsonPath = path.join(this.dataPath, 'act-grupal-openDataLocalesMadrid.JSON');
        const jsPath = path.join(this.dataPath, 'fichero.js');
        
        console.log('a. Convertir CSV a JSON: https://csvjson.com/csv2json');
        console.log('b. Descargar como Array JSON');
        console.log('c. Añadir al inicio: var datos_insertar = [...]');
        console.log('d. Guardar como .js (fichero JavaScript)');
        console.log('e. En mongo cliente:');
        console.log('   load("' + jsPath.replace(/\\/g, '\\\\') + '")');
        console.log('   datos_insertar[0]');
        console.log('f. Las instrucciones cargan el fichero y muestran el primer elemento');
        console.log('g. Insert masivo: db.Terrazas.insertMany(datos_insertar)');
        console.log('h. Alternativa: mongoimport --db Madrid --collection Terrazas --file ' + jsonPath + ' --jsonArray');
    }

    /**
     * Cargar datos de terrazas desde archivo JSON
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async cargarTerrazas() {
        console.log('\n=== CARGAR TERRAZAS ===');
        
        const jsonPath = path.join(this.dataPath, 'act-grupal-openDataLocalesMadrid.JSON');
        
        if (fs.existsSync(jsonPath)) {
            try {
                const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                const db = this.mongoClient.db('Madrid');
                const collection = db.collection('Terrazas');
                
                await collection.deleteMany({});
                await collection.insertMany(jsonData);
                console.log(`Cargados ${jsonData.length} documentos en Madrid.Terrazas`);
            } catch (error) {
                console.log('Error al cargar JSON:', error.message);
            }
        } else {
            console.log('Archivo JSON no encontrado. Usar proceso CSV descrito arriba.');
        }
    }

    /**
     * Actualización 1: Cerrar locales Guindalera de Salamanca
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion1() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        const result = await collection.updateMany(
            { desc_distrito_local: "SALAMANCA", desc_barrio_local: "GUINDALERA" },
            { 
                $set: { 
                    situacion_local: "Cerrado",
                    situacion_terraza: "Cerrada"
                }
            }
        );
        console.log(`1. Cerrados ${result.modifiedCount} locales en Guindalera de Salamanca`);
    }

    /**
     * Actualización 2: Campo inspeccionar para terrazas en acera
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion2() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        await collection.updateMany(
            { ubicacion_terraza: "Acera" },
            [
                {
                    $set: {
                        inspeccionar: { $gt: ["$num_mesas", 10] }
                    }
                }
            ]
        );
        console.log('2. Añadido campo inspeccionar a terrazas en acera');
    }

    /**
     * Actualización 3: Añadir 2 mesas y 8 sillas a terrazas que se inspeccionan
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion3() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        await collection.updateMany(
            { inspeccionar: true },
            {
                $inc: {
                    num_mesas: 2,
                    num_sillas: 8
                }
            }
        );
        console.log('3. Añadidas 2 mesas y 8 sillas a terrazas que se inspeccionan');
    }

    /**
     * Actualización 4: Campo estado para terrazas no inspeccionadas
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion4() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        await collection.updateMany(
            { inspeccionar: false },
            [
                {
                    $set: {
                        estado: {
                            $cond: {
                                if: { $lt: ["$num_sillas", 10] },
                                then: 1,
                                else: {
                                    $cond: {
                                        if: { $lte: ["$num_sillas", 20] },
                                        then: 2,
                                        else: 3
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        );
        console.log('4. Añadido campo estado a terrazas no inspeccionadas');
    }

    /**
     * Actualización 5: Horarios lunes-jueves máximo 00:00:00
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion5() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        await collection.updateMany(
            {},
            {
                $set: {
                    horario_cierre_lunes: "00:00:00",
                    horario_cierre_martes: "00:00:00",
                    horario_cierre_miercoles: "00:00:00",
                    horario_cierre_jueves: "00:00:00"
                }
            }
        );
        console.log('5. Actualizados horarios lunes-jueves a 00:00:00');
    }

    /**
     * Actualización 6: Horarios viernes-sábado de 2:30:00 a 2:00:00
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion6() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        await collection.updateMany(
            { horario_cierre_viernes: "02:30:00" },
            { $set: { horario_cierre_viernes: "02:00:00" } }
        );
        await collection.updateMany(
            { horario_cierre_sabado: "02:30:00" },
            { $set: { horario_cierre_sabado: "02:00:00" } }
        );
        console.log('6. Actualizados horarios viernes-sábado de 2:30 a 2:00');
    }

    /**
     * Actualización 7: Inspección para locales en calle Alcalá
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion7() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        const result = await collection.updateMany(
            { desc_vial_edificio: { $regex: /Alcalá/i } },
            { $set: { requiere_inspeccion: true } }
        );
        console.log(`7. Marcados ${result.modifiedCount} locales para inspección en calle Alcalá`);
    }

    /**
     * Actualización 8: Campo revisión para terrazas abiertas
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion8() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        
        await collection.updateMany(
            { situacion_terraza: "Abierta" },
            {
                $set: {
                    revision: {
                        prox_inspeccion: 10,
                        puntuacion: 80,
                        comentario: "separar las mesas"
                    }
                }
            }
        );
        console.log('8. Añadido campo revisión a terrazas abiertas');
    }

    /**
     * Actualización 9: Crear colección Zona1 con locales de Villaverde
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion9() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        const zona1 = db.collection('Zona1');
        
        const localesVillaverde = await collection.find({ 
            desc_distrito_local: "VILLAVERDE" 
        }).toArray();
        if (localesVillaverde.length > 0) {
            await zona1.deleteMany({});
            await zona1.insertMany(localesVillaverde);
            console.log(`9. Creada colección Zona1 con ${localesVillaverde.length} locales de Villaverde`);
        } else {
            console.log('9. No se encontraron locales de Villaverde');
        }
    }

    /**
     * Actualización 10: Crear colección Zona2 con locales de Salamanca barrio Castellana
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async actualizacion10() {
        const db = this.mongoClient.db('Madrid');
        const collection = db.collection('Terrazas');
        const zona2 = db.collection('Zona2');
        
        const localesSalamanca = await collection.find({ 
            desc_distrito_local: "SALAMANCA", 
            desc_barrio_local: "CASTELLANA" 
        }).toArray();
        if (localesSalamanca.length > 0) {
            await zona2.deleteMany({});
            await zona2.insertMany(localesSalamanca);
            console.log(`10. Creada colección Zona2 con ${localesSalamanca.length} locales de Salamanca-Castellana`);
        } else {
            console.log('10. No se encontraron locales de Salamanca-Castellana');
        }
    }

    /**
     * Ejecutar todas las actualizaciones de terrazas
     * Criterio 2: Caso de uso
     * @returns {Promise<void>}
     */
    async ejecutarActualizaciones() {
        console.log('\n=== ACTUALIZACIONES TERRAZAS ===');
        
        await this.actualizacion1();
        await this.actualizacion2();
        await this.actualizacion3();
        await this.actualizacion4();
        await this.actualizacion5();
        await this.actualizacion6();
        await this.actualizacion7();
        await this.actualizacion8();
        await this.actualizacion9();
        await this.actualizacion10();
        
        console.log('Todas las actualizaciones completadas');
    }

    /**
     * Crear modelo de datos en Neo4J
     * Criterio 3: Modelado
     * 
     * MODELO PROPUESTO:
     * - Distrito (nombre, codigo) -[:CONTIENE]-> Barrio (nombre, codigo)
     * - Barrio -[:TIENE_LOCAL]-> Local (id, direccion, numero, codigo_postal)
     * - Local -[:TIENE_TERRAZA]-> Terraza (id, tipo_acceso, inspeccionar)
     * 
     * PROCESO DE CARGA:
     * 1. Extraer datos de MongoDB colección Madrid.Terrazas
     * 2. Crear nodos Distrito con atributos: nombre, codigo
     * 3. Crear nodos Barrio con atributos: nombre, codigo, distrito
     * 4. Crear nodos Local con atributos: id, direccion, numero, codigo_postal
     * 5. Crear nodos Terraza con atributos: id, tipo_acceso, inspeccionar
     * 6. Establecer relaciones jerárquicas: Distrito->Barrio->Local->Terraza
     * 
     * @returns {Promise<void>}
     */
    async crearModeloNeo4j() {
        console.log('\n=== MODELO NEO4J ===');
        console.log('DESCRIPCIÓN DEL MODELO:');
        console.log('- Estructura jerárquica: Distrito -> Barrio -> Local -> Terraza');
        console.log('- Permite visualizar locales por barrio y tipos de terrazas');
        console.log('- Nodos: Distrito, Barrio, Local, Terraza');
        console.log('- Relaciones: CONTIENE, TIENE_LOCAL, TIENE_TERRAZA');
        console.log('');
        
        if (!this.neo4jDriver) {
            throw new Error('Neo4J no disponible - OBLIGATORIO para Criterio 3 (Modelado)');
        }
        
        const session = this.neo4jDriver.session();
        
        try {
            // Limpiar datos existentes
            await session.run('MATCH (n) DETACH DELETE n');
            
            // Obtener datos de MongoDB
            const db = this.mongoClient.db('Madrid');
            const terrazas = await db.collection('Terrazas').find({}).toArray();
            
            console.log('Modelo: Distrito -> Barrio -> Local -> Terraza');
            console.log('Nodos: Distrito, Barrio, Local, Terraza');
            console.log('Relaciones: CONTIENE, TIENE_LOCAL, TIENE_TERRAZA');
            
            // Crear nodos y relaciones
            for (const terraza of terrazas) {
                // Usar los campos reales de terrazas
                const distrito = terraza.desc_distrito_local || terraza.distrito;
                const barrio = terraza.desc_barrio_local || terraza.barrio;
                const idLocal = terraza.id_local || terraza._id;
                const idTerraza = terraza.id_terraza || terraza._id;
                
                // Crear nodo Distrito
                await session.run(`
                    MERGE (d:Distrito {nombre: $distrito})
                    SET d.id = $id_distrito,
                        d.codigo = $codigo_distrito
                `, { 
                    distrito: distrito,
                    id_distrito: terraza.id_distrito_local || null,
                    codigo_distrito: terraza.id_distrito_local || null
                });
                
                // Crear nodo Barrio
                await session.run(`
                    MERGE (b:Barrio {nombre: $barrio, distrito: $distrito})
                    SET b.id = $id_barrio,
                        b.codigo = $codigo_barrio
                `, { 
                    barrio: barrio,
                    distrito: distrito,
                    id_barrio: terraza.id_barrio_local || null,
                    codigo_barrio: terraza.id_barrio_local || null
                });
                
                // Crear nodo Local
                await session.run(`
                    MERGE (l:Local {id: $id})
                    SET l.id_local = $id_local,
                        l.direccion = $direccion,
                        l.calle = $calle,
                        l.numero = $numero,
                        l.codigo_postal = $codigo_postal,
                        l.distrito = $distrito,
                        l.barrio = $barrio
                `, { 
                    id: idLocal,
                    id_local: terraza.id_local || null,
                    direccion: terraza.desc_vial_edificio || null,
                    calle: terraza.desc_vial_edificio || null,
                    numero: terraza.num_edificio || null,
                    codigo_postal: terraza.cod_postal || null,
                    distrito: distrito,
                    barrio: barrio
                });
                
                // Crear nodo Terraza
                await session.run(`
                    MERGE (t:Terraza {id: $id_terraza})
                    SET t.id_terraza = $id_terraza,
                        t.local_id = $local_id,
                        t.tipo_acceso = $tipo_acceso,
                        t.inspeccionar = $inspeccionar
                `, {
                    id_terraza: idTerraza,
                    local_id: idLocal,
                    tipo_acceso: terraza.desc_tipo_acceso_local || null,
                    inspeccionar: terraza.inspeccionar || false
                });
                
                // Crear relaciones
                await session.run(`
                    MATCH (d:Distrito {nombre: $distrito})
                    MATCH (b:Barrio {nombre: $barrio})
                    MATCH (l:Local {id: $local_id})
                    MATCH (t:Terraza {id: $terraza_id})
                    MERGE (d)-[:CONTIENE]->(b)
                    MERGE (b)-[:TIENE_LOCAL]->(l)
                    MERGE (l)-[:TIENE_TERRAZA]->(t)
                `, {
                    distrito: distrito,
                    barrio: barrio,
                    local_id: idLocal,
                    terraza_id: idTerraza
                });
            }
            
            // Estadísticas del grafo creado
            const statsResult = await session.run(`
                MATCH (d:Distrito) 
                OPTIONAL MATCH (d)-[:CONTIENE]->(b:Barrio)
                OPTIONAL MATCH (b)-[:TIENE_LOCAL]->(l:Local)
                OPTIONAL MATCH (l)-[:TIENE_TERRAZA]->(t:Terraza)
                RETURN COUNT(DISTINCT d) as distritos, COUNT(DISTINCT b) as barrios, 
                       COUNT(DISTINCT l) as locales, COUNT(DISTINCT t) as terrazas
            `);
            
            const stats = statsResult.records[0];
            console.log('ESTADÍSTICAS DEL GRAFO CREADO:');
            console.log(`- Distritos: ${stats.get('distritos')}`);
            console.log(`- Barrios: ${stats.get('barrios')}`);
            console.log(`- Locales: ${stats.get('locales')}`);
            console.log(`- Terrazas: ${stats.get('terrazas')}`);
            console.log('');
            
            // Consultas CQL para visualización
            console.log('CONSULTAS CQL PARA VISUALIZACIÓN:');
            console.log('');
            console.log('1. GRAFO COMPLETO (usar en Neo4J Browser):');
            console.log('MATCH (d:Distrito)-[:CONTIENE]->(b:Barrio)-[:TIENE_LOCAL]->(l:Local)-[:TIENE_TERRAZA]->(t:Terraza)');
            console.log('RETURN d, b, l, t');
            console.log('LIMIT 100');
            console.log('');
            
            console.log('2. LOCALES POR BARRIO CON TIPOS DE TERRAZAS:');
            console.log('MATCH (b:Barrio)-[:TIENE_LOCAL]->(l:Local)-[:TIENE_TERRAZA]->(t:Terraza)');
            console.log('RETURN b.nombre as barrio, COUNT(l) as total_locales, ');
            console.log('       COLLECT(DISTINCT t.tipo_acceso) as tipos_terrazas');
            console.log('ORDER BY total_locales DESC');
            console.log('');
            
            console.log('3. TERRAZAS QUE REQUIEREN INSPECCIÓN:');
            console.log('MATCH (d:Distrito)-[:CONTIENE]->(b:Barrio)-[:TIENE_LOCAL]->(l:Local)-[:TIENE_TERRAZA]->(t:Terraza)');
            console.log('WHERE t.inspeccionar = true');
            console.log('RETURN d, b, l, t');
            console.log('');
            
            console.log('4. DISTRIBUCIÓN POR DISTRITO:');
            console.log('MATCH (d:Distrito)-[:CONTIENE]->(b:Barrio)-[:TIENE_LOCAL]->(l:Local)');
            console.log('RETURN d.nombre as distrito, COUNT(b) as barrios, COUNT(l) as locales');
            console.log('ORDER BY locales DESC');
            console.log('');
            
            // Ejecutar consulta de muestra
            const result = await session.run(`
                MATCH (d:Distrito)-[:CONTIENE]->(b:Barrio)-[:TIENE_LOCAL]->(l:Local)-[:TIENE_TERRAZA]->(t:Terraza)
                RETURN d.nombre as distrito, b.nombre as barrio, l.direccion as direccion, 
                       l.numero as numero, t.tipo_acceso as tipo_acceso, t.inspeccionar as inspeccionar
                LIMIT 10
            `);
            
            console.log('MUESTRA DE DATOS EN GRAFO:');
            result.records.forEach((record, index) => {
                console.log(`${index + 1}. ${record.get('distrito')} -> ${record.get('barrio')} -> Local: ${record.get('direccion')} ${record.get('numero')} -> Terraza: ${record.get('tipo_acceso')} (Inspeccionar: ${record.get('inspeccionar')})`);
            });
            
            // Consulta para tipos de terrazas por barrio
            const tiposResult = await session.run(`
                MATCH (b:Barrio)-[:TIENE_LOCAL]->(l:Local)-[:TIENE_TERRAZA]->(t:Terraza)
                WHERE t.tipo_acceso IS NOT NULL
                RETURN b.nombre as barrio, COUNT(l) as total_locales, 
                       COLLECT(DISTINCT t.tipo_acceso) as tipos_terrazas
                ORDER BY total_locales DESC
                LIMIT 5
            `);
            
            console.log('\nTIPOS DE TERRAZAS POR BARRIO (Top 5):');
            tiposResult.records.forEach((record, index) => {
                const tipos = record.get('tipos_terrazas').filter(t => t !== null);
                console.log(`${index + 1}. ${record.get('barrio')}: ${record.get('total_locales')} locales - Tipos: [${tipos.join(', ')}]`);
            });

            // Generar archivo HTML con visualización
            await this.generarVisualizacionHTML(session);
            
        } finally {
            await session.close();
        }
    }

    /**
     * Generar archivo HTML con visualización del grafo Neo4J
     * @param {Object} session - Sesión de Neo4J
     */
    async generarVisualizacionHTML(session) {
        console.log('\n=== GENERANDO VISUALIZACIÓN HTML ===');
        console.log('Timestamp:', new Date().toISOString());
        
        try {
            // Obtener datos del grafo para visualización
            const result = await session.run(`
                MATCH (d:Distrito)-[:CONTIENE]->(b:Barrio)-[:TIENE_LOCAL]->(l:Local)-[:TIENE_TERRAZA]->(t:Terraza)
                RETURN d.nombre as distrito, b.nombre as barrio, l.numero as numero, 
                       t.tipo_acceso as tipo_acceso, t.inspeccionar as inspeccionar
                LIMIT 50
            `);

            const nodes = [];
            const edges = [];
            const nodeIds = new Set();

            result.records.forEach(record => {
                const distrito = record.get('distrito');
                const barrio = record.get('barrio');
                const numero = record.get('numero') || 'S/N';
                const tipoAcceso = record.get('tipo_acceso') || 'No especificado';
                const inspeccionar = record.get('inspeccionar');

                // Crear nodos únicos
                const distritoId = `distrito_${distrito}`;
                const barrioId = `barrio_${distrito}_${barrio}`;
                const localId = `local_${distrito}_${barrio}_${numero}`;
                const terrazaId = `terraza_${distrito}_${barrio}_${numero}`;

                if (!nodeIds.has(distritoId)) {
                    nodes.push({
                        id: distritoId,
                        label: distrito,
                        color: '#ff6b6b',
                        size: 20,
                        type: 'Distrito'
                    });
                    nodeIds.add(distritoId);
                }

                if (!nodeIds.has(barrioId)) {
                    nodes.push({
                        id: barrioId,
                        label: barrio,
                        color: '#4ecdc4',
                        size: 15,
                        type: 'Barrio'
                    });
                    nodeIds.add(barrioId);
                    edges.push({ from: distritoId, to: barrioId, label: 'CONTIENE' });
                }

                if (!nodeIds.has(localId)) {
                    nodes.push({
                        id: localId,
                        label: `Local ${numero}`,
                        color: '#45b7d1',
                        size: 10,
                        type: 'Local'
                    });
                    nodeIds.add(localId);
                    edges.push({ from: barrioId, to: localId, label: 'TIENE_LOCAL' });
                }

                if (!nodeIds.has(terrazaId)) {
                    nodes.push({
                        id: terrazaId,
                        label: `Terraza ${tipoAcceso}`,
                        color: inspeccionar ? '#ffa726' : '#66bb6a',
                        size: 8,
                        type: 'Terraza'
                    });
                    nodeIds.add(terrazaId);
                    edges.push({ from: localId, to: terrazaId, label: 'TIENE_TERRAZA' });
                }
            });

            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Visualización Grafo Neo4J - Terrazas Madrid</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #network { width: 100%; height: 600px; border: 1px solid #ccc; }
        .info { margin-bottom: 20px; padding: 10px; background: #f5f5f5; }
        .legend { margin-top: 20px; }
        .legend-item { display: inline-block; margin-right: 20px; }
        .legend-color { width: 20px; height: 20px; display: inline-block; margin-right: 5px; }
    </style>
</head>
<body>
    <h1>Visualización del Grafo Neo4J - Terrazas Madrid</h1>
    
    <div class="info">
        <h3>Modelo de Datos:</h3>
        <p><strong>Distrito</strong> → <strong>Barrio</strong> → <strong>Local</strong> → <strong>Terraza</strong></p>
        <p>Total de nodos: ${nodes.length} | Total de relaciones: ${edges.length}</p>
        <p><small>Generado: ${new Date().toLocaleString()}</small></p>
    </div>

    <div id="network"></div>

    <div class="legend">
        <h3>Leyenda:</h3>
        <div class="legend-item">
            <span class="legend-color" style="background-color: #ff6b6b;"></span>
            <span>Distrito</span>
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: #4ecdc4;"></span>
            <span>Barrio</span>
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: #45b7d1;"></span>
            <span>Local</span>
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: #66bb6a;"></span>
            <span>Terraza Normal</span>
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: #ffa726;"></span>
            <span>Terraza a Inspeccionar</span>
        </div>
    </div>

    <script>
        // Prevenir múltiples instancias
        if (window.grafoActual) {
            console.log('Destruyendo grafo anterior');
            window.grafoActual.destroy();
        }
        
        // Generar timestamp único para evitar cache
        const timestamp = new Date().toISOString();
        console.log('Generando grafo único:', timestamp);
        
        const nodes = new vis.DataSet(${JSON.stringify(nodes)});
        const edges = new vis.DataSet(${JSON.stringify(edges)});
        
        const data = { nodes: nodes, edges: edges };
        
        const options = {
            nodes: {
                shape: 'dot',
                font: { size: 12 },
                borderWidth: 2,
                shadow: true
            },
            edges: {
                width: 2,
                color: { color: '#848484' },
                arrows: { to: { enabled: true, scaleFactor: 1 } },
                font: { size: 10 },
                smooth: { type: 'continuous' }
            },
            physics: {
                enabled: true,
                stabilization: { iterations: 200 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };
        
        const container = document.getElementById('network');
        
        // Limpiar contenedor completamente
        container.innerHTML = '';
        
        // Crear nuevo grafo y guardarlo globalmente
        window.grafoActual = new vis.Network(container, data, options);
        
        console.log('Grafo creado exitosamente con', ${nodes.length}, 'nodos y', ${edges.length}, 'relaciones');

        // Información al hacer clic
        window.grafoActual.on('click', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                alert('Tipo: ' + node.type + '\\nNombre: ' + node.label);
            }
        });
    </script>
</body>
</html>`;

            const htmlPath = path.join(__dirname, 'visualizacion_neo4j.html');
            fs.writeFileSync(htmlPath, html);
            console.log(`Visualización HTML generada: ${htmlPath}`);
            console.log('Abrir en navegador para ver el grafo interactivo');

        } catch (error) {
            console.log('Error generando visualización HTML:', error.message);
        }
    }

    /**
     * Mostrar diagrama del modelo Neo4J
     */
    mostrarDiagramaModelo() {
        console.log('\n=== DIAGRAMA DEL MODELO NEO4J ===');
        console.log('');
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│                    MODELO DE DATOS NEO4J                   │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│                                                             │');
        console.log('│  ┌─────────────┐    CONTIENE    ┌─────────────┐            │');
        console.log('│  │  Distrito   │ ──────────────> │   Barrio    │            │');
        console.log('│  │             │                 │             │            │');
        console.log('│  │ - nombre    │                 │ - nombre    │            │');
        console.log('│  │ - codigo    │                 │ - codigo    │            │');
        console.log('│  │ - id        │                 │ - distrito  │            │');
        console.log('│  └─────────────┘                 │ - id        │            │');
        console.log('│                                  └─────────────┘            │');
        console.log('│                                         │                   │');
        console.log('│                                         │ TIENE_LOCAL       │');
        console.log('│                                         ▼                   │');
        console.log('│                                  ┌─────────────┐            │');
        console.log('│                                  │    Local    │            │');
        console.log('│                                  │             │            │');
        console.log('│                                  │ - id        │            │');
        console.log('│                                  │ - direccion │            │');
        console.log('│                                  │ - numero    │            │');
        console.log('│                                  │ - cod_postal│            │');
        console.log('│                                  │ - distrito  │            │');
        console.log('│                                  │ - barrio    │            │');
        console.log('│                                  └─────────────┘            │');
        console.log('│                                         │                   │');
        console.log('│                                         │ TIENE_TERRAZA     │');
        console.log('│                                         ▼                   │');
        console.log('│                                  ┌─────────────┐            │');
        console.log('│                                  │   Terraza   │            │');
        console.log('│                                  │             │            │');
        console.log('│                                  │ - id        │            │');
        console.log('│                                  │ - local_id  │            │');
        console.log('│                                  │ - tipo_acceso│           │');
        console.log('│                                  │ - inspeccionar│          │');
        console.log('│                                  └─────────────┘            │');
        console.log('│                                                             │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log('');
        console.log('DESCRIPCIÓN DEL MODELO:');
        console.log('- Estructura jerárquica que permite visualizar locales por barrio');
        console.log('- Cada terraza está asociada a un local específico');
        console.log('- Los tipos de terrazas se almacenan en el atributo tipo_acceso');
        console.log('- El campo inspeccionar permite filtrar terrazas que requieren revisión');
        console.log('');
        console.log('PROCESO DE CARGA DESDE MONGODB:');
        console.log('1. Conexión a MongoDB colección Madrid.Terrazas');
        console.log('2. Extracción de 2999 documentos de terrazas');
        console.log('3. Creación de nodos Distrito usando desc_distrito_local');
        console.log('4. Creación de nodos Barrio usando desc_barrio_local');
        console.log('5. Creación de nodos Local usando id_local y direcciones');
        console.log('6. Creación de nodos Terraza usando id_terraza y tipo_acceso');
        console.log('7. Establecimiento de relaciones jerárquicas');
        console.log('8. Indexación automática para optimizar consultas');
        console.log('');
    }



    /**
     * Ejecutar actividad completa
     * @returns {Promise<void>}
     */
    async ejecutar() {
        try {
            // Verificaciones iniciales
            if (!this.verificarDependencias()) {
                return;
            }
            
            if (!this.verificarArchivos()) {
                console.log('\n⚠️  Continúa con los archivos disponibles...');
            }
            
            await this.inicializar();

            this.mostrarInstruccionesMonitorizacion();
            
            await this.importarInspections();
            await this.importarCountries();
            await this.exportarInspections();
            this.mostrarInstruccionesRestore();
            
            this.mostrarProcesoCSV();
            await this.cargarTerrazas();
            await this.ejecutarActualizaciones();
            
            this.mostrarDiagramaModelo();
            await this.crearModeloNeo4j();
            
            console.log('\n=== ACTIVIDAD COMPLETADA ===');
            
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            await this.cerrarConexiones();
        }
    }

    /**
     * Cerrar conexiones de forma segura
     * @returns {Promise<void>}
     */
    async cerrarConexiones() {
        if (this.mongoClient) {
            await this.mongoClient.close();
            console.log('Conexión MongoDB cerrada');
        }
        
        if (this.neo4jDriver) {
            await this.neo4jDriver.close();
            console.log('Conexión Neo4J cerrada');
        }
    }
}

// Ejecutar actividad
if (require.main === module) {
    const actividad = new ActividadGrupalBDD();
    actividad.ejecutar().catch(console.error);
}

module.exports = ActividadGrupalBDD; 