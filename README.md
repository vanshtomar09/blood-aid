<div align="center">

# 🩸 BloodAid

A full-stack blood bank management platform built with Next.js, Google Genkit, and Leaflet that helps donors, recipients, and hospitals discover blood banks, manage inventory, and forecast blood demand.

<p>
  <a href="https://blood-aid-ukdm.vercel.app/"><strong>🌐 Live Demo</strong></a> •
  <a href="https://github.com/vanshtomar09/blood-aid"><strong>📦 Repository</strong></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Genkit-Google-blue" />
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4" />
  <img src="https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white" />
</p>

</div>

---

# Overview

Finding compatible blood quickly can be difficult because information is often scattered across hospitals and blood banks. BloodAid brings donors, recipients, and healthcare providers onto a single platform to simplify discovery, emergency requests, and inventory management.

For hospital staff, the platform also provides inventory management and an AI-based demand forecasting tool to help anticipate blood shortages.

The project was built to explore modern full-stack development with the Next.js App Router, AI integration through Google Genkit, and interactive geospatial experiences using Leaflet.

> **Note**
>
> This project currently uses mock data that mirrors a Firestore database structure. The architecture is designed so it can be migrated to Firebase Firestore with minimal changes.

---

# Features

### Public Users

- Search nearby blood banks
- Discover blood banks on an interactive map
- Submit emergency blood requests
- Register as a blood donor
- Get donation guidance through an AI health assistant
- View nearby donation camps

### Hospital Staff

- Manage blood inventory
- Monitor urgent blood requests
- View operational dashboard
- Forecast blood demand using AI
- Visualize inventory data

---

# AI Features

### AI Health Assistant

Built using **Google Genkit** and **Gemini 2.5 Flash**, the chatbot answers blood donation questions, provides first-aid guidance, and explains donation eligibility while following safety-focused prompts.

### Demand Forecasting

Staff can submit historical demand data to receive AI-generated predictions and inventory recommendations, helping blood banks prepare for future demand.

---

# Why this architecture?

BloodAid uses the **Next.js App Router** to keep routing, layouts, and server-side logic within a single framework.

- **Server Actions** handle AI workflows securely without exposing API keys.
- **React Context** manages lightweight shared state such as user location, search queries, and user type.
- **Dynamic imports** are used for Leaflet components to avoid server-side rendering issues and improve performance.

---

# Tech Stack

| Technology | Why it was used |
|------------|-----------------|
| Next.js 14 | App Router and Server Actions |
| React 18 | Component-based UI |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| ShadCN UI | Accessible UI components |
| Google Genkit | AI workflow management |
| Gemini 2.5 Flash | Medical assistant and demand forecasting |
| Leaflet + React Leaflet | Interactive maps |
| React Hook Form | Form state management |
| Zod | Form and AI response validation |
| Recharts | Dashboard visualizations |

---

# Project Structure

```text
src/
├── ai/             # Genkit flows
├── app/            # Next.js App Router
├── components/     # Reusable UI components
├── context/        # Global state
├── hooks/          # Custom hooks
├── lib/            # Utilities, types and mock data
└── firebase/       # Firebase scaffolding
```

---

# Running Locally

Clone the repository

```bash
git clone https://github.com/vanshtomar09/blood-aid.git
```

Move into the project

```bash
cd blood-aid
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
GEMINI_API_KEY=your_api_key
```

Start the development server

```bash
npm run dev
```

Build for production

```bash
npm run build
```

---

## Screenshots

>Coming soon


---

# Current Limitations

- Uses mock data instead of a live Firestore database.
- Authentication screens are implemented but Firebase Authentication is not yet connected.
- SMS and push notifications are not yet implemented.

---

# Roadmap

- [ ] Firebase Authentication
- [ ] Firestore integration
- [ ] Real-time inventory updates
- [ ] SMS and push notifications
- [ ] Veterinary blood donation support

---

## Feedback

If you have suggestions or feedback, feel free to open an issue or reach out.

If you found the project useful, consider giving it a ⭐ on GitHub.