# i18n Implementation Guide - DairyFlow

## Overview
The DairyFlow application now supports multi-language support with English (EN) and Gujarati (ગુજરાતી) using i18next.

## Installation
All required dependencies have been installed:
```bash
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

## File Structure
```
frontend/
├── src/
│   ├── config/
│   │   └── i18n.js                 # i18n configuration
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json    # English translations
│   │   └── gu/
│   │       └── translation.json    # Gujarati translations
│   ├── components/
│   │   ├── LanguageSwitcher.jsx    # Language switcher component
│   │   ├── Login.jsx               # Updated with i18n
│   │   ├── Register.jsx            # Updated with i18n
│   │   └── layout/
│   │       └── Sidebar.jsx         # Updated with i18n
│   └── main.jsx                    # Updated to initialize i18n
```

## How to Use i18n in Components

### Step 1: Import the useTranslation hook
```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Use the hook in your component
```javascript
export default function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('gu')}>ગુજરાતી</button>
    </div>
  );
}
```

### Step 3: Add translation keys to translation files
Add your translation keys to `/locales/en/translation.json` and `/locales/gu/translation.json`

**Example:**
```json
{
  "common": {
    "hello": "Hello"
  }
}
```

Then use it in your component:
```javascript
t('common.hello')
```

## Available Translation Key Categories

### common
- appName, tagline, loading, error, success, cancel, save, edit, delete, add, back, next, submit, logout, close, search, filter, sort

### auth
- login, register, email, password, confirmPassword, invalidEmailOrPassword, networkError, passwordsDoNotMatch, emailAlreadyExists, registerSuccess, loginSuccess, logoutSuccess, manageYourDairyFarmWithEase, trackMilkProduction, forgotPassword, dontHaveAccount, alreadyHaveAccount, firstName, lastName, phoneNumber

### dashboard
- dashboard, welcome, overview, totalFarms, totalCattle, totalMilkProduction, totalWorkers, recentActivity, quickActions, statistics

### farms
- farms, yourFarms, addFarm, editFarm, deleteFarm, farmName, location, area, capacity, description, createdAt, updatedAt, farmDetails, deleteConfirm, farmDeletedSuccess, farmCreatedSuccess, farmUpdatedSuccess, noFarms

### cattle
- cattle, addCattle, editCattle, deleteCattle, cattleList, cattleName, breed, age, weight, milkProduction, health, dateOfBirth, registrationNumber, vaccinated, lastCheckup, noCattle, cattleDeletedSuccess, cattleCreatedSuccess, cattleUpdatedSuccess

### milk
- milk, addMilkProduction, milkProduction, date, quantity, quality, liters, soldTo, price, totalAmount, transactionType, noMilkProduction, milkDeletedSuccess, milkCreatedSuccess, buyMilk, sellMilk

### workers
- workers, addWorker, editWorker, deleteWorker, workerList, name, phoneNumber, email, role, salary, joinDate, status, noWorkers, workerDeletedSuccess, workerCreatedSuccess, workerUpdatedSuccess, active, inactive

### orders
- orders, myOrders, ordersList, pendingOrders, orderDetails, orderId, quantity, totalAmount, status, createdDate, deliveryDate, noOrders, pending, confirmed, delivered, cancelled, confirmOrder, cancelOrder, placeOrder

### subscriptions
- subscriptions, mySubscriptions, subscriptionsList, subscriptionName, frequency, quantity, price, status, startDate, endDate, noSubscriptions, active, inactive, subscribe, unsubscribe

### profile
- profile, accountSettings, personalInfo, changePassword, currentPassword, newPassword, confirmPassword, updateProfile, passwordChangedSuccess, profileUpdatedSuccess

### language
- language, selectLanguage, english, gujarati

### navigation
- home, dashboard, farms, cattle, workers, milk, orders, subscriptions, profile, settings, logout

### validation
- required, invalidEmail, passwordTooShort, nameRequired, phoneRequired

### messages
- deleteConfirm, confirmAction, loadingData, savedSuccessfully, updatedSuccessfully, deletedSuccessfully, errorOccurred, tryAgain, noInternet, sessionExpired

## Language Switching

Users can switch languages using the LanguageSwitcher component which is available:
- Login page (top right of login form)
- Register page (top right of registration form)
- Sidebar user section (at the bottom)

### Programmatic Language Change
```javascript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('gu')}>Gujarati</button>
    </>
  );
}
```

## Language Detection
The application automatically detects the user's preferred language based on:
1. Previously saved language in localStorage
2. Browser language preference (navigator.language)
3. Falls back to English if neither is available

## Adding New Translation Keys

1. Open `/locales/en/translation.json`
2. Add your new key in the appropriate category
3. Open `/locales/gu/translation.json`
4. Add the Gujarati translation for the same key
5. Use it in your component with `t('category.key')`

**Example:**
```json
// en/translation.json
{
  "myFeature": {
    "title": "My Feature Title"
  }
}

// gu/translation.json
{
  "myFeature": {
    "title": "મારી સુવિધાનું શીર્ષક"
  }
}
```

Then in your component:
```javascript
<h1>{t('myFeature.title')}</h1>
```

## Components Already Updated with i18n

✅ Login.jsx
✅ Register.jsx
✅ Sidebar.jsx
✅ LanguageSwitcher.jsx

## Next Steps

To make the entire application multilingual, you should update:
- Dashboard components (OwnerDashboard, WorkerDashboard, CustomerDashboard)
- Farm management components (AddFarm, EditFarm, YourFarms)
- Cattle management components (AddCattle, EditCattle, CattleList)
- Worker components (AddWorker, WorkersList)
- Milk components (AddMilk, BuyMilk)
- Order components (MyOrders, OrdersList, PendingOrders, OrdersPage)
- Subscription components (SubscriptionsPage, SubscriptionsList)
- Profile component

## Testing the Implementation

1. Run the development server:
```bash
npm run dev
```

2. Open the application in your browser
3. Test language switching using the LanguageSwitcher component
4. Verify that all strings are translated correctly
5. Check that language preference is saved in localStorage by switching tabs and reloading

## Troubleshooting

### Strings not translating
- Ensure the translation key exists in both `en/translation.json` and `gu/translation.json`
- Check that you're using the correct syntax: `t('category.key')`
- Make sure the component has `useTranslation()` hook imported

### Language not switching
- Check browser console for errors
- Verify that localStorage is not full
- Clear browser cache and try again
- Check that i18n is initialized in `main.jsx`

### Performance Issues
- Translation files are loaded statically, so performance should be good
- Ensure you're not importing i18n config multiple times in components

## Notes
- All hardcoded strings in auth and layout components have been replaced with i18n keys
- Language preference persists across browser sessions using localStorage
- The language switcher is accessible to all users during login, registration, and in the sidebar
