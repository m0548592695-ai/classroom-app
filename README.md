# 🌸 My Classroom – First Grade Assignment App

A small classroom web app for first-grade students and their teacher.

## Features

- Student selection without typing
- Five students with a unique flower/color identity
- Multiple assignments at the same time
- Each student sees only assignments they have not completed
- Drawing on top of the original worksheet using HTML5 Canvas
- Eraser affects only the student's drawing layer
- Undo and Clear All
- Thin and thick brush
- Five drawing colors
- Teacher can upload PNG, JPG, WEBP, and PDF files
- PDF viewer with multiple-page navigation
- Student submissions are stored in Supabase
- Student automatically downloads a PNG copy after submitting
- Teacher dashboard with submissions grouped by student
- Download and delete submissions
- Delete assignments
- Responsive layout for desktop, tablets, and touch screens

## Tech Stack

- React
- Vite
- HTML5 Canvas
- PDF.js
- Supabase
- Vercel

## Local Development

### 1. Install Node.js

Install the current Node.js LTS version.

### 2. Install dependencies

From the project directory:

```bash
npm install
```

### 3. Configure Supabase

Copy:

```text
.env.example
```

to:

```text
.env
```

Then add:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Create the Supabase database

Open your Supabase project.

Go to:

```text
SQL Editor
```

Open:

```text
supabase/schema.sql
```

Copy the entire file into the SQL Editor and run it.

This creates:

- `tasks`
- `submissions`
- the `classroom-files` Storage bucket
- the required database and Storage policies

### 5. Run locally

```bash
npm run dev
```

Then open the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Deploy to Vercel

1. Push the project to GitHub.
2. Create a new project in Vercel.
3. Import the GitHub repository.
4. Use:

```text
Build Command: npm run build
Output Directory: dist
```

5. Add these Environment Variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

6. Deploy.

## GitHub

Do not commit `.env`.

The repository should contain:

```text
.env.example
```

but not:

```text
.env
```

The `.gitignore` file is already configured to ignore `.env`.

## Teacher Access

The current prototype uses the teacher code:

```text
9
```

Important: this is only a UI-level access gate, not real authentication. The code is included in the client-side application and should not be considered secure.

For a production version, use Supabase Auth and Row Level Security (RLS) with a real teacher account.

## Data Model

### tasks

Stores uploaded worksheets and PDFs.

### submissions

Stores the submitted work for a specific student and assignment.

Each student can submit each assignment only once.

The relationship is:

```text
student + task = submission
```

This means completing an assignment for one student does not mark it as completed for other students.

## Important Architecture Detail

The original worksheet and the student's drawing are kept as separate layers:

```text
Original Worksheet
       +
Student Drawing Canvas
       =
Final Submission
```

Therefore, using the eraser or Clear All never removes the original worksheet.

## Current Limitations

This is a first working version.

For a production classroom deployment, consider adding:

- Real teacher authentication
- Stronger Supabase RLS policies
- Per-page drawing state for multi-page PDFs
- Better error handling and upload progress
- Assignment editing
- Teacher ability to archive assignments
- Optional student avatars/flowers managed from the database

