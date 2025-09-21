# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InCloud is a cloud-based inventory management system for J.A's Food Trading, a frozen food distributor with 3 branches in Sampaloc, Manila. The system consists of:

- **Web Application** (this repository): Next.js-based admin interface for business operations
- **Mobile Application**: Flutter app for customers (separate repository)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Turbopack (enabled by default)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes (login, signup, homepage)
│   ├── globals.css        # Global styles and Tailwind
│   └── layout.tsx         # Root layout with metadata
├── components/
│   ├── layout/            # Header, Footer components
│   └── ui/                # Reusable UI components (Button, Card, Input, etc.)
```

## Architecture Patterns

- **Route Groups**: Uses `(public)` group for unauthenticated pages
- **Component Organization**: Separated into `layout/` and `ui/` directories
- **TypeScript Paths**: `@/*` alias points to `src/*`
- **Form Handling**: React Hook Form + Zod for validation
- **Styling**: Utility-first with Tailwind CSS

## Brand Guidelines

Based on J.A's Food Trading logo colors:
- **Primary Red**: Deep crimson for headers, primary buttons
- **Primary Blue**: Deep blue for text, links, secondary elements
- **White**: Clean backgrounds, cards
- **Gold Accent**: Subtle borders, highlights
- **Supporting Neutrals**: Light/medium grays

## User Roles & Features

### Admin (Web App)
- Product inventory management
- Customer order processing
- Pricing adjustments (wholesale/retail/box)
- Expiration date tracking
- Analytics reports and alerts
- User credential management

### Super Admin (Web App)
- All Admin features
- User role management
- System-wide data management

### Customer (Mobile App)
- Product browsing
- Order placement and tracking
- Transaction history
- Account management

## Key Functional Requirements

- **Real-time synchronization** between web and mobile platforms
- **Multi-branch inventory** coordination
- **Analytics**: Descriptive (trends/charts) and Prescriptive (AI recommendations)
- **Alert system** for low stock and expiring products
- **Role-based access control**
- **Audit logging** for security and accountability

## Integration Notes

- **Supabase Backend**: All data operations go through Supabase
- **Authentication**: Supabase Auth with role-based permissions
- **Real-time Updates**: Supabase Realtime for live inventory sync
- **File Storage**: Supabase Storage for product images
- **Database**: PostgreSQL with Row Level Security policies