import os

filepath = 'script.js'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update Registration success handler to save profile locally
    old_reg_success = """      if (res.ok) {
        const data = await res.json();
        registeredFarmer = data;
        localStorage.setItem("krushakseva_phone", registeredFarmer.phone);"""
        
    new_reg_success = """      if (res.ok) {
        const data = await res.json();
        registeredFarmer = data;
        localStorage.setItem("krushakseva_phone", registeredFarmer.phone);
        localStorage.setItem("krushakseva_profile", JSON.stringify(registeredFarmer));
        const allProfiles = JSON.parse(localStorage.getItem("krushakseva_all_profiles") || "{}");
        allProfiles[registeredFarmer.phone] = registeredFarmer;
        localStorage.setItem("krushakseva_all_profiles", JSON.stringify(allProfiles));"""
        
    code = code.replace(old_reg_success, new_reg_success)

    # 2. Update Login submit handler to check local storage first
    old_login_submit = """    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login-no-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },"""
        
    new_login_submit = """    // Check client-side database first
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
        
    code = code.replace(old_login_submit, new_login_submit)

    # 3. Update DOMContentLoaded page load handler to restore session from local cache
    old_page_load = """window.addEventListener("DOMContentLoaded", async () => {
  const savedPhone = localStorage.getItem("krushakseva_phone");
  if (savedPhone) {
    try {"""
    
    new_page_load = """window.addEventListener("DOMContentLoaded", async () => {
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
    
    code = code.replace(old_page_load, new_page_load)

    # 4. Clean up stored profile on sign out
    old_signout = """    localStorage.removeItem("krushakseva_phone");"""
    new_signout = """    localStorage.removeItem("krushakseva_phone");
    localStorage.removeItem("krushakseva_profile");"""
    
    code = code.replace(old_signout, new_signout)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print('Client-side database upgrades applied successfully!')