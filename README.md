# Flux CRM - Service Center Management System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

A complete, production-ready CRM web application built specifically for service centers. It features role-based access control for managers and employees, alongside a smart token-based form submission system.

## Features

### Authentication & Authorization
- **Role-Based Access**: Automatic routing based on user role (`owner`, `manager`, or `employee`).
- **Secure Sessions**: Managed by Supabase Auth with automatic token refresh.
- **Normalized Roles**: Role permissions are managed via a dedicated PostgreSQL reference table to ensure scalability.

### Manager & Owner Capabilities
- **Employee Management**: Add or remove employee access.
- **Data Access**: View ALL entries from ALL employees across ALL days.
- **Analytics Dashboard**: Real-time business statistics, filtering, and insights.
- **Data Export**: Export filtered service data directly to CSV.

### Smart Token System
- **Encoded Token IDs**: Tokens use the format `FLX-[Base64EncodedData]` to encode payload data directly into the ID.
- **Instant Client-Side Validation**: Tokens can be decoded instantly on the client side (extracting customer name and phone) without requiring a database round-trip.
- **State Tracking**: Tokens maintain Active, Used, or Cancelled states.
- **Auto-fill**: Customer details automatically populate from valid tokens during data entry.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Forms & Validation**: React Hook Form, Zod
- **UI Components**: Lucide React, @tanstack/react-table
- **Backend & Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Security**: Row Level Security (RLS) for automatic, database-level data filtering.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (the free tier is sufficient)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <URL>
cd flux-crm
npm install
