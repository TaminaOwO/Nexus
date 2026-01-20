# 📦 Nexus MVP - Product Documentation

> **Version**: 1.0.0 (MVP)  
> **Last Updated**: 2026-01-20  
> **Architecture**: Modular Monolith (Go + React)

---

## 📋 Table of Contents

1. [Product Overview](#product-overview)
2. [System Architecture](#system-architecture)
3. [Modules Overview](#modules-overview)
4. [Kite Stock Module](#kite-stock-module)
5. [LifeOS Module](#lifeos-module)
6. [Choice-Fit Module](#choice-fit-module)
7. [Technical Stack](#technical-stack)
8. [API Reference](#api-reference)
9. [Deployment](#deployment)

---

## 🎯 Product Overview

**Nexus** is a modular monolith platform designed to host multiple personal productivity and finance applications under a unified architecture. The platform enables independent development of distinct modules while sharing core infrastructure.

### Vision

A personal productivity hub that combines:
- **Financial tracking** - Monitor investments and trading strategies
- **Life management** - Track habits and tasks
- **Health & fitness** - (Planned) Fitness coaching and tracking

### Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Modular Architecture** | Each app is an isolated module with its own frontend and backend |
| **Shared Core** | Common database, authentication, and UI components |
| **Lazy Loading** | Frontend modules are loaded on-demand for performance |
| **Mobile-First** | Responsive design optimized for mobile devices |
| **Bilingual UI** | Chinese and English labels throughout the interface |

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        App["App.tsx - Router"]
        
        subgraph "Modules"
            Kite["Kite Stock"]
            LifeOS["LifeOS"]
            ChoiceFit["Choice-Fit"]
        end
        
        subgraph "Shared"
            Components["Hand-Drawn Icons"]
            CSS["Design System (CSS)"]
        end
    end
    
    subgraph "Backend (Go + Gin)"
        Router["Gin Router"]
        
        subgraph "Module Handlers"
            KiteAPI["Kite Handlers"]
            LifeOSAPI["LifeOS Handlers"]
            ChoiceFitAPI["ChoiceFit Handlers"]
        end
        
        subgraph "Services"
            QuoteSvc["Quote Service (TWSE)"]
            TradeSvc["Trade Service"]
        end
    end
    
    subgraph "Data Layer"
        SQLite["SQLite Database"]
        LocalStorage["Browser LocalStorage"]
    end
    
    App --> Kite
    App --> LifeOS
    App --> ChoiceFit
    
    Kite --> KiteAPI
    LifeOS --> LifeOSAPI
    ChoiceFit --> ChoiceFitAPI
    
    KiteAPI --> QuoteSvc
    KiteAPI --> TradeSvc
    
    TradeSvc --> SQLite
    Kite --> LocalStorage
```

---

## 📱 Modules Overview

| Module | Status | Description | Route |
|--------|--------|-------------|-------|
| **Kite Stock** | ✅ Complete | Stock strategy visualization and trade journal | `/kite` |
| **LifeOS** | 🚧 MVP | Personal productivity dashboard | `/admin` |
| **Choice-Fit** | 📝 Planned | Fitness coaching platform | `/choice-fit` |

---

## 🪁 Kite Stock Module

> **Purpose**: A stock trading companion that visualizes market structure, provides entry signals, and tracks portfolio performance.

### Core Concept: The Wind System

Kite Stock uses a metaphorical "wind" system to categorize daily market conditions:

| Wind Type | Emoji | Chinese | Meaning |
|-----------|-------|---------|---------|
| **Strong** | 🦅 | 強風 | Bullish momentum - market rising strongly |
| **Turbulent** | 🌪️ | 亂流 | Volatile - significant price swings |
| **Gusty** | 🍃 | 陣風 | Bearish momentum with occasional bounces |
| **Calm** | 🐢 | 無風 | Low volatility - sideways movement |

### Structure Calculation

Based on 5-day wind history, the system calculates a **Market Structure**:

```mermaid
flowchart LR
    subgraph "Wind History (5 Days)"
        D1["Day 1"] --> D2["Day 2"]
        D2 --> D3["Day 3"]
        D3 --> D4["Day 4"]
        D4 --> D5["Today"]
    end
    
    D5 --> Calc["Calculate Structure"]
    
    Calc --> ER["📈 Easy Rise (易漲)"]
    Calc --> EF["📉 Easy Fall (易跌)"]
    Calc --> BD["⚖️ Boundary (交界)"]
```

| Structure | Chinese | Condition | Implication |
|-----------|---------|-----------|-------------|
| **Easy Rise** | 易漲 | Majority Strong/Turbulent winds | Favor momentum/chase strategies |
| **Easy Fall** | 易跌 | Majority Gusty/Calm winds | Favor value/pullback strategies |
| **Boundary** | 交界 | Mixed winds | Be cautious, look for opportunities |

### Traffic Light (Gate Signal)

A visual "traffic light" provides actionable guidance:

- 🟢 **Green (Go)**: Structure supports new positions
- 🟡 **Yellow (Caution)**: Wait for confirmation
- 🔴 **Red (Stop)**: Avoid new positions in current strategy

---

### Feature 1: Wind Cockpit

![Wind Cockpit concept]

The **Wind Cockpit** is the central dashboard for daily wind input and structure visualization.

#### Functionality

| Function | Description |
|----------|-------------|
| **Today's Wind Input** | 4 buttons to record current market condition |
| **History Strip** | 5 colored dots showing recent wind history |
| **Structure Display** | Current cycle phase with emoji and Chinese label |
| **Traffic Light** | Visual go/stop signal for trading |
| **Dev Mode** | Edit historical winds for testing |
| **Last Week Override** | Set baseline from mobile app for calculation |

#### User Flow

```mermaid
sequenceDiagram
    participant User
    participant WindCockpit
    participant LocalStorage
    
    User->>WindCockpit: Open Kite Module
    WindCockpit->>LocalStorage: Load wind history
    LocalStorage-->>WindCockpit: Return past 5 days
    WindCockpit->>WindCockpit: Calculate structure
    WindCockpit->>User: Display structure + gate light
    
    User->>WindCockpit: Click "Strong" button
    WindCockpit->>LocalStorage: Save today's wind
    WindCockpit->>WindCockpit: Recalculate structure
    WindCockpit->>User: Update display
```

---

### Feature 2: Stock Inspector

> **Purpose**: Query real-time stock data from TWSE and receive strategy-specific entry guidance.

#### Strategy Tabs

The inspector supports two main strategies with sub-strategies:

| Main Strategy | Sub-Strategy | Chinese | Use Case |
|---------------|--------------|---------|----------|
| **Office Worker** 🏢 | Strong Weekly | 強勢週/追漲 | Chase momentum in uptrends |
| **Office Worker** 🏢 | Weekly Trend | 週趨勢/買拉回 | Buy pullbacks in established trends |
| **Boss** 🛡️ | Weekly Pullback | 週拉回 | Enter on weekly retracements |
| **Boss** 🛡️ | Cheap Acquisition | 廉價收購 | Accumulate at deep discounts |

#### Quote Data Displayed

| Data Point | Description |
|------------|-------------|
| **Current Price** | Real-time price from TWSE |
| **Change %** | Daily percentage change |
| **Trade Value** | Trading volume in NT$ (億/萬 format) |
| **Hot Badge** | Shown when trade value > 1億 |
| **MA20/MA60 Deviation** | Distance from moving averages |
| **MACD Histogram Days** | Bullish/bearish streak duration |
| **Weekly MACD Trend** | UP/DOWN/FLAT signal |

#### Verdict System

Based on the selected strategy and stock data, a color-coded verdict is displayed:

| Status | Color | Meaning |
|--------|-------|---------|
| **BUY** | 🟢 Green | Conditions met - consider entry |
| **WAIT** | 🟡 Yellow | Partial conditions - monitor |
| **DANGER** | 🔴 Red | Avoid - conditions not favorable |

**Boss Strategy Checkbox**: The Boss strategy requires manual verification of YOY revenue growth (> 30%) before giving a BUY verdict.

---

### Feature 3: Trade Journal

> **Purpose**: Log and track active portfolio positions with real-time P/L calculations.

#### Trade Entry Modal

When clicking "Log Trade" in Stock Inspector:

| Field | Description |
|-------|-------------|
| **Entry Price** | Purchase price (defaults to current) |
| **Quantity (Shares)** | Number of shares (1張 = 1000股) |
| **Planned Batches** | Total intended buy tranches |
| **Current Batch** | Which tranche this is |
| **Stop Loss Price** | Required exit price for loss |
| **Take Profit Price** | Optional target price |

**Auto-Captured Context**:
- Strategy type (OFFICE/BOSS)
- Current market cycle
- MA20 deviation at entry
- MACD data snapshot

#### Portfolio Dashboard

| Display | Description |
|---------|-------------|
| **Total Cost** | Sum of all entry costs |
| **Market Value** | Real-time portfolio value |
| **Total P/L** | Unrealized profit/loss |
| **Holdings List** | Cards for each position |

#### Holding Cards Show

- Company name and symbol
- Strategy badge (🏢 or 🛡️)
- Days held
- Entry → Current price
- Unrealized P/L ($ and %)
- Strategy alerts (stop loss hit, etc.)
- Action buttons: Settle / Delete

#### Settlement Flow

```mermaid
sequenceDiagram
    participant User
    participant Portfolio
    participant API
    participant Database
    
    User->>Portfolio: Click "平倉 Settle"
    Portfolio->>Portfolio: Open modal with P/L preview
    User->>Portfolio: Enter exit price + notes
    User->>Portfolio: Click confirm
    Portfolio->>API: POST /trade/:id/settle
    API->>Database: Update trade status → CLOSED
    API->>Database: Calculate final P/L
    Database-->>API: Success
    API-->>Portfolio: 200 OK
    Portfolio->>Portfolio: Refresh portfolio
```

---

### Feature 4: Trade History

> **Purpose**: View completed trades and analyze performance statistics.

#### Statistics Cards

| Stat | Description |
|------|-------------|
| **Win Rate** | Percentage of profitable trades |
| **Total P/L** | Cumulative profit/loss |
| **Best Strategy** | Strategy with highest returns |

#### History Table Columns

| Column | Description |
|--------|-------------|
| **Exit Date** | When trade was closed |
| **Symbol** | Stock code and company |
| **Strategy** | OFFICE/BOSS + sub-strategy |
| **P/L ($)** | Absolute profit/loss |
| **P/L (%)** | Percentage return |
| **Days** | Holding period |

#### Import Past Trades

For migrating external trade history:

| Field | Description |
|-------|-------------|
| **Symbol** | Stock code (auto-fetches company name) |
| **Strategy** | Dropdown with all 4 sub-strategies |
| **Entry/Exit Date** | Calendar pickers |
| **Entry/Exit Price** | Price at buy/sell |
| **Quantity** | Shares traded |
| **Active Holding Toggle** | ON = still holding (no exit data) |
| **Notes** | Optional comments |

---

## 🧠 LifeOS Module

> **Purpose**: Personal admin dashboard for productivity tracking.

### Current Features (MVP)

#### Tab Navigation

| Tab | Description |
|-----|-------------|
| **Overview** | Combined view of habits + tasks |
| **Habits** | Full habit tracker view |
| **Tasks** | Full task board view |

---

### Feature 1: Habit Tracker

#### Functionality

| Feature | Description |
|---------|-------------|
| **Habit List** | Display habits with checkboxes |
| **Toggle Completion** | Click to mark done/undone |
| **Streak Counter** | 🔥 X days streak display |
| **Compact Mode** | Shows top 3 in overview |
| **Add Habit** | (Placeholder) Button to add new habits |

#### Default Demo Habits

| Habit | Initial Streak |
|-------|----------------|
| Morning Meditation | 5 days |
| Read 30 mins | 12 days |
| No Sugar | 3 days |
| Deep Work (2h) | 8 days |

> [!NOTE]
> Habits are currently stored in React state only (demo mode). Backend persistence not yet implemented.

---

### Feature 2: Todo Board

#### Kanban-Style Layout

| Column | Color | Purpose |
|--------|-------|---------|
| **To Do** | Gray | Pending tasks |
| **In Progress** | Amber | Currently working on |
| **Done** | Green | Completed tasks |

#### Task Cards

Each card displays:
- Task description text
- Optional tag (Dev, Design, Work, Personal)

#### Compact Mode

- Shows only To Do and In Progress columns
- Used in Overview tab

> [!NOTE]
> Task data is currently demo data in React state. Full CRUD backend not implemented.

---

## 💪 Choice-Fit Module

> **Status**: Placeholder - Not yet implemented

### Planned Purpose

A fitness and coaching platform for:
- Workout tracking
- Personal training scheduling
- Progress visualization

### Current State

- Route `/choice-fit` exists
- Displays placeholder message
- Backend ping endpoint active

---

## 🛠️ Technical Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **React Router 6** | Client-side routing |
| **Vanilla CSS** | Styling with CSS custom properties |
| **LocalStorage** | Client-side data persistence (wind history) |

### Backend

| Technology | Purpose |
|------------|---------|
| **Go 1.21+** | Server runtime |
| **Gin** | HTTP web framework |
| **GORM** | ORM for database operations |
| **SQLite** | Embedded database |

### External Integrations

| Service | Purpose |
|---------|---------|
| **TWSE API** | Taiwan Stock Exchange real-time quotes |
| **Railway** | Cloud deployment platform |

---

## 📡 API Reference

### Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://your-app.railway.app`

---

### Kite Stock APIs

#### GET `/api/kite/ping`

Health check for Kite module.

**Response**:
```json
{ "message": "Kite Stock Module Online" }
```

---

#### GET `/api/kite/quote`

Fetch real-time stock quote from TWSE.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `symbol` | string | Stock code (e.g., "2330") |

**Response**:
```json
{
  "symbol": "2330",
  "company_name": "台積電",
  "price": 595.00,
  "change_percent": 1.25,
  "volume": 15234567,
  "trade_value": 9056000000,
  "ma5": 590.50,
  "ma20": 585.25,
  "ma60": 570.00,
  "deviation_ma20": 1.67,
  "deviation_ma60": 4.39,
  "macd_histogram": 2.35,
  "macd_histogram_days": 5,
  "macd_weekly_trend": "UP"
}
```

---

#### GET `/api/kite/quotes`

Fetch multiple stock quotes at once.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `symbols` | string | Comma-separated stock codes |

---

#### POST `/api/kite/journal`

Create a new trade entry.

**Request Body**:
```json
{
  "symbol": "2330",
  "company_name": "台積電",
  "entry_price": 595.00,
  "quantity": 1000,
  "planned_batches": 5,
  "current_batch": 1,
  "strategy": "BOSS",
  "sub_strategy": "WEEKLY_PULLBACK",
  "cycle": "EASY_FALL",
  "stop_loss_price": 565.00,
  "take_profit_price": 650.00,
  "strategy_snapshot": {
    "ma20_deviation": 1.67,
    "ma60_deviation": 4.39,
    "macd_days": 5,
    "weekly_trend": "UP",
    "current_price": 595.00
  }
}
```

---

#### GET `/api/kite/portfolio`

Get active portfolio with real-time P/L calculations.

**Response**:
```json
{
  "holdings": [
    {
      "id": "uuid",
      "symbol": "2330",
      "company_name": "台積電",
      "entry_price": 595.00,
      "quantity": 1000,
      "current_price": 598.00,
      "unrealized_pl": 3000,
      "unrealized_pl_percent": 0.50,
      "cost_basis": 595000,
      "market_value": 598000,
      "days_held": 5,
      "strategy_alerts": []
    }
  ],
  "alerts": [],
  "total_cost": 595000,
  "market_value": 598000,
  "total_pl": 3000,
  "total_pl_percent": 0.50
}
```

---

#### POST `/api/kite/trade/:id/settle`

Close a trade position.

**URL Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Trade UUID |

**Request Body**:
```json
{
  "exit_price": 610.00,
  "exit_notes": "Target reached"
}
```

---

#### DELETE `/api/kite/trade/:id`

Delete a trade entry.

---

#### GET `/api/kite/history`

Get closed trade history with statistics.

**Response**:
```json
{
  "trades": [...],
  "total_pl": 25000,
  "win_rate": 66.67,
  "total_trades": 12,
  "wins": 8,
  "best_strategy": "BOSS",
  "best_pl": 18000
}
```

---

#### POST `/api/kite/import`

Import a historical trade.

**Request Body**:
```json
{
  "symbol": "2330",
  "company_name": "台積電",
  "strategy": "BOSS",
  "sub_strategy": "WEEKLY_PULLBACK",
  "entry_price": 550.00,
  "exit_price": 600.00,
  "quantity": 2000,
  "entry_date": "2025-11-01",
  "exit_date": "2025-12-15",
  "notes": "Great trade"
}
```

---

#### Wind APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kite/wind/latest` | Get today's wind record |
| GET | `/api/kite/wind/history` | Get past N days of wind |
| POST | `/api/kite/wind` | Save a wind record |

---

### LifeOS APIs

#### GET `/api/lifeos/ping`

Health check for LifeOS module.

---

### Choice-Fit APIs

#### GET `/api/choicefit/ping`

Health check for Choice-Fit module.

---

## 🚀 Deployment

### Railway Deployment

The application is configured for Railway deployment with:

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for Go + React |
| `railway.toml` | Railway-specific configuration |

### Build Process

```mermaid
flowchart LR
    subgraph "Build Stage"
        NPM["npm install"]
        Vite["vite build"]
        Go["go build"]
    end
    
    subgraph "Runtime"
        Server["Go Server :PORT"]
        SPA["Serve ./dist/*"]
        API["API Routes"]
    end
    
    NPM --> Vite
    Vite --> Go
    Go --> Server
    Server --> SPA
    Server --> API
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `DATABASE_URL` | Database path | ./nexus.db |

---

## 📊 Data Models

### WindRecord

```go
type WindRecord struct {
    ID        string    `gorm:"primaryKey"`
    Date      string    `gorm:"uniqueIndex"`
    Wind      string    // STRONG, TURBULENT, GUSTY, CALM
    CreatedAt time.Time
}
```

### TradeEntry

```go
type TradeEntry struct {
    ID              string `gorm:"primaryKey"`
    Symbol          string
    CompanyName     string
    EntryPrice      float64
    ExitPrice       float64
    Quantity        int
    PlannedBatches  int
    CurrentBatch    int
    Strategy        string    // OFFICE, BOSS
    SubStrategy     string    // STRONG_WEEKLY, etc.
    Cycle           string    // EASY_RISE, etc.
    StopLossPrice   float64
    TakeProfitPrice float64
    Status          string    // OPEN, CLOSED
    StrategySnapshot JSON     // Entry conditions
    ExitNotes       string
    FinalPL         float64
    FinalPLPercent  float64
    CreatedAt       time.Time
    ClosedAt        *time.Time
}
```

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0f172a` | Page background |
| `--bg-surface` | `#1e293b` | Card backgrounds |
| `--accent` | `#f59e0b` | Primary accent (amber) |
| `--success` | `#10b981` | Positive values |
| `--danger` | `#ef4444` | Negative values |
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Muted text |

### Typography

| Element | Font | Size |
|---------|------|------|
| Headings | System | 1.5rem - 2rem |
| Body | System | 1rem |
| Mono (prices) | `monospace` | 1.25rem |

### Hand-Drawn Icons

Custom SVG icons with organic, hand-drawn aesthetic:

- `IconLifeOS` - Brain/dashboard icon
- `IconKite` - Flying kite
- `IconChoiceFit` - Dumbbell
- `IconDashboard` - Grid layout
- `IconSettings` - Gear
- `IconStrongWind`, `IconTurbulence`, `IconGust`, `IconNoWind` - Wind types
- `IconBOSS` - Shield (Boss strategy)
- `IconCompany` - Building (Office strategy)

---

## 📝 Future Roadmap

### Short-term (v1.1)

- [ ] LifeOS persistence layer (GORM)
- [ ] User authentication
- [ ] Push notifications for stop-loss alerts

### Medium-term (v1.5)

- [ ] Choice-Fit module implementation
- [ ] Multi-user support
- [ ] Trade analytics dashboard

### Long-term (v2.0)

- [ ] Mobile app (React Native)
- [ ] AI-powered trade suggestions
- [ ] Integration with more brokers

---

> **Generated with ❤️ for the Nexus Project**
