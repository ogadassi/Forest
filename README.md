<div dir="rtl">

# Forest | מערכת Web ו-Mobile לניהול משימות

**React & Node.js**

פיתחתי מערכת Full-Stack מתקדמת לניהול משימות, המבוססת על גישת 'קנבס עבודה' גמיש ואינטואיטיבי. המטרה שלי הייתה לשבור את תצוגת הרשימות הליניארית המסורתית ולספק סביבת עבודה ויזואלית ועשירה באמצעות טכנולוגיית Drag-and-Drop. בגרסת ה-Desktop יצרתי דאשבורד מותאם אישית לניהול המשימות הכולל סנכרון נתונים בזמן אמת, בעוד שגרסת ה-Mobile (שנמצאת כרגע בפיתוח) מתוכננת להוות מערכת מלווה (Companion App) שתתממשק מול האתר ותציע תזכורות חכמות מבוססות זמן ומיקום. בפרויקט זה שמתי דגש מיוחד על עיצוב נקי, אחידות רכיבים, ארכיטקטורה יציבה וניהול מאובטח של מסד הנתונים.

</div>

---

# Forest - Task Management System

Forest is a comprehensive Full-Stack Web and Mobile application designed for intuitive, canvas-based task management. It provides a visual and flexible workspace that breaks away from traditional linear to-do lists, allowing users to organize, spatially arrange, and manage tasks on a rich drag-and-drop dashboard.

While the Desktop web version focuses on delivering an expansive, highly customizable visual dashboard for organizing workflow, the accompanying Mobile application (currently in development) acts as an on-the-go companion. It will seamlessly interface with the web platform to offer smart, context-aware reminders based on time and location (Points of Interest).

## ✨ Key Features

- **Flexible Workspace Canvas:** A rich visual dashboard using a drag-and-drop grid system for spatial task organization.
- **Customizable Note Categories & Colors:** Unify visual styles with custom color pickers and background stylings for quick visual scanning.
- **Real-Time Synchronization:** Seamless updates across clients using WebSockets.
- **Responsive Media Support:** Upload and preview images within tasks while preserving aspect ratio.
- **Smart Mobile Companion (In Development):** Time and location-based intelligent reminders synced perfectly with the desktop canvas.

## 🛠️ Tech Stack

**Frontend**

- **React 19 & Vite:** For a highly responsive, fast, and modern UI.
- **Tailwind CSS v4:** For scalable, utility-first styling.
- **React Grid Layout & dnd-kit:** Powering the drag-and-drop, resizable canvas and task cards.
- **Socket.io-client:** Ensuring real-time dashboard updates.

**Backend**

- **Node.js & Express:** Robust REST API architecture handling notes, categories, and file uploads.
- **Prisma ORM:** Type-safe database access and schema management.
- **Socket.io:** Managing WebSocket connections for instant data synchronization.

## 🚀 Project Status: Portfolio Showcase

This repository serves as a portfolio piece demonstrating my skills in building real-time Full-Stack web applications. The application focuses on showcasing complex UI/UX features, customized drag-and-drop mechanics, and WebSocket synchronization.
_Note: The project is currently not configured for public local execution as it intentionally lacks a fully integrated authentication flow for public deployment._

## 🧠 Design Philosophy

Built to solve the clutter of traditional task management, **Forest** was engineered to give users spatial memory of their tasks. By seeing the "big picture" on a 2D canvas, prioritizing and categorizing items becomes a visual and tactile experience, rather than just checking boxes on a list.
