const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const { MongoClient } = require('mongodb');
const natural = require('natural'); // Importer la bibliothèque Natural
require('dotenv').config();

// Création du serveur Express
const app = express();
const port = process.env.PORT || 3978;
app.use(express.json()); // Pour gérer les requêtes JSON

// Configuration de l'adaptateur Bot Framework
const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID || '',
    appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
});

// Ajouter une configuration pour ignorer l'authentification en local
adapter.useBotFrameworkEmulator = true;

// Connexion à MongoDB
const client = new MongoClient(process.env.MONGO_URI);

let db;
client.connect()
    .then(() => {
        db = client.db('chatbot');  // Assure-toi que c'est le bon nom de la base de données
        console.log('Connecté à la base de données MongoDB.');
    })
    .catch(error => {
        console.error('Erreur de connexion à MongoDB:', error);
    });

// Fonction pour trouver la question la plus similaire
async function findBestMatch(userQuestion) {
    const threshold = 0.6; // Seuil de similarité minimum
    const questions = await db.collection('chatbot_response').find().toArray();

    let bestMatch = null;
    let highestScore = 0;

    // Parcourir toutes les questions en base et calculer la similarité
    for (const qa of questions) {
        const score = natural.JaroWinklerDistance(userQuestion, qa.question);
        if (score > threshold && score > highestScore) {
            highestScore = score;
            bestMatch = qa;
        }
    }

    return bestMatch ? bestMatch.answer : null;
}

// Définition de l'endpoint pour recevoir les messages
app.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            try {
                const userMessage = context.activity.text;
                console.log('Message reçu de l’utilisateur :', userMessage);

                // Trouver la meilleure correspondance pour la question de l'utilisateur
                const answer = await findBestMatch(userMessage);

                const message = answer ? answer : "Désolé, je n'ai pas de réponse pour cette question.";
                console.log('Message envoyé par le bot :', message);

                await context.sendActivity(message);
            } catch (error) {
                console.error('Erreur de requête MongoDB:', error);
                await context.sendActivity("Désolé, une erreur est survenue lors de la récupération des données.");
            }
        } else {
            await context.sendActivity(`[${context.activity.type} event detected]`);
        }
    });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`\nBot is listening on http://localhost:${port}`);
});
