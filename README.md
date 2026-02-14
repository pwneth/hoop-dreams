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
HD Bets uses Google Sheets as a database via Google Apps Script.

1.  Create a new [Google Sheet](https://sheets.new).
2.  Go to **Extensions > Apps Script**.
3.  Generate your custom `Code.gs` using our utility script:
    ```bash
    # Usage: node generate-apps-script.js <admin_username> <admin_password>
    node generate-apps-script.js Admin MySecretPassword123!
    ```
4.  Copy the content of `google-apps-script/Code.gs` into the Apps Script editor.
5.  Run the `setup` function once in the editor to initialize the sheets.
6.  Click **Deploy > New deployment > Web app**.
    - **Execute as**: Me
    - **Who has access**: Anyone
7.  Copy the Web App URL and paste it as `APPS_SCRIPT_URL` in `src/api/api.js`.

## 🧪 Testing
We maintain high code quality with a comprehensive Vitest suite covering components, library logic, and views.
```bash
npm run test -- run
```

## 📜 License
This project is private and intended for league members only.

---
*Built with ❤️ for the Hoop Dreams League.*
