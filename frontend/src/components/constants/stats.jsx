fetch('/donnees_algerie.json')
    .then(response => response.json())
    .then(json => {
        const value = json.donnees.kpi["Nombre de dépêches pré-arrivées"];
    })



export const stats = [
    {
        title: "Nombre de dépêches pré-arrivées",
        value: 1,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    },
    {
        title: "Nombre d’envois livrés",
        value: 4265,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 3800 },
            { name: 'Feb', value: 4000 },
            { name: 'Mar', value: 4100 },
            { name: 'Apr', value: 4200 },
            { name: 'May', value: 4265 }
        ]
    },
    {
        title: "Nombre d’envois livrés dès la première tentative",
        value: 648,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 600 },
            { name: 'Feb', value: 580 },
            { name: 'Mar', value: 620 },
            { name: 'Apr', value: 635 },
            { name: 'May', value: 648 }
        ]
    },
    {
        title: "Nombre d’envois non livrés",
        value: 423,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 450 },
            { name: 'Feb', value: 440 },
            { name: 'Mar', value: 430 },
            { name: 'Apr', value: 425 },
            { name: 'May', value: 423 }
        ]
    },
    {
        title: "Taux de livraison",
        value: 1465,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    },
    {
        title: "Taux de livraison dans les délais",
        value: 1465,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    },
    {
        title: "Nombre d’envois en dépassement du délai de garde",
        value: 1465,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    },
    {
        title: "Nombre d’envois bloqués en douane",
        value: 4265,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 3800 },
            { name: 'Feb', value: 4000 },
            { name: 'Mar', value: 4100 },
            { name: 'Apr', value: 4200 },
            { name: 'May', value: 4265 }
        ]
    },
    {
        title: "Nombre d’envois retournés",
        value: 648,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 600 },
            { name: 'Feb', value: 580 },
            { name: 'Mar', value: 620 },
            { name: 'Apr', value: 635 },
            { name: 'May', value: 648 }
        ]
    },
    {
        title: "Délai de concentration",
        value: 423,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 450 },
            { name: 'Feb', value: 440 },
            { name: 'Mar', value: 430 },
            { name: 'Apr', value: 425 },
            { name: 'May', value: 423 }
        ]
    },
    {
        title: "Délai d’acheminement des envois de bout en bout",
        value: 1465,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    },
    {
        title: "Délai de concentration des envois",
        value: 1465,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    },
    {
        title: "Nombre d’envois non scannés",
        value: 1465,
        color: '#2e75e7ff',
        chartData: [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1100 },
            { name: 'Mar', value: 1300 },
            { name: 'Apr', value: 1400 },
            { name: 'May', value: 1465 }
        ]
    }
];

export default stats;