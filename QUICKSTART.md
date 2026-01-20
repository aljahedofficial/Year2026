# Quick Start Guide

## Prerequisites
You need Node.js installed. Download from: https://nodejs.org/ (choose LTS version)

## Running the Application

1. **Open PowerShell** and navigate to the project:
   ```bash
   cd d:\masterThesis\englishDeptThesis\y2026
   ```

2. **Install dependencies** (first time only):
   ```bash
   npm install
   ```
   This will take a few minutes to download all required packages.

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to the URL shown (usually `http://localhost:5173`)

## What You'll See

- A clean academic interface with a paste box and file uploader
- Upload `.txt` files or paste text directly
- View individual file analysis or combined corpus statistics
- Export results as CSV, XLSX, or PNG

## Stopping the Server

Press `Ctrl+C` in the terminal to stop the development server.

## Troubleshooting

**"running scripts is disabled on this system"** (PowerShell error)
- **Option 1**: Run PowerShell as Administrator and execute:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  Then type `Y` to confirm.
  
- **Option 2**: Use Command Prompt (cmd) instead of PowerShell
  
- **Option 3**: Double-click `start.bat` in the project folder (easiest!)

**"npm is not recognized"**
- Node.js isn't installed or terminal needs restart
- Install Node.js and restart your terminal

**Port already in use**
- Another app is using port 5173
- The terminal will suggest an alternative port

**Dependencies fail to install**
- Try running as Administrator
- Or delete `node_modules` folder and try `npm install` again
