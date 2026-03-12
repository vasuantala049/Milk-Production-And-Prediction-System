# Usage Examples - How to Add i18n to Your Components

## Quick Start Example

### Before (Without i18n)
```javascript
export default function MyComponent() {
  return (
    <div>
      <h1>Welcome to DairyFlow</h1>
      <p>Click Save to continue</p>
      <button>Save</button>
      <button>Cancel</button>
    </div>
  );
}
```

### After (With i18n)
```javascript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('common.save')}</p>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
    </div>
  );
}
```

## Example 1: AddFarm Component
```javascript
import { useTranslation } from 'react-i18next';

export default function AddFarm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  return (
    <form>
      <div>
        <label>{t('farms.farmName')}</label>
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('farms.farmName')}
        />
      </div>
      <div>
        <label>{t('farms.location')}</label>
        <input 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('farms.location')}
        />
      </div>
      <button>{t('farms.addFarm')}</button>
    </form>
  );
}
```

## Example 2: Error Messages
```javascript
import { useTranslation } from 'react-i18next';

export default function UserForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError(t('validation.required'));
      return;
    }
    if (!email.includes('@')) {
      setError(t('validation.invalidEmail'));
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <div className="error">{error}</div>}
      <button type="submit">{t('common.submit')}</button>
    </form>
  );
}
```

## Example 3: Conditional Messages
```javascript
import { useTranslation } from 'react-i18next';

export default function OrderStatus({ status }) {
  const { t } = useTranslation();

  const getStatusLabel = () => {
    switch(status) {
      case 'pending': return t('orders.pending');
      case 'confirmed': return t('orders.confirmed');
      case 'delivered': return t('orders.delivered');
      case 'cancelled': return t('orders.cancelled');
      default: return status;
    }
  };

  return (
    <div>
      <p>{t('orders.status')}: {getStatusLabel()}</p>
    </div>
  );
}
```

## Example 4: Table Headers
```javascript
import { useTranslation } from 'react-i18next';

export default function CattleTable({ data }) {
  const { t } = useTranslation();

  return (
    <table>
      <thead>
        <tr>
          <th>{t('cattle.cattleName')}</th>
          <th>{t('cattle.breed')}</th>
          <th>{t('cattle.age')}</th>
          <th>{t('cattle.weight')}</th>
          <th>{t('cattle.health')}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.breed}</td>
            <td>{item.age}</td>
            <td>{item.weight}</td>
            <td>{item.health}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Example 5: With Pluralization (Advanced)
```javascript
import { useTranslation } from 'react-i18next';

// First, add to translation files:
// en: { "items": "{{count}} item", "items_plural": "{{count}} items" }
// gu: { "items": "{{count}} આઇટમ", "items_plural": "{{count}} આઇટમ્સ" }

export default function ItemCount({ count }) {
  const { t } = useTranslation();
  
  return (
    <p>{t('items', { count })}</p>
  );
}
```

## Example 6: Form Validation with i18n
```javascript
import { useTranslation } from 'react-i18next';

export default function AddWorker() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = t('validation.nameRequired');
    }
    if (!formData.email) {
      newErrors.email = t('validation.required');
    }
    if (!formData.phone) {
      newErrors.phone = t('validation.phoneRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Submit form
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>{t('workers.name')}</label>
        <input 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder={t('workers.name')}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <label>{t('workers.email')}</label>
        <input 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder={t('workers.email')}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <label>{t('workers.phoneNumber')}</label>
        <input 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder={t('workers.phoneNumber')}
        />
        {errors.phone && <span className="error">{errors.phone}</span>}
      </div>
      
      <button type="submit">{t('workers.addWorker')}</button>
    </form>
  );
}
```

## Example 7: Success/Error Messages
```javascript
import { useTranslation } from 'react-i18next';

export default function FarmForm() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  const handleSuccess = () => {
    setMessage(t('farms.farmCreatedSuccess'));
    setTimeout(() => setMessage(''), 3000);
  };

  const handleError = () => {
    setMessage(t('messages.errorOccurred'));
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      {message && (
        <div className={message.includes('successfully') ? 'success' : 'error'}>
          {message}
        </div>
      )}
    </div>
  );
}
```

## Example 8: Switching Language Programmatically
```javascript
import { useTranslation } from 'react-i18next';

export default function ToggleLanguageButton() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'gu' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button onClick={toggleLanguage}>
      {t('language.selectLanguage')}: {i18n.language === 'en' ? 'EN' : 'ગુ'}
    </button>
  );
}
```

## Example 9: Dashboard Component
```javascript
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      
      <div className="grid">
        <div className="card">
          <h3>{t('dashboard.totalFarms')}</h3>
          <p>5</p>
        </div>
        
        <div className="card">
          <h3>{t('dashboard.totalCattle')}</h3>
          <p>45</p>
        </div>
        
        <div className="card">
          <h3>{t('dashboard.totalMilkProduction')}</h3>
          <p>1200 L</p>
        </div>
        
        <div className="card">
          <h3>{t('dashboard.totalWorkers')}</h3>
          <p>12</p>
        </div>
      </div>
    </div>
  );
}
```

## Key Points to Remember

1. Always import `{ useTranslation } from 'react-i18next'`
2. Use `const { t, i18n } = useTranslation()` to get the translation function
3. Call `t('category.key')` to get translated text
4. Use `i18n.changeLanguage(language)` to switch languages
5. Use `i18n.language` to get the current language
6. Add new translation keys to both `en/translation.json` and `gu/translation.json`
7. Keep key names consistent and organized by category
8. Use descriptive key names that make sense

## Common Mistakes to Avoid

❌ Forgetting to import useTranslation
❌ Using undefined translation keys
❌ Not adding translations to both language files
❌ Hardcoding strings instead of using i18n keys
❌ Not maintaining consistent key structure

✅ Always use i18n keys for user-facing text
✅ Keep translation keys organized by component/feature
✅ Test both languages during development
✅ Use descriptive key names
✅ Keep translations consistent and accurate
