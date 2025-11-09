# AI Rules for Indicae Application

This document outlines the core technologies used in the Indicae application and provides guidelines for using specific libraries and frameworks.

## Tech Stack Description

*   **React**: The application is built using React for its component-based UI architecture.
*   **TypeScript**: All application code is written in TypeScript, ensuring type safety and improving code maintainability.
*   **Tailwind CSS**: Styling is handled exclusively with Tailwind CSS, providing utility-first classes for rapid and consistent UI development.
*   **Supabase**: Used as the backend-as-a-service for authentication, user profiles, connection management, and real-time messaging.
*   **Vite**: The project uses Vite as its build tool, offering a fast development experience.
*   **react-hot-toast**: A lightweight and highly customizable library for displaying toast notifications.
*   **Custom Screen Management**: The application uses a custom state-based system for screen navigation, rather than a dedicated routing library like React Router.
*   **Custom Icons**: Icons are currently implemented using inline SVGs defined in `src/constants.tsx`.
*   **shadcn/ui & Radix UI**: These libraries are available for building accessible and customizable UI components, though not yet extensively used in the existing codebase.

## Library Usage Rules

*   **UI Components & Styling**:
    *   **Tailwind CSS**: Always use Tailwind CSS classes for all styling. Avoid inline styles or separate CSS files unless absolutely necessary for global styles (e.g., `index.css`).
    *   **shadcn/ui & Radix UI**: For new UI components, prioritize using `shadcn/ui` components. If a specific component is not available in `shadcn/ui`, consider building it using `Radix UI` primitives or creating a custom component with Tailwind CSS. Do not modify existing `shadcn/ui` component files directly; create new components if customization is needed.
*   **State Management**:
    *   **React Hooks**: Use `useState`, `useEffect`, `useCallback`, etc., for local component state and managing side effects.
    *   **Supabase**: For persistent data (user profiles, connections, messages), always interact with Supabase. Ensure data fetching, creation, updates, and deletions go through the Supabase client.
*   **Routing/Navigation**:
    *   **Custom Screen Management**: Continue to use the existing `history` state and `renderScreen` logic in `App.tsx` for navigating between different application screens. Do not introduce `react-router-dom` or similar libraries.
*   **Notifications**:
    *   **react-hot-toast**: Use `react-hot-toast` for all user feedback notifications (success, error, loading, warning messages).
*   **Icons**:
    *   **Custom SVG Icons**: Continue to use the `icons` object from `src/constants.tsx` for existing icons.
    *   **lucide-react**: If new icons are required and not available in `src/constants.tsx`, use icons from the `lucide-react` library.
*   **Database & Authentication**:
    *   **Supabase**: All authentication flows (login, registration, logout) and database operations must use the `supabase` client from `src/integrations/supabase/client.ts`.
*   **File Structure**:
    *   **Components**: Place all reusable UI components in `src/components/`.
    *   **Pages**: Place top-level screen components in `src/pages/`.
    *   **Utilities/Constants**: Place utility functions and constants in `src/constants.tsx` or other appropriate `src/utils/` files.
    *   **Integrations**: Keep Supabase client configuration in `src/integrations/supabase/client.ts`.