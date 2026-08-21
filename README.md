# 🌾 KṛṣakaSevā — AI-Powered Agricultural Assistant

KṛṣakaSevā (Kisan Alert) is an **AI-powered agricultural assistance platform** designed to help farmers make better decisions about crop selection, crop health, weather, market prices, profitability, and farming practices.

The platform is designed with **accessibility in mind**, allowing farmers with smartphones to use the web application while also providing a **voice-based AI assistance system for farmers using basic phones**.

Live Demo:https://kisan-pied.vercel.app/

## 🚜 Features

### 🌱 AI Crop Advisor

Recommends suitable crops based on:

- 📍 Location
- 🌾 Soil type
- 📐 Land size
- 💧 Water availability
- 🌤️ Season
- 💰 Expected profitability

Farmers can ask questions naturally, such as:

> "I have 3 acres of red soil and limited water. Which crop should I grow?"

### 🤖 AI Agricultural Assistant

Farmers can ask questions about:

- Crop selection
- Soil management
- Irrigation
- Pest and disease problems
- Crop profitability
- Farming practices
- Weather
- General agricultural guidance

The AI uses the farmer's registered profile information when relevant to provide personalized recommendations.

### 🧮 AI Profit Calculator

Helps farmers compare potential crop profitability using:

- Cultivation cost
- Expected yield
- Expected revenue
- Estimated profit
- Profit margin

### 🌦️ Weather Information

Provides weather-related information to help farmers make better decisions regarding:

- Sowing
- Irrigation
- Crop management
- Weather-sensitive farming activities

### 🩺 Plant Disease Detection

Farmers with smartphone access can upload a **crop or leaf image** through the website.

The system can analyze the image and provide:

- Possible plant disease
- Disease-related information
- Suggested remedies and management guidance

### 📈 Market & Mandi Information

Provides market-related information to help farmers understand crop prices and make better decisions about selling their produce.

---

## 📞 Voice AI Assistance for Farmers

A major goal of KṛṣakaSevā is to make agricultural assistance available to farmers who **do not have smartphones or may not be comfortable using smartphone applications**.

Using **Twilio**, the platform is designed to allow farmers to call using a basic keypad phone and interact with an AI agricultural assistant through voice.

Farmers can ask questions such as:

- "Which crop should I grow?"
- "Which crop is suitable for my location?"
- "Which crop will give better profit?"
- "My crop has a disease. What should I do?"
- "How much water does my crop need?"
- "What should I do to improve my crop?"

### 📱 Two Ways to Access KṛṣakaSevā

**Farmers without smartphones:**

```text
Basic / Keypad Phone
        ↓
    Phone Call
        ↓
    Twilio Voice
        ↓
   AI Assistant
        ↓
Agricultural Guidance
