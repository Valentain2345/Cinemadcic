// src/seed.js

import { MongoClient } from "mongodb";

const uri = "mongodb+srv://user:DCD-QWeNg1Z0N2cl7ctZ43@fer-dcd.uhrlcun.mongodb.net/";          // source database URI
const targetUri = process.env.MONGO_URI||"mongodb://localhost:27017/moviesdb";    // target database URI

const sourceDbName = "sample_mflix";        // origin DB name
const sourceCollectionName = "movies";      // origin collection

const targetDbName = "moviesdb";              // NEW database name
const targetCollectionName = "movies";      // NEW collection name

async function main() {
  const sourceClient = new MongoClient(uri);
  const targetClient = new MongoClient(targetUri);

  try {
    // ------------------------------
    // CONNECT TO SOURCE
    // ------------------------------
    await sourceClient.connect();
    console.log("✔ Conectado a MongoDB ORIGEN");

    const sourceDb = sourceClient.db(sourceDbName);
    const sourceCollection = sourceDb.collection(sourceCollectionName);

    // List DBs (optional)
    const admin = sourceClient.db().admin();
    const bases = await admin.listDatabases();
    console.log("\n📂 Bases de datos disponibles en ORIGEN:");
    bases.databases.forEach(db => console.log(` - ${db.name}`));

    // ------------------------------
    // READ MOVIES
    // ------------------------------
    console.log("\n🎬 Buscando películas...");
    const peliculas = await sourceCollection.find({}).toArray();

    if (!peliculas.length) {
      console.log("❌ No se encontró ninguna película.");
      return;
    }

    console.log(`✔ ${peliculas.length} películas encontradas`);

    // ------------------------------
    // CONNECT TO TARGET DB
    // ------------------------------
    await targetClient.connect();
    console.log("\n✔ Conectado a MongoDB DESTINO");

    const targetDb = targetClient.db(targetDbName);
    const targetCollection = targetDb.collection(targetCollectionName);

    // Ensure empty collection
    await targetCollection.deleteMany({});
    console.log("🗑 Colección destino limpiada");
    try {
      await targetCollection.dropIndex("id_1");
      console.log("✔ Índice 'id_1' eliminado (para permitir id: null duplicados)");
    } catch (err) {
      if (err.codeName !== 'IndexNotFound') throw err;
    }

    // ------------------------------
    // INSERT MOVIES
    // ------------------------------
    console.log("📥 Insertando películas en la nueva base de datos...");
    await targetCollection.insertMany(peliculas);

    console.log(`\n📦 ${peliculas.length} películas copiadas correctamente.`);

  } catch (error) {
    console.error("❌ Error en el script:", error);
  } finally {
    await sourceClient.close();
    await targetClient.close();
    console.log("\n🔌 Conexiones cerradas.");
  }
}

main();
