# AI Rules for Indicai Application

This document outlines the core technologies and development guidelines for the Indicai application, intended to ensure consistency, maintainability, and adherence to best practices.

## Tech Stack Overview

*   **Frontend Framework**: React for building dynamic user interfaces.
*   **Language**: TypeScript for type safety and improved code quality.
*   **Styling**: Tailwind CSS for utility-first CSS styling, ensuring responsive and consistent designs.
*   **UI Components**: Shadcn/ui and Radix UI for accessible and customizable UI components.
*   **Icons**: Lucide React for a comprehensive set of SVG icons.
*   **Backend & Database**: Supabase for authentication, real-time database, and backend services.
*   **Toast Notifications**: React Hot Toast for simple and effective user notifications.
*   **Build Tool**: Vite for a fast development experience and optimized builds.
*   **Routing**: React Router for managing navigation within the single-page application.

## Library Usage Rules

To maintain a clean and efficient codebase, please adhere to the following rules when using libraries:

*   **React**: Use React for all UI development. Leverage functional components and React Hooks for state management and side effects.
*   **TypeScript**: All new files and modifications must be written in TypeScript. Ensure proper typing for all props, states, and functions.
*   **Tailwind CSS**: All styling should be implemented using Tailwind CSS utility classes. Avoid custom CSS files or inline styles unless absolutely necessary and justified.
*   **Shadcn/ui & Radix UI**: Prioritize using components from Shadcn/ui and Radix UI for common UI elements (e.g., buttons, forms, modals). If a component needs customization beyond what's offered, create a new component that wraps or extends the existing one, rather than modifying the library's source files.
*   **Lucide React**: Use `lucide-react` for all icons. Import icons directly from the library instead of using raw SVG paths.
*   **React Router**: Manage application navigation using React Router. All primary routes should be defined and handled within `src/App.tsx`.
*   **Supabase**: All interactions with the backend, including user authentication, database queries, and real-time subscriptions, must be done through the Supabase client.
*   **React Hot Toast**: Use `react-hot-toast` for all transient user feedback (e.g., success messages, error alerts, loading indicators).
*   **File Structure**:
    *   Place all page components in `src/pages/`.
    *   Place all reusable UI components in `src/components/`.
    *   Each new component or hook should reside in its own dedicated file.
    *   Directory names must be all lowercase.