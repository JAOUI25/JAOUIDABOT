const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongo() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db('chatbot');  // Assure-toi que c'est le bon nom de la base de données
        const collection = db.collection('chatbot_response');
        
        const question = "Combien de sites existant en france ?";
        const response = await collection.findOne({ question: new RegExp(`^${question}$`, 'i') });

        if (response) {
            console.log("Réponse trouvée :", response.answer);
        } else {
            console.log("Aucune réponse trouvée pour cette question.");
        }
    } catch (error) {
        console.error('Erreur de requête MongoDB:', error);
    } finally {
        await client.close();
    }
}

testMongo();
