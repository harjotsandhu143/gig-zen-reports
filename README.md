# Gig Zen Reports

A comprehensive financial reporting and tax calculation tool for gig economy workers and independent contractors. Simplify tax filing, track earnings across multiple platforms, and generate detailed financial reports with ease.

## Overview

Gig Zen Reports is designed to help gig workers (delivery drivers, ride-share drivers, freelancers, etc.) manage their finances efficiently. The application automatically calculates tax obligations, categorizes expenses, and generates professional reports for tax filing purposes.

## Features

✨ **Multi-Platform Support**
- Track earnings from Uber Eats, DiDi, and other gig platforms
- Support for multiple income streams

📊 **Financial Analytics**
- Automatic tax calculations based on Australian tax regulations
- Expense tracking and categorization
- Income vs. expense reports
- Tax liability estimations

📄 **Report Generation**
- Generate PDF reports for tax filing
- Monthly and quarterly summaries
- Exportable financial statements

🔒 **Data Management**
- Secure data storage with Supabase
- User authentication and authorization
- Real-time data synchronization

## Tech Stack

- **Frontend**: React with Vite for fast development and optimized builds
- **Styling**: Tailwind CSS + shadcn-ui for beautiful, accessible UI components
- **Language**: TypeScript for type-safe development
- **Backend**: Supabase (PostgreSQL) for database and real-time features
- **PDF Generation**: jsPDF for creating downloadable reports
- **Build Tool**: Vite for lightning-fast development

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harjotsandhu143/gig-zen-reports.git
   cd gig-zen-reports
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── styles/        # Global styles
└── App.tsx        # Main application component

public/           # Static assets
supabase/         # Supabase configuration and migrations
```

## Key Features Breakdown

### Tax Calculation Engine
Automatically calculates tax obligations based on:
- Australian income tax rates
- Deductible expenses
- Platform-specific earnings
- Quarterly tax estimates

### Report Generation
- Monthly income summaries
- Expense breakdowns by category
- Tax liability projections
- Professional PDF exports

## Development

### Making Changes

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

## Deployment

The project is ready for deployment on platforms like:
- Vercel
- Netlify
- AWS Amplify
- Traditional VPS hosting

## Technologies Used

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- Supabase
- jsPDF
- Node.js

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact & Support

For support or inquiries, please reach out to the project maintainer or open an issue on GitHub.

---

**Made with ❤️ for gig economy workers**
