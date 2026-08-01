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

function calculateHoldingPeriod(investmentDate) {
  const [day, monthName, year] = investmentDate.split(' ');
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const start = new Date(Number(year), monthMap[monthName], Number(day));
  const now = new Date();
  const days = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  return `${days} days`;
}

function buildInvestorProfile(config) {
  const charges = {
    brokerage: Number(config.charges?.brokerage ?? 0),
    stt: Number(config.charges?.stt ?? 0),
    exchangeCharges: Number(config.charges?.exchangeCharges ?? 0),
    sebiCharges: Number(config.charges?.sebiCharges ?? 0),
    stampDuty: Number(config.charges?.stampDuty ?? 0),
    gst: Number(config.charges?.gst ?? 0),
    platformFee: Number(config.charges?.platformFee ?? 0),
    awsCost: Number(config.charges?.awsCost ?? 150)
  };

  const totalCharges = Number((charges.brokerage + charges.stt + charges.exchangeCharges + charges.sebiCharges + charges.stampDuty + charges.gst + charges.platformFee + charges.awsCost).toFixed(2));
  const grossPortfolioValue = Number(config.currentPortfolioValue ?? 0);
  const netPortfolioValue = Number((grossPortfolioValue - totalCharges).toFixed(2));
  const netProfit = Number((netPortfolioValue - config.capitalInvested).toFixed(2));
  const overallReturnAfterCharges = Number(((netProfit / config.capitalInvested) * 100).toFixed(2));
  const holdingPeriod = calculateHoldingPeriod(config.investmentDate);

  return {
    investorId: config.investorId,
    accountType: config.accountType,
    kycStatus: config.kycStatus,
    accountStatus: config.accountStatus,
    riskProfile: config.riskProfile,
    portfolioManager: config.portfolioManager,
    clientSince: config.clientSince,
    investmentDate: config.investmentDate,
    capitalInvested: Number(config.capitalInvested),
    currentPortfolioValue: grossPortfolioValue,
    unrealizedProfit: Number(config.unrealizedProfit ?? 0),
    overallReturn: Number(config.overallReturn ?? 0),
    holdingPeriod,
    investmentStatus: config.investmentStatus,
    charges,
    totalCharges,
    netPortfolioValue,
    netProfitAfterCharges: netProfit,
    overallReturnAfterCharges,
    healthScore: 94,
    history: [
      {
        date: config.investmentDate,
        investment: Number(config.capitalInvested),
        currentValue: grossPortfolioValue,
        profit: Number(config.unrealizedProfit ?? 0),
        returnPct: Number(config.overallReturn ?? 0),
        status: config.investmentStatus
      }
    ],
    holdings: [
      { symbol: 'NIFTY', qty: 12, avg: 22000, price: 22850, pnl: 10200 },
      { symbol: 'BANKNIFTY', qty: 8, avg: 49000, price: 50750, pnl: 14000 },
      { symbol: 'RELIANCE', qty: 26, avg: 2440, price: 2520, pnl: 2080 }
    ],
    analytics: {
      daily: 2.1,
      weekly: 4.4,
      monthly: 10.6,
      yearly: 105.66,
      cagr: 68.3,
      drawdown: -4.7,
      sharpe: 1.62,
      winRate: 74,
      allocation: [
        { name: 'Technology', value: 42 },
        { name: 'Financials', value: 27 },
        { name: 'Energy', value: 18 },
        { name: 'Healthcare', value: 13 }
      ]
    }
  };
}

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
    joiningDate: '01 Jan 2025'
  },
  {
    id: 'investor-1002',
    name: 'Anuj',
    email: 'anni44600@gmail.com',
    password: createHash('Anuj@2026'),
    role: 'investor',
    phone: '+91 98765 11111',
    pan: 'ANUJ1234A',
    kyc: 'Verified',
    nominee: 'Asha Anuj',
    joiningDate: '15 Apr 2026',
    ...buildInvestorProfile({
      investorId: 'BB-1002',
      accountType: 'Individual Investor',
      kycStatus: 'Verified',
      accountStatus: 'Active',
      riskProfile: 'Moderately Aggressive',
      portfolioManager: 'BLACKBUSER Quantitative Fund',
      clientSince: '15 April 2026',
      investmentDate: '15 Apr 2026',
      capitalInvested: 5000,
      currentPortfolioValue: 10487.82,
      unrealizedProfit: 5487.82,
      overallReturn: 109.76,
      investmentStatus: 'Active',
      charges: {
        brokerage: 0,
        stt: 18.92,
        exchangeCharges: 5.84,
        sebiCharges: 0.10,
        stampDuty: 3.84,
        gst: 1.08,
        platformFee: 25,
        awsCost: 150
      }
    })
  },
  {
    id: 'investor-1003',
    name: 'Himanshu',
    email: 'hritikmishra726@gmail.com',
    password: createHash('Himanshu@2026'),
    role: 'investor',
    phone: '+91 98765 22222',
    pan: 'HIMU1234A',
    kyc: 'Verified',
    nominee: 'Rita Himanshu',
    joiningDate: '20 Apr 2026',
    ...buildInvestorProfile({
      investorId: 'BB-1003',
      accountType: 'Individual Investor',
      kycStatus: 'Verified',
      accountStatus: 'Active',
      riskProfile: 'Aggressive',
      portfolioManager: 'BLACKBUSER Quantitative Fund',
      clientSince: '20 April 2026',
      investmentDate: '20 Apr 2026',
      capitalInvested: 5000,
      currentPortfolioValue: 10318.49,
      unrealizedProfit: 5318.49,
      overallReturn: 106.37,
      investmentStatus: 'Active',
      charges: {
        brokerage: 0,
        stt: 18.36,
        exchangeCharges: 5.69,
        sebiCharges: 0.10,
        stampDuty: 3.79,
        gst: 1.05,
        platformFee: 25,
        awsCost: 150
      }
    })
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
  res.render('login', { mode: 'login', message: '', user: req.session.user, otp: null, email: '', otpEmail: '' });
});

app.get('/register', (req, res) => {
  res.render('login', { mode: 'register', message: '', user: req.session.user, otp: null, email: '', otpEmail: '' });
});

app.get('/forgot', (req, res) => {
  res.render('login', { mode: 'forgot', message: '', user: req.session.user, otp: null, email: '', otpEmail: '' });
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!name || !normalizedEmail || !password) {
    return res.render('login', { mode: 'register', message: 'Complete all fields to proceed.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
  }

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return res.render('login', { mode: 'register', message: 'This email already has an account.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  pending[normalizedEmail] = {
    type: 'register',
    name,
    email: normalizedEmail,
    password: createHash(password),
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  res.render('login', {
    mode: 'verify',
    message: `OTP sent to ${normalizedEmail}. Use code ${otp} to verify your account.`,
    user: req.session.user,
    otp,
    email: normalizedEmail,
    otpEmail: ''
  });
});

app.post('/verify', (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const record = pending[normalizedEmail];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.render('login', { mode: 'verify', message: 'The OTP is invalid or expired.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
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
  delete pending[normalizedEmail];
  req.session.user = newUser;
  return res.redirect('/dashboard');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user || !verifyHash(password, user.password)) {
    return res.render('login', { mode: 'login', message: 'Invalid email or password.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
  }

  req.session.user = user;
  return res.redirect('/dashboard');
});

app.post('/send-login-otp', (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.render('login', { mode: 'login', message: 'No account was found for that email.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: normalizedEmail });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  pending[normalizedEmail] = {
    type: 'login',
    email: normalizedEmail,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  res.render('login', {
    mode: 'login',
    message: `OTP sent to ${normalizedEmail}. Enter the code below to continue.`,
    user: req.session.user,
    otp,
    email: normalizedEmail,
    otpEmail: normalizedEmail
  });
});

app.post('/verify-login-otp', (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const record = pending[normalizedEmail];
  if (!record || record.type !== 'login' || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.render('login', { mode: 'login', message: 'The OTP is invalid or expired.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: normalizedEmail });
  }

  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.render('login', { mode: 'login', message: 'No matching account was found.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: normalizedEmail });
  }

  delete pending[normalizedEmail];
  req.session.user = user;
  return res.redirect('/dashboard');
});

app.post('/forgot', (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.render('login', { mode: 'forgot', message: 'No account was found for that email.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  pending[normalizedEmail] = { type: 'reset', email: normalizedEmail, otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  res.render('login', {
    mode: 'reset',
    message: `Reset OTP sent to ${normalizedEmail}. Use code ${otp} to set a new password.`,
    user: req.session.user,
    otp,
    email: normalizedEmail,
    otpEmail: ''
  });
});

app.post('/reset', (req, res) => {
  const { email, otp, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const record = pending[normalizedEmail];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.render('login', { mode: 'reset', message: 'The reset code is invalid or expired.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
  }

  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.render('login', { mode: 'reset', message: 'No matching account was found.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
  }

  user.password = createHash(password);
  delete pending[normalizedEmail];
  res.render('login', { mode: 'login', message: 'Password updated successfully. Please log in.', user: req.session.user, otp: null, email: normalizedEmail, otpEmail: '' });
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
