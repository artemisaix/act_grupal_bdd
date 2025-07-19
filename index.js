// ====================================================================
// CONFIGURACIÓN DE CONEXIONES MONGODB
// ====================================================================
const { MongoClient } = require('mongodb');

// Configurar URIs y credenciales locales
const mongoUri = 'mongodb://localhost:27017';
const mongoDbName = 'Madrid';
const mongoCollection = 'Terrazas';

// Inicialización de clientes
const mongoClient = new MongoClient(mongoUri);

// ====================================================================
// CONFIGURACIÓN DE CONEXIONES NEO4J
// ====================================================================
const neo4j = require('neo4j-driver');
const neo4jUri = 'neo4j://localhost:7687';   // Cambia si tu instancia es diferente
const neo4jUser = 'neo4j';
const neo4jPassword = 'Password';            // Cambia si tienes otra contraseña
const neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
// ----------------------------
// Función para ejecutar actualizaciones en MongoDB
// ----------------------------
async function ejecutarActualizaciones(collection, db) {
    console.log("🚀 Iniciando actualizaciones en MongoDB...\n");

    // =======================LITERAL 1=========================================================
    // 1. Cerrar locales de Guindalera
    console.log("📋 1. Cerrando locales de Guindalera...");
    await collection.updateMany(
        { desc_barrio_local: "GUINDALERA", desc_distrito_local: "SALAMANCA" },
        { $set: { desc_situacion_local: "Cerrado", desc_situacion_terraza: "Cerrada" } }
    );
    const guindalera = await collection.find({ 
        desc_barrio_local: "GUINDALERA", 
        desc_distrito_local: "SALAMANCA" 
    }).limit(1).toArray();
    console.log("✅ Locales de Guindalera actualizados:");
    console.log(JSON.stringify(guindalera, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 2=========================================================
    // 2. Añadir campo inspeccionar a terrazas en acera
    console.log("📋 2. Añadiendo campo inspeccionar a terrazas en acera...");
    // A las terrazas con más de 10 mesas → inspeccionar: true
    await collection.updateMany(
        { desc_ubicacion_terraza: "Acera", mesas_es: { $gt: 10 } },
        { $set: { inspeccionar: true } }
    );
    // A las terrazas con 10 o menos mesas → inspeccionar: false
    await collection.updateMany(
        { desc_ubicacion_terraza: "Acera", mesas_es: { $lte: 10 } },
        { $set: { inspeccionar: false } }
    );
    const acera = await collection.find({ desc_ubicacion_terraza: "Acera" }).limit(1).toArray();
    console.log("✅ Terrazas en acera con campo inspeccionar:");
    console.log(JSON.stringify(acera, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");
    
    // =======================LITERAL 3=========================================================
    // 3. Añadir 2 mesas auxiliares y 8 sillas a terrazas que se inspeccionan
    console.log("📋 3. Normalizando datos y añadiendo mesas/sillas a terrazas inspeccionadas...");
    
    // Paso 1: Normalizar campos no numéricos a 0 (string, object, null, undefined)
    console.log("   - Normalizando campos mesas_aux_ra...");
    await collection.updateMany(
        { $or: [
            { mesas_aux_ra: { $type: "string" } },
            { mesas_aux_ra: { $type: "object" } },
            { mesas_aux_ra: { $type: "null" } },
            { mesas_aux_ra: { $exists: false } }
        ]},
        { $set: { mesas_aux_ra: 0 } }
    );
    
    console.log("   - Normalizando campos mesas_aux_es...");
    await collection.updateMany(
        { $or: [
            { mesas_aux_es: { $type: "string" } },
            { mesas_aux_es: { $type: "object" } },
            { mesas_aux_es: { $type: "null" } },
            { mesas_aux_es: { $exists: false } }
        ]},
        { $set: { mesas_aux_es: 0 } }
    );
    
    console.log("   - Normalizando campos sillas_ra...");
    await collection.updateMany(
        { $or: [
            { sillas_ra: { $type: "string" } },
            { sillas_ra: { $type: "object" } },
            { sillas_ra: { $type: "null" } },
            { sillas_ra: { $exists: false } }
        ]},
        { $set: { sillas_ra: 0 } }
    );
    
    console.log("   - Normalizando campos sillas_es...");
    await collection.updateMany(
        { $or: [
            { sillas_es: { $type: "string" } },
            { sillas_es: { $type: "object" } },
            { sillas_es: { $type: "null" } },
            { sillas_es: { $exists: false } }
        ]},
        { $set: { sillas_es: 0 } }
    );
    
    // Paso 2: Incrementar mesas auxiliares y sillas
    console.log("   - Incrementando mesas auxiliares y sillas...");
    await collection.updateMany(
        { inspeccionar: true },
        {
            $inc: {
                mesas_aux_es: 2,
                mesas_aux_ra: 2,
                sillas_es: 8,
                sillas_ra: 8
            }
        }
    );
    const inspeccionadas = await collection.find({ inspeccionar: true }).limit(1).toArray();
    console.log("✅ Terrazas inspeccionadas con mesas auxiliares y sillas añadidas:");
    console.log(JSON.stringify(inspeccionadas, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");
    
    // =======================LITERAL 4=========================================================
    // 4. Añadir campo estado a terrazas NO inspeccionadas
    console.log("📋 4. Añadiendo campo estado a terrazas NO inspeccionadas...");
    
    // Menos de 10 sillas → estado: 1
    await collection.updateMany(
        { inspeccionar: false, sillas_es: { $lt: 10 } },
        { $set: { estado: 1 } }
    );
    
    // Entre 10 y 20 sillas → estado: 2
    await collection.updateMany(
        { inspeccionar: false, sillas_es: { $gte: 10, $lte: 20 } },
        { $set: { estado: 2 } }
    );
    
    // Más de 20 sillas → estado: 3
    await collection.updateMany(
        { inspeccionar: false, sillas_es: { $gt: 20 } },
        { $set: { estado: 3 } }
    );
    
    const noInspeccionadas = await collection.find({ inspeccionar: false }).limit(1).toArray();
    console.log("✅ Terrazas NO inspeccionadas con campo estado:");
    console.log(JSON.stringify(noInspeccionadas, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 5=========================================================
    // 5. Actualizar horarios de cierre lunes-jueves máximo 00:00:00
    console.log("📋 5. Actualizando horarios lunes-jueves máximo 00:00:00...");
    
    // Cambiar hora de cierre estacional
    await collection.updateMany(
        { hora_fin_LJ_es: { $gt: "00:00:00" } },
        { $set: { hora_fin_LJ_es: "00:00:00" } }
    );
    
    // Cambiar hora de cierre resto del año
    await collection.updateMany(
        { hora_fin_LJ_ra: { $gt: "00:00:00" } },
        { $set: { hora_fin_LJ_ra: "00:00:00" } }
    );
    
    const horarios1 = await collection.find({ 
        hora_fin_LJ_es: "00:00:00"
    }).limit(1).toArray();
    console.log("✅ Horarios lunes-jueves actualizados a 00:00:00:");
    console.log(JSON.stringify(horarios1, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 6=========================================================
    // 6. Actualizar horarios viernes-sábado de 02:30:00 a 02:00:00
    console.log("📋 6. Actualizando horarios viernes-sábado de 02:30:00 a 02:00:00...");
    
    // Cambiar hora de cierre estacional
    await collection.updateMany(
        { hora_fin_VS_es: "2:30:00" },
        { $set: { hora_fin_VS_es: "2:00:00" } }
    );
    
    // Cambiar hora de cierre resto del año
    await collection.updateMany(
        { hora_fin_VS_ra: "2:30:00" },
        { $set: { hora_fin_VS_ra: "2:00:00" } }
    );
    
    const horarios2 = await collection.find({ 
        hora_fin_VS_es: "2:00:00"
    }).limit(1).toArray();
    console.log("✅ Horarios viernes-sábado actualizados a 02:00:00:");
    console.log(JSON.stringify(horarios2, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 7=========================================================
    // 7. Inspeccionar locales ubicados en calle Alcalá
    console.log("📋 7. Marcando para inspección locales en calle ALCALA...");
    await collection.updateMany(
        { "DESC_NOMBRE": "ALCALA" },
        { $set: { inspeccionar: true } }
    );
    const alcala = await collection.find({ "DESC_NOMBRE": "ALCALA" }).limit(1).toArray();
    console.log("✅ Locales en calle ALCALA marcados para inspección:");
    console.log(JSON.stringify(alcala, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 8=========================================================
    // 8. Añadir campo revisión a terrazas abiertas
    console.log("📋 8. Añadiendo campo revisión a terrazas abiertas...");
    await collection.updateMany(
        { desc_situacion_terraza: "Abierta" },
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
    const abiertas = await collection.find({ desc_situacion_terraza: "Abierta" }).limit(1).toArray();
    console.log("✅ Terrazas abiertas con campo revisión:");
    console.log(JSON.stringify(abiertas, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 9=========================================================
    // 9. Crear colección Zona1 con distrito Villaverde
    console.log("📋 9. Creando colección Zona1 con distrito Villaverde...");
    await collection.aggregate([
        { $match: { desc_distrito_local: "VILLAVERDE" } },
        { $out: "Zona1" }
    ]).toArray();
    
    const zona1Sample = await db.collection("Zona1").find({}).limit(1).toArray();
    const zona1Count = await db.collection("Zona1").countDocuments();
    console.log("✅ Colección Zona1 creada con", zona1Count, "documentos:");
    console.log(JSON.stringify(zona1Sample, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    // =======================LITERAL 10========================================================
    // 10. Crear colección Zona2 con Salamanca-Castellana
    console.log("📋 10. Creando colección Zona2 con Salamanca-Castellana...");
    await collection.aggregate([
        {
            $match: {
                desc_distrito_local: "SALAMANCA",
                desc_barrio_local: "CASTELLANA"
            }
        },
        { $out: "Zona2" }
    ]).toArray();
    
    const zona2Sample = await db.collection("Zona2").find({}).limit(1).toArray();
    const zona2Count = await db.collection("Zona2").countDocuments();
    console.log("✅ Colección Zona2 creada con", zona2Count, "documentos:");
    console.log(JSON.stringify(zona2Sample, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    console.log("🎉 Todas las 10 actualizaciones de MongoDB completadas correctamente!");
}
// ====================================================================
// PARTE 2: MIGRACIÓN DE DATOS A NEO4J
// ====================================================================
async function migrarDatosANeo4j(collection) {
    console.log("\n--- FASE 2: MIGRANDO DATOS A NEO4J ---");
    const session = neo4jDriver.session();

    try {
        console.log("🧹 Limpiando base de datos Neo4j...");
        await session.run(`MATCH (n) DETACH DELETE n`);
        console.log("✅ Base de datos de Neo4j limpia.");

        const docs = await collection.find({}).limit(20).toArray();
        console.log(`🔄 Migrando ${docs.length} registros al grafo...`);

        for (const doc of docs) {
            const idLocal = doc._id.toString();
            const nombreLocal = doc.DESC_NOMBRE || "Sin Nombre";
            const distrito = doc.desc_distrito_local || "Sin Distrito";
            const barrio = doc.desc_barrio_local || "Sin Barrio";
            const situacionLocal = doc.desc_situacion_local || "Sin Situación";
            const mesas = doc.mesas_es || 0;
            const sillas = doc.sillas_es || 0;
            const ubicacion = doc.desc_ubicacion_terraza || "Sin Ubicación";

            // Nodo Local y relaciones con Barrio y Distrito
            await session.run(`
                MERGE (l:Local {id: $id})
                SET l.nombre = $nombre, l.situacion = $situacion
                MERGE (b:Barrio {nombre: $barrio})
                MERGE (d:Distrito {nombre: $distrito})
                MERGE (b)-[:PERTENECE_A]->(d)
                MERGE (l)-[:UBICADO_EN]->(b)
            `, { id: idLocal, nombre: nombreLocal, situacion: situacionLocal, barrio: barrio, distrito: distrito });

            // Nodo Terraza y relación con Local
            await session.run(`
                MERGE (t:Terraza {id: $id})
                SET t.mesas = $mesas, t.sillas = $sillas, t.ubicacion = $ubicacion
                MERGE (l:Local {id: $id})
                MERGE (l)-[:TIENE_TERRAZA]->(t)
            `, { id: idLocal, mesas: mesas, sillas: sillas, ubicacion: ubicacion });
        }

        console.log("✅ Datos cargados en Neo4j.");

        // Mostrar algunas relaciones creadas
        console.log("\n📌 Relaciones creadas:");
        const result = await session.run(`
            MATCH (l:Local)-[:UBICADO_EN]->(b:Barrio)-[:PERTENECE_A]->(d:Distrito)
            RETURN l.nombre AS local, b.nombre AS barrio, d.nombre AS distrito
            LIMIT 5
        `);

        result.records.forEach(r => {
            console.log(`- ${r.get('local')} está ubicado en '${r.get('barrio')}' que pertenece al distrito '${r.get('distrito')}'`);
        });

                 console.log("🎯 Migración de datos a Neo4j completada.");
         
         // Mostrar instrucciones para visualizar el grafo
         console.log("\n" + "=".repeat(80));
         console.log("📊 INSTRUCCIONES PARA VISUALIZAR EL GRAFO EN NEO4J BROWSER");
         console.log("=".repeat(80));
         console.log("1. 🌐 Abrir Neo4j Browser en: http://localhost:7474");
         console.log("2. 🔑 Iniciar sesión con credenciales:");
         console.log("   - Usuario: neo4j");
         console.log("   - Contraseña: Password (o la que hayas configurado)");
         console.log("\n3. 🔍 Consultas útiles para visualizar:");
         console.log("\n   📌 Ver todos los nodos y relaciones:");
         console.log("   MATCH (n) RETURN n LIMIT 25");
         console.log("\n   📌 Ver relaciones Local-Barrio-Distrito:");
         console.log("   MATCH (l:Local)-[:UBICADO_EN]->(b:Barrio)-[:PERTENECE_A]->(d:Distrito)");
         console.log("   RETURN l, b, d LIMIT 10");
         console.log("\n   📌 Ver locales con sus terrazas:");
         console.log("   MATCH (l:Local)-[:TIENE_TERRAZA]->(t:Terraza)");
         console.log("   RETURN l.nombre, t.mesas, t.sillas LIMIT 10");
         console.log("\n   📌 Análisis por distrito:");
         console.log("   MATCH (d:Distrito)<-[:PERTENECE_A]-(b:Barrio)<-[:UBICADO_EN]-(l:Local)");
         console.log("   RETURN d.nombre, COUNT(l) as total_locales");
         console.log("   ORDER BY total_locales DESC");
         console.log("\n   📌 Visualizar grafo completo:");
         console.log("   MATCH (n)-[r]->(m) RETURN n, r, m");
         console.log("\n4. 🎨 Tips para mejor visualización:");
         console.log("   - Usar el botón 'Graph' para vista de grafo");
         console.log("   - Hacer clic en nodos para expandir relaciones");
         console.log("   - Usar zoom y arrastrar para navegar");
         console.log("   - Cambiar colores en el panel de estilos");
         console.log("=".repeat(80));
         
     } catch (err) {
         console.error("❌ Error migrando a Neo4j:", err);
     } finally {
         await session.close();
     }
}

// ====================================================================
// FUNCIÓN PRINCIPAL
// ====================================================================
async function main() {
    try {
        console.log("🔗 Conectando a MongoDB...");
        await mongoClient.connect();
        const db = mongoClient.db(mongoDbName);
        const collection = db.collection(mongoCollection);
        console.log("✅ Conectado a MongoDB!\n");

        // Ejecutar parte MongoDB
        await ejecutarActualizaciones(collection, db);

        // Ejecutar parte Neo4j
        await migrarDatosANeo4j(collection);

        console.log("\n🎯 Script completo ejecutado correctamente!");
    } catch (err) {
        console.error("❌ Error general:", err);
    } finally {
        await mongoClient.close();
        await neo4jDriver.close();
        console.log("🔌 Conexiones cerradas.");
    }
}

main();