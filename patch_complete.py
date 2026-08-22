import os
import glob

# 1. Update script.js with all client-side upgrades
filepath = 'script.js'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Apply registration saving
    old_reg = """      if (res.ok) {
        const data = await res.json();
        registeredFarmer = data;
        localStorage.setItem("krushakseva_phone", registeredFarmer.phone);"""
    new_reg = """      if (res.ok) {
        const data = await res.json();
        registeredFarmer = data;
        localStorage.setItem("krushakseva_phone", registeredFarmer.phone);
        localStorage.setItem("krushakseva_profile", JSON.stringify(registeredFarmer));
        const allProfiles = JSON.parse(localStorage.getItem("krushakseva_all_profiles") || "{}");
        allProfiles[registeredFarmer.phone] = registeredFarmer;
        localStorage.setItem("krushakseva_all_profiles", JSON.stringify(allProfiles));"""
    code = code.replace(old_reg, new_reg)

    # Apply login local storage check
    old_login = """    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login-no-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },"""
    new_login = """    // Check client-side database first
    const allProfiles = JSON.parse(localStorage.getItem("krushakseva_all_profiles") || "{}");
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    let localProfile = null;
    for (const key in allProfiles) {
      if (key.replace(/\D/g, "").slice(-10) === cleanPhone) {
        localProfile = allProfiles[key];
        break;
      }
    }
    if (localProfile) {
      registeredFarmer = localProfile;
      localStorage.setItem("krushakseva_phone", registeredFarmer.phone);
      localStorage.setItem("krushakseva_profile", JSON.stringify(registeredFarmer));
      document.getElementById("badge-name").textContent = registeredFarmer.name;
      document.getElementById("badge-phone").textContent = registeredFarmer.phone;
      document.getElementById("auth-portal-box").style.display = "none";
      toggleSignOutButton();
      switchTab("dashboard");
      alert(`Welcome back, ${registeredFarmer.name}!`);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login-no-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },"""
    code = code.replace(old_login, new_login)

    # Apply page load session restore
    old_load = """window.addEventListener("DOMContentLoaded", async () => {
  const savedPhone = localStorage.getItem("krushakseva_phone");
  if (savedPhone) {
    try {"""
    new_load = """window.addEventListener("DOMContentLoaded", async () => {
  const savedPhone = localStorage.getItem("krushakseva_phone");
  const savedProfile = localStorage.getItem("krushakseva_profile");
  if (savedPhone) {
    if (savedProfile) {
      registeredFarmer = JSON.parse(savedProfile);
      document.getElementById("badge-name").textContent = registeredFarmer.name;
      document.getElementById("badge-phone").textContent = registeredFarmer.phone;
      document.getElementById("auth-portal-box").style.display = "none";
      toggleSignOutButton();
      switchTab("dashboard");
      return;
    }
    try {"""
    code = code.replace(old_load, new_load)

    # Apply chatbot profile injection
    old_chat = """      body: JSON.stringify({
        message,
        phone: localStorage.getItem("krushakseva_phone"),
        history: chatHistory.slice(-10) // Send last 10 messages for context
      })"""
    new_chat = """      body: JSON.stringify({
        message,
        phone: localStorage.getItem("krushakseva_phone"),
        profile: registeredFarmer,
        history: chatHistory.slice(-10) // Send last 10 messages for context
      })"""
    code = code.replace(old_chat, new_chat)

    # Apply signout clearing
    old_signout = """    localStorage.removeItem("krushakseva_phone");"""
    new_signout = """    localStorage.removeItem("krushakseva_phone");
    localStorage.removeItem("krushakseva_profile");"""
    code = code.replace(old_signout, new_signout)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print('script.js upgraded successfully!')

# 2. Find all Python files in the api directory and replace the invalid model IDs
py_files = glob.glob('api/**/*.py', recursive=True)
for file in py_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'qwen/qwen3.6-27b' in content:
        content = content.replace('qwen/qwen3.6-27b', 'llama-3.3-70b-versatile')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Patched model ID in {file}')

print('Complete patch applied successfully!')