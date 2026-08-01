const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'blackbuser-quant-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 4 }
  })
);

function createHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyHash(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const computed = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return computed === hash;
}

function currency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

function pct(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function nowLabel() {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const baseInvestor = {
  totalInvested: 13000,
  currentPortfolio: 16968.3,
  totalProfit: 3968.3,
  todayPnl: 241.8,
  monthlyReturn: 18.24,
  overallReturn: 30.53,
  healthScore: 91,
  charges: {
    brokerage: 0,
    exchangeCharges: 13.84,
    sebiCharges: 2.31,
    gst: 2.91,
    stampDuty: 5.48,
    stt: 3.2,
    dpCharges: 0,
    platformFee: 25,
    awsCost: 150
  },
  history: [
    { date: '13 May 2026', investment: 5000, currentValue: 8236.74, profit: 3236.74, returnPct: 64.73, status: 'Active' },
    { date: '13 Jul 2026', investment: 8000, currentValue: 8731.56, profit: 731.56, returnPct: 9.14, status: 'Active' }
  ],
  holdings: [
    { symbol: 'NAVI', qty: 126, avg: 390, price: 422, pnl: 4032 },
    { symbol: 'RELI', qty: 88, avg: 2480, price: 2640, pnl: 14080 },
    { symbol: 'TCS', qty: 42, avg: 3650, price: 3810, pnl: 6720 }
  ],
  analytics: {
    daily: 1.8,
    weekly: 4.4,
    monthly: 18.24,
    yearly: 30.53,
    cagr: 24.1,
    drawdown: -7.6,
    sharpe: 1.48,
    winRate: 71,
    allocation: [
      { name: 'Technology', value: 38 },
      { name: 'Financials', value: 24 },
      { name: 'Energy', value: 18 },
      { name: 'Healthcare', value: 20 }
    ]
  }
};

const seedUsers = [
  {
    id: 'admin-1',
    name: 'Yash Pundeer',
    email: 'yashpundeer7@gmail.com',
    password: createHash('Admin@2026'),
    role: 'super_admin',
    phone: '+91 98765 43210',
    pan: 'ABCDE1234F',
    kyc: 'Verified',
    nominee: 'Asha Pundeer',
    joiningDate: '01 Jan 2025',
    ...baseInvestor,
    totalInvested: 13000,
    currentPortfolio: 16968.3,
    totalProfit: 3968.3,
    todayPnl: 241.8,
    monthlyReturn: 18.24,
    overallReturn: 30.53
  },
  {
    id: 'investor-1',
    name: 'Kapil Kaushik',
    email: 'kapilllkaushik09@gmail.com',
    password: createHash('Kapil@2026'),
    role: 'investor',
    phone: '+91 82910 12345',
    pan: 'PQRST1234A',
    kyc: 'Pending Review',
    nominee: 'Ritu Kaushik',
    joiningDate: '13 Jul 2026',
    ...baseInvestor,
    totalInvested: 13000,
    currentPortfolio: 16968.3,
    totalProfit: 3968.3,
    todayPnl: 241.8,
    monthlyReturn: 18.24,
    overallReturn: 30.53
  }
];

let users = seedUsers.map((user) => ({ ...user }));
let pending = {};

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'super_admin') {
    return res.redirect('/dashboard');
  }
  next();
}

app.get('/', (req, res) => {
  res.render('home', { user: req.session.user, nowLabel });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/login', (req, res) => {
  res.render('login', { mode: 'login', message: '', user: req.session.user, otp: null, email: '' });
});

app.get('/register', (req, res) => {
  res.render('login', { mode: 'register', message: '', user: req.session.user, otp: null, email: '' });
});

app.get('/forgot', (req, res) => {
  res.render('login', { mode: 'forgot', message: '', user: req.session.user, otp: null, email: '' });
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render('login', { mode: 'register', message: 'Complete all fields to proceed.', user: req.session.user, otp: null, email });
  }

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.render('login', { mode: 'register', message: 'This email already has an account.', user: req.session.user, otp: null, email });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  pending[email.toLowerCase()] = {
    type: 'register',
    name,
    email: email.toLowerCase(),
    password: createHash(password),
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  res.render('login', {
    mode: 'verify',
    message: `OTP sent to ${email}. Use code ${otp} to verify your account.`,
    user: req.session.user,
    otp,
    email: email.toLowerCase()
  });
});

app.post('/verify', (req, res) => {
  const { email, otp } = req.body;
  const record = pending[email.toLowerCase()];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.render('login', { mode: 'verify', message: 'The OTP is invalid or expired.', user: req.session.user, otp: null, email });
  }

  const newUser = {
    id: `investor-${Date.now()}`,
    name: record.name,
    email: record.email,
    password: record.password,
    role: 'investor',
    phone: '+91 00000 00000',
    pan: 'XXXX0000X',
    kyc: 'Pending Review',
    nominee: 'To be set',
    joiningDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    ...baseInvestor,
    totalInvested: 0,
    currentPortfolio: 0,
    totalProfit: 0,
    todayPnl: 0,
    monthlyReturn: 0,
    overallReturn: 0,
    healthScore: 100,
    charges: { ...baseInvestor.charges, platformFee: 0, awsCost: 0 },
    history: [],
    holdings: []
  };

  users.push(newUser);
  delete pending[email.toLowerCase()];
  req.session.user = newUser;
  return res.redirect('/dashboard');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyHash(password, user.password)) {
    return res.render('login', { mode: 'login', message: 'Invalid email or password.', user: req.session.user, otp: null, email });
  }

  req.session.user = user;
  return res.redirect('/dashboard');
});

app.post('/forgot', (req, res) => {
  const { email } = req.body;
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.render('login', { mode: 'forgot', message: 'No account was found for that email.', user: req.session.user, otp: null, email });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  pending[email.toLowerCase()] = { type: 'reset', email: email.toLowerCase(), otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  res.render('login', {
    mode: 'reset',
    message: `Reset OTP sent to ${email}. Use code ${otp} to set a new password.`,
    user: req.session.user,
    otp,
    email: email.toLowerCase()
  });
});

app.post('/reset', (req, res) => {
  const { email, otp, password } = req.body;
  const record = pending[email.toLowerCase()];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.render('login', { mode: 'reset', message: 'The reset code is invalid or expired.', user: req.session.user, otp: null, email });
  }

  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.render('login', { mode: 'reset', message: 'No matching account was found.', user: req.session.user, otp: null, email });
  }

  user.password = createHash(password);
  delete pending[email.toLowerCase()];
  res.render('login', { mode: 'login', message: 'Password updated successfully. Please log in.', user: req.session.user, otp: null, email });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/dashboard', requireAuth, (req, res) => {
  const user = req.session.user;
  const admin = user.role === 'super_admin';
  const data = {
    user,
    admin,
    investors: users.filter((item) => item.role === 'investor' || item.role === 'super_admin').map((item) => ({
      name: item.name,
      email: item.email,
      role: item.role,
      portfolio: item.currentPortfolio,
      profit: item.totalProfit
    })),
    marketStatus: 'LIVE',
    insights: [
      'Live market pulse active',
      'Capital deployment balanced across sectors',
      'Risk posture remains controlled'
    ]
  };

  res.render('dashboard', { data, currency, pct, nowLabel });
});

app.listen(port, () => {
  console.log(`BLACKBUSER running on http://localhost:${port}`);
});
