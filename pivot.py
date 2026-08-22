import os

# 1. Overwrite api/farmer_profile.py completely to disable server database
filepath = 'api/farmer_profile.py'
with open(filepath, 'w', encoding='utf-8') as f:
    f.write("""# Clean mock stub for client-side architecture
def get_profile(phone):
    return None

def create_or_update_profile(*args, **kwargs):
    return {}

def delete_profile(phone):
    return True
""")
print('api/farmer_profile.py database code removed!')

# 2. Patch api/index.py to bypass database calls
filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Stub the farmer-profile POST endpoint to just echo back the profile data (no disk write!)
    start_idx = code.find('@app.route("/api/farmer-profile", methods=["POST"])')
    if start_idx != -1:
        next_route_idx = code.find('@app.route', start_idx + 50)
        if next_route_idx != -1:
            stub_func = """@app.route("/api/farmer-profile", methods=["POST"])
def farmer_profile_create():
    data = request.json or {}
    return jsonify(data), 200\n\n"""
            code = code[:start_idx] + stub_func + code[next_route_idx:]

    # Make chat query read profile directly from the frontend request body
    old_profile_retrieval = """    profile = {}
    if phone:
        p = get_profile(phone)
        if p:
            profile = p"""
            
    new_profile_retrieval = """    profile = {}
    if phone:
        profile = data.get("profile", {})"""
        
    code = code.replace(old_profile_retrieval, new_profile_retrieval)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print('api/index.py database code removed!')

# 3. Patch script.js to support client-side database
filepath = 'script.js'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Save profile locally on registration success
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

    # Check local storage database first on login
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

    # Restore session from local cache on page load
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

    # Clean up local cache on sign out
    old_signout = """    localStorage.removeItem("krushakseva_phone");"""
    new_signout = """    localStorage.removeItem("krushakseva_phone");
    localStorage.removeItem("krushakseva_profile");"""
    code = code.replace(old_signout, new_signout)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print('script.js updated to use client-side database!')

print('Architectural pivot completed successfully!')