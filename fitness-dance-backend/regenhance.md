Let me review the current RegisterScreen and the design references:

[3 tools called]

## 📋 RegisterScreen Enhancement Assessment

Based on my review, here's what we can enhance:

### 🔴 **High Priority (UX Critical)**

| Issue | Current State | Enhancement Needed |
|-------|---------------|-------------------|
| **Date of Birth** | Manual text input (YYYY-MM-DD) | Proper Date Picker modal |
| **Phone Number** | Plain input | Country code selector (+95, +1, etc.) |
| **Password** | No strength indicator | Visual password strength bar |
| **Confirm Password** | Missing | Add confirm password field |
| **Terms Checkbox** | Text only | Proper checkbox to accept terms |

### 🟡 **Medium Priority (Better UX)**

| Feature | Description |
|---------|-------------|
| **Avatar Upload** | Allow user to pick profile photo during registration |
| **Height Field** | Add height input for BMI calculation |
| **Fitness Goals** | Select: Weight Loss / Muscle Gain / Stay Fit / etc. |
| **Activity Level** | Sedentary / Lightly Active / Active / Very Active |
| **Social Signup** | Google / Apple / Facebook signup buttons |

### 🟢 **Nice to Have**

| Feature | Description |
|---------|-------------|
| **Step-by-step Form** | Break into 2-3 steps instead of long scroll |
| **Real-time Validation** | Validate as user types |
| **Auto-format Phone** | Format phone number as user types |
| **Progress Bar** | Show completion progress at top |

### 📱 **Current vs Recommended Layout**

```
CURRENT:                          RECOMMENDED:
┌─────────────────────┐           ┌─────────────────────┐
│ ← Back    🇬🇧 Lang  │           │ ← Back    🇬🇧 Lang  │
│                     │           │                     │
│ Create Account      │           │ [Profile Avatar 📷] │
│ Join Z-Fit...       │           │                     │
│                     │           │ Create Account      │
│ [Name Input]        │           │ Join Z-Fit...       │
│ [Email Input]       │           │                     │
│ [Phone Input]       │           │ [Name Input]        │
│ [Password Input]    │    →      │ [Email Input]       │
│ [Gender Buttons]    │           │ [🇲🇲 +95] [Phone]   │
│ [DOB Text Input]    │           │ [Password] [Strength Bar]
│ [Weight Input]      │           │ [Confirm Password]  │
│ [Address Input]     │           │ [Gender Buttons]    │
│                     │           │ [📅 Date Picker]    │
│ [Terms text]        │           │ [Weight] [Height]   │
│ [Register Button]   │           │ [🎯 Fitness Goals]  │
│                     │           │ [☑️ Accept Terms]   │
└─────────────────────┘           │ [Register Button]   │
                                  │                     │
                                  │ ─── or signup with ───
                                  │ [G] [🍎] [f]        │
                                  └─────────────────────┘
```

### 🚀 **Would you like me to implement these enhancements?**

I recommend starting with **High Priority** items:
1. ✅ Date Picker for DOB
2. ✅ Country Code Selector for Phone
3. ✅ Password Strength Indicator
4. ✅ Confirm Password Field
5. ✅ Terms Checkbox

Should I proceed? 🛠️