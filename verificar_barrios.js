const { MongoClient } = require('mongodb');

async function verificarBarrios() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('Madrid');
    const collection = db.collection('Terrazas');
    
    // Contar barrios únicos en toda la base de datos
    const barrios = await collection.distinct('desc_barrio_local');
    console.log('=== BARRIOS EN TODA LA BASE DE DATOS ===');
    console.log('Total de barrios únicos:', barrios.length);
    console.log('Primeros 10 barrios:');
    barrios.slice(0, 10).forEach((barrio, i) => console.log(`${i+1}. ${barrio}`));
    
    // Verificar barrios en muestra de 50 registros (mismo que la visualización)
    const muestra = await collection.find({}).limit(50).toArray();
    const barriosMuestra = [...new Set(muestra.map(t => t.desc_barrio_local))];
    console.log('\n=== BARRIOS EN MUESTRA DE 50 REGISTROS ===');
    console.log('Barrios en muestra de 50 registros:', barriosMuestra.length);
    barriosMuestra.forEach((barrio, i) => console.log(`${i+1}. ${barrio}`));
    
    // Verificar distribución por distrito
    console.log('\n=== DISTRIBUCIÓN POR DISTRITO ===');
    const pipeline = [
        {
            $group: {
                _id: {
                    distrito: '$desc_distrito_local',
                    barrio: '$desc_barrio_local'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.distrito',
                barrios: {
                    $push: {
                        barrio: '$_id.barrio',
                        count: '$count'
                    }
                },
                total_barrios: { $sum: 1 }
            }
        },
        { $sort: { total_barrios: -1 } },
        { $limit: 5 }
    ];
    
    const distribucion = await collection.aggregate(pipeline).toArray();
    distribucion.forEach(distrito => {
        console.log(`\n${distrito._id}: ${distrito.total_barrios} barrios`);
        distrito.barrios.slice(0, 3).forEach(b => {
            console.log(`  - ${b.barrio}: ${b.count} terrazas`);
        });
    });
    
    await client.close();
}

verificarBarrios().catch(console.error); 