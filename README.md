# 🏀 HD Bets - Premium Fantasy Basketball Betting

![HD Bets Hero](./public/readme-hero.png)

HD Bets is an ultra-premium, high-performance web application designed for fantasy basketball enthusiasts to manage, track, and resolve bets within their private leagues. Built with a focus on **visual excellence** and **seamless user experience**, it provides a real-time dashboard for stakes that matter.

## ✨ Features

- **📊 Dynamic Dashboard**: Real-time overview of active bets, pending actions, and overall league statistics.
- **🥇 Interactive Leaderboard**: Track league rankings based on net profit, win rate, and potential gains.
- **🤝 Bet Verification Workflow**: A dual-confirmation system for bet proposals to ensure fairness and transparency.
- **💸 Automated Stats**: Instant calculation of member-specific and league-wide betting metrics.
- **🔐 Secure Authentication**: Private login and registration system with roles for Standard Users and Administrators.
- **📱 Mobile-First Design**: Fully responsive interface with a tailored mobile navigation experience.
- **🌗 Dark Mode & Glassmorphism**: Stunning modern aesthetics with fluid animations and premium CSS effects.

## 🚀 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Modern Flex/Grid & Variables)
- **Build Tool**: Vite
- **Testing**: Vitest + JSDOM
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets (Cloud-sync)
- **Animations**: Canvas Confetti & Custom CSS Micro-animations

## 🛠️ Setup & Installation

### 1. Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run test suite
npm test
```

### 2. Google Apps Script Backend
HD Bets uses Google Sheets as a database via a custom Google Apps Script API. Follow these steps to sync your cloud database:

1.  **Create Database**: Create a new [Google Sheet](https://sheets.new).
2.  **Open Editor**: Go to **Extensions > Apps Script**.
3.  **Generate Logic**: Run our secure utility to create your backend code:
    ```bash
    # Usage: node generate-apps-script.js <admin_username> <admin_password>
    node generate-apps-script.js Admin MySecretPassword123!
    ```
4.  **Initialize Script**: 
    - Copy the contents of the newly generated `google-apps-script/Code.gs`.
    - Paste it into the Apps Script editor (replacing all existing code).
    - Select the `setup` function from the toolbar and click **Run**. (This creates the required 'Users' and 'Bets' tabs in your Sheet).
5.  **Deploy Web App**:
    - Click **Deploy > New deployment**.
    - Select **Web app**.
    - **Execute as**: Me
    - **Who has access**: Anyone
    - Click **Deploy** and authorize the script.
6.  **Connect Frontend**: 
    - Copy the **Web App URL** provided after deployment.
    - Build your environment file:
    ```bash
    cp .env.example .env # Or create a new .env file
    ```
    - Set your variable: `VITE_APPS_SCRIPT_URL=YOUR_COPIED_URL`

---

## 🧪 Testing & Quality
We maintain a robust testing culture. Our suite uses **Vitest** and **JSDOM** to simulate the browser environment, ensuring all components and state logic perform as expected.

```bash
# Run all tests
npm test

# Run tests in UI mode
npx vitest --ui
```

## 📜 License
This project is private and intended for league members only.

---
*Built with ❤️ for the Hoop Dreams League.*
