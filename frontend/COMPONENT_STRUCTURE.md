# Delivery Dashboard - Component Structure

This document outlines the new clean component structure for the delivery dashboard application.

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx        # Navigation sidebar component
│   │   ├── Header.jsx         # Top header with search and controls
│   │   └── index.js           # Layout components exports
│   ├── pages/
│   │   ├── DashboardPage.jsx  # Main dashboard page
│   │   ├── DeliveryPage.jsx   # Delivery analysis page
│   │   ├── More15DaysPage.jsx # Packages older than 15 days
│   │   ├── AnomaliesPage.jsx  # Anomalies detection page
│   │   └── index.js           # Page components exports
│   ├── charts/
│   │   ├── PieChart.jsx           # Reusable pie chart component
│   │   ├── BarChart.jsx           # Standard bar chart
│   │   ├── DistributionChart.jsx  # Distribution visualization
│   │   ├── CountryDelivery.jsx    # Country delivery stats
│   │   ├── WillayasChart.jsx      # Willayas horizontal bar chart
│   │   ├── FourEventsBarChart.jsx # Four events bar chart
│   │   ├── FourEventsPieChart.jsx # Four events pie chart
│   │   └── index.js               # Chart components exports
│   ├── ui/
│   │   ├── StatCard.jsx       # Reusable stat card component
│   │   ├── ChartCard.jsx      # Reusable chart container
│   │   └── index.js           # UI components exports
│   └── index.js               # Main components exports
├── styles/
│   └── dashboardStyles.js     # Centralized styles object
├── App.jsx                    # Main application component
└── main.jsx                   # Application entry point
```

## 🏗️ Component Organization

### Layout Components (`/components/layout/`)
- **Sidebar.jsx**: Navigation menu with collapsible anomalies section
- **Header.jsx**: Top header with hamburger menu, page title, search, and download button

### Page Components (`/components/pages/`)
- **DashboardPage.jsx**: Main dashboard with overview statistics and charts
- **DeliveryPage.jsx**: Delivery-specific analytics and metrics
- **More15DaysPage.jsx**: Analysis of packages delayed more than 15 days
- **AnomaliesPage.jsx**: Anomaly detection and reporting

### Chart Components (`/components/charts/`)
- **PieChart.jsx**: Flexible pie chart with legend support
- **BarChart.jsx**: Multi-series bar chart with grid lines
- **DistributionChart.jsx**: Statistical distribution visualization
- **CountryDelivery.jsx**: Country-specific delivery metrics
- **WillayasChart.jsx**: Horizontal bar chart for Algerian willayas
- **FourEventsBarChart.jsx**: Specialized chart for delivery events
- **FourEventsPieChart.jsx**: Pie chart for delivery event distribution

### UI Components (`/components/ui/`)
- **StatCard.jsx**: Reusable card for displaying key statistics
- **ChartCard.jsx**: Container component for charts with titles

## 🎨 Styling

All styles are centralized in `/styles/dashboardStyles.js` to maintain consistency and make global changes easier.

## 🔄 Import/Export Pattern

Each folder has an `index.js` file that exports all components, enabling clean imports:

```javascript
// Instead of multiple imports
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Clean single import
import { Sidebar, Header } from './components/layout';
```

## 🚀 Benefits of This Structure

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Chart and UI components can be easily reused
3. **Maintainability**: Easy to find and modify specific functionality
4. **Scalability**: Simple to add new pages, charts, or UI components
5. **Clean Imports**: Organized exports reduce import clutter
6. **Centralized Styles**: Consistent theming and easy global style changes

## 🔧 Adding New Components

### Adding a New Page:
1. Create the component in `/components/pages/`
2. Add export to `/components/pages/index.js`
3. Import and use in `App.jsx`

### Adding a New Chart:
1. Create the component in `/components/charts/`
2. Add export to `/components/charts/index.js`
3. Import and use in the relevant page component

### Adding UI Components:
1. Create the component in `/components/ui/`
2. Add export to `/components/ui/index.js`
3. Import and use where needed
