export const alarmDefinitions = {
    "Alr001": {
        name: "Envois non réceptionnés après transmission",
        description: "Envois transmis par un établissement (CDD/CTR/BP) vers un autre établissement et non scannés dans un délai de 3 jours.",
        actions: [
            " Intervention immédiate auprès de l établissement récepteur pour vérification et validation de la réception des envois."
        ]
    },
    "Alr002": {
        name: "Envois en attente de distribution",
        description: "Envois réceptionnés au niveau d un établissement (BP ou CDD), sans événement de remise à l’agent de distribution ni échec de distribution dans un délai de 24h.",
        actions: [
            "Rappel immédiat de l établissement concerné pour initier le processus de distribution ou justifier le retard."
        ]
    },
    "Alr003": {
        name: "Accumulation d'envois non scannés",
        description: "Nombre élevé d'envois sans suivi de scan",
        actions: [
            "Vérifier les équipements de scan",
            "Former le personnel sur les procédures",
            "Auditer le processus de scanning"
        ]
    },
    "Alr004": {
        name: "Retards de concentration",
        description: "Les envois tardent à être concentrés",
        actions: [
            "Optimiser les horaires de collecte",
            "Augmenter la fréquence de ramassage",
            "Vérifier la capacité de traitement"
        ]
    },
    "Alr005": {
        name: "Problème douanier",
        description: "Nombre élevé d'envois bloqués en douane",
        actions: [
            "Contacter les services douaniers",
            "Vérifier la conformité des documents",
            "Accélérer le processus de dédouanement"
        ]
    },
    "Alr006": {
        name: "Dépassement délai de garde",
        description: "Trop d'envois dépassent le délai de garde",
        actions: [
            "Améliorer la communication avec les destinataires",
            "Organiser des tournées de relivraison",
            "Mettre à jour les informations de contact"
        ]
    },
    "Alr007": {
        name: "Taux de retour élevé",
        description: "Nombre important d'envois retournés",
        actions: [
            "Analyser les raisons de retour",
            "Améliorer la qualité des adresses",
            "Renforcer le suivi des envois"
        ]
    },
    "Alr008": {
        name: "Performance générale",
        description: "Performance globale de la wilaya en baisse",
        actions: [
            "Faire un audit complet des opérations",
            "Revoir les processus internes",
            "Plan d'amélioration à mettre en place"
        ]
    }
};

export default alarmDefinitions;