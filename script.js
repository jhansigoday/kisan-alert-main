// Base Backend API configuration dynamically loaded
const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : window.location.origin;

// Global State
let currentLang = "en";
let isDarkMode = false;
let registeredFarmer = null;
let chatHistory = [];

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.slice(-10);
}

function saveLocalProfile(profile) {
  const normalizedPhone = normalizePhone(profile && profile.phone);
  if (!normalizedPhone) return;

  const storedProfile = { ...profile, phone: normalizedPhone };
  const allProfiles = JSON.parse(localStorage.getItem("krushakseva_all_profiles") || "{}");
  allProfiles[normalizedPhone] = storedProfile;
  localStorage.setItem("krushakseva_all_profiles", JSON.stringify(allProfiles));
  localStorage.setItem("krushakseva_phone", normalizedPhone);
  localStorage.setItem("krushakseva_profile", JSON.stringify(storedProfile));
  registeredFarmer = storedProfile;
}
let detectedLat = null;
let detectedLon = null;

function toggleSignOutButton() {
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.style.display = registeredFarmer ? "block" : "none";
  }
}

function translateMandiTerm(term) {
  if (!term) return "";
  if (currentLang !== "te") return term;
  const mappings = {
    "Rice (Paddy)": "వరి (ప్యాడీ)",
    "Rice": "వరి",
    "Paddy": "వరి",
    "Groundnut": "వేరుశనగ",
    "Maize (Corn)": "మొక్కజొన్న (కార్న్)",
    "Maize": "మొక్కజొన్న",
    "Corn": "మొక్కజొన్న",
    "Cotton": "పత్తి",
    "Wheat": "గోధుమలు",
    "Nellore Mandi": "నెల్లూరు మండి",
    "Kavali Mandi": "కావలి మండి",
    "Guntur Mandi": "గుంటూరు మండి",
    "Visakhapatnam Mandi": "విశాఖపట్నం మండి",
    "Anakapalle Mandi": "అనకాపల్లి మండి",
    "Vijayawada Mandi": "విజయవాడ మండి",
    "Mandi": "మండి",
    "per quintal": "క్వింటాల్‌కి",
    "Quintal": "క్వింటాల్",
    "Rising": "పెరుగుతోంది",
    "Falling": "తగ్గుతోంది",
    "Stable": "స్థిరంగా ఉంది",
    "Weekly": "వారానికి",
    "Monthly": "నెలవారీ",
    "Highly Compatible with local soil pH": "స్థానిక నేల పిహెచ్‌కి బాగా అనుకూలంగా ఉంది",
    "Highly compatible with local soil pH": "స్థానిక నేల పిహెచ్‌కి బాగా అనుకూలంగా ఉంది",
    "Medium": "మధ్యస్థం",
    "Low": "తక్కువ",
    "High": "ఎక్కువ",
    "Perfect regional climate": "అనుకూల ప్రాంతీయ వాతావరణం",
    "None observed": "ఏమీ లేదు",
    "Very High": "చాలా ఎక్కువ",
    "Urea, DAP, MOP (120:60:40 kg/ha)": "యూరియా, డిఎపి, ఎంఓపి (120:60:40 కిలోలు/హెక్టారు)",
    "Blast, Stem Borer": "అగ్గి తెగులు, కాండం తొలిచే పురుగు",
    "Nitrogen, Zinc (100:50:30 kg/ha)": "నత్రజని, జింక్ (100:50:30 కిలోలు/హెక్టారు)",
    "Fall Armyworm": "కత్తెర పురుగు",
    "Gypsum, SSP": "జిప్సం, సింగిల్ సూపర్ ఫాస్ఫేట్",
    "Tikka Leaf Spot": "టిక్కా ఆకుమచ్చ తెగులు",
    "DAP, Potash, Urea": "డిఎపి, పొటాష్, యూరియా",
    "Whitefly, Bollworm": "తెల్లదోమ, కాయతొలిచే పురుగు",
    "Government market data": "ప్రభుత్వ మార్కెట్ డేటా",
    "Official daily price": "అధికారిక రోజువారీ ధర",
    "Latest available": "చివరిగా అందుబాటులో ఉన్నది",
    "Official daily prices loaded": "అధికారిక రోజువారీ ధరలు లోడ్ చేయబద్ధాయి",
    "Last verified official prices": "చివరిగా సరిచూసిన అధికారిక ధరలు",
    "Official data unavailable": "అధికారిక సమాచారం అందుబాటులో లేదు",
    "No current official records found for this crop.": "ఈ పంటకు సంబంధించి ప్రస్తుత అధికారిక రికార్డులు కనుగొనబడలేదు.",
    "Live feed temporarily unavailable. Showing real historical market records.": "లైవ్ ఫీడ్ తాత్కాలికంగా అందుబాటులో లేదు. నిజమైన చారిత్రక మార్కెట్ రికార్డులను చూపుతోంది.",
    "Official mandi prices are temporarily unavailable. Please try again shortly.": "అధికారిక మండి ధరలు తాత్కాలికంగా అందుబాటులో లేవు. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.",
    "Mandi Market Insights": "మండి మార్కెట్ విశ్లేషణ",
    "30-Day Historical Mandi Price Trend": "30 రోజుల చారిత్రక మండి ధరల ధోరణి",
    "Tomato": "టమోటా",
    "Potato": "బంగాళాదుంప",
    "Grape": "ద్రాక్ష",
    "Apple": "ఆపిల్",
    "Paddy(Dhan)(Common)": "వరి (ధాన్యం) (సాధారణం)",
    "Paddy(Dhan)(Common) — B P T": "వరి (ధాన్యం) (BPT రకం)",
    "Paddy(Dhan)(Common) — MTU-1010": "వరి (ధాన్యం) (MTU-1010 రకం)",
    "Paddy(Dhan)(Common) — Common": "వరి (ధాన్యం) (సాధారణం)",
    "Paddy(Dhan)(Common) — 1001": "వరి (ధాన్యం) (1001 రకం)",
    "Atmakur(SPS)": "ఆత్మకూరు (SPS)",
    "Rapur": "రాపూరు",
    "Gudur": "గూడూరు",
    "Official mandi prices are taking longer than usual. Please try again in a few minutes.": "అధికారిక మండి ధరల లోడ్ కావడానికి సాధారణం కంటే ఎక్కువ సమయం పడుతోంది. దయచేసి కొన్ని నిమిషాల తర్వాత మళ్లీ ప్రయత్నించండి."
  };
  
  let translated = String(term);
  for (const [en, te] of Object.entries(mappings)) {
    const escaped = en.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = /^[a-z0-9\s]+$/i.test(en) ? `\\b${escaped}\\b` : escaped;
    const regex = new RegExp(pattern, 'gi');
    translated = translated.replace(regex, te);
  }
  return translated;
}

// Chart Instances
let marketTrendChartInstance = null;
let profitTrendChartInstance = null;
let rainHistoryChartInstance = null;
let yieldTrendChartInstance = null;

// ---------- BILINGUAL TRANSLATION DICTIONARIES ----------
const TRANSLATIONS = {
  en: {
    app_subtitle: "हे कृषक, सुखी भव।",
    nav_home: "Home",
    nav_dashboard: "Dashboard",
    nav_advisor: "Crop Advisor",
    nav_market: "Mandi Market",
    nav_doctor: "Crop Doctor",
    nav_ivr: "IVR Helpline",
    nav_extension: "Services",
    nav_analytics: "Analytics",
    btn_sos: "SOS Help",
    hero_title: "हे कृषक, सुखी भव।",
    hero_desc: "Optimize yields, diagnose diseases in under 2 seconds, consult bilingual voice assistants, and get real-time mandi weather predictions customized for your fields.",
    btn_register: "Get Registered Profile",
    btn_try_demo: "Try Web Demo",
    feat_voice_title: "Voice AI Assistant",
    feat_voice_desc: "Speak naturally in English or Telugu to receive crop advisory solutions.",
    feat_weather_title: "Climate Warnings",
    feat_weather_desc: "Receive dry-spell hazards, rain forecasts, and cyclone warnings.",
    feat_doctor_title: "Doctor Crop Diagnosis",
    feat_doctor_desc: "Upload leaf photos to identify infections and retrieve organic therapies.",
    reg_header: "Farmer Registration Portal",
    reg_hint: "Setup your profile to customize weather warnings, mandi price alerts, and crop recommendation scores.",
    form_name: "Full Name",
    form_phone: "Mobile Number",
    form_age: "Age",
    form_gender: "Gender",
    form_state: "State",
    form_district: "District",
    form_mandal: "Mandal",
    form_village: "Village",
    form_pin: "PIN Code",
    form_acres: "Land Size (Acres)",
    form_soil: "Soil Type",
    form_water: "Water Source",
    form_crop: "Current Crop",
    btn_save_profile: "Create Profile & Enter Dashboard",
    farm_health_title: "AI Farm Health Score",
    dash_weather: "Weather Forecast",
    dash_crop_status: "Crop Health Status",
    dash_alerts: "Personalized Climate Alerts",
    dash_mandi: "Live Market Mandi Prices",
    result_title: "Advisory Diagnosis Report",
    extraction_title: "Live AI Parameter Extractor",
    extraction_hint: "As the farmer presses keys, the IVR state machine automatically updates your profile variables in the database:",
    transcript_log: "Call Dialogue Log",
    
    // Weather Details
    w_feels_like: "Feels Like",
    w_humidity: "Humidity",
    w_wind_speed: "Wind Speed",
    w_wind_dir: "Wind Dir",
    w_uv_index: "UV Index",
    w_visibility: "Visibility",
    w_pressure: "Pressure",
    w_rain_prob: "Rain Prob",
    w_sunrise: "Sunrise",
    w_sunset: "Sunset",

    // Crop Health Details
    c_crop: "Crop",
    c_growth_stage: "Growth Stage",
    c_est_yield: "Estimated Yield",

    // Mandi Table Headers
    th_mandi_crop: "Crop",
    th_mandi_price: "Current Price",
    th_mandi_trend: "30-Day Trend",
    th_mandi_market: "Market Location",

    // Crop Advisor Summary Headers
    adv_title: "🌾 AI Comparative Crop Advisor Summary",
    adv_desc: "Detailed matrix analysis of selected crops compared under your farm's properties.",
    th_comp_crop: "Crop",
    th_comp_score: "Suitability Score",
    th_comp_soil: "Soil Compatibility",
    th_comp_water: "Water Requirement",
    th_comp_climate: "Climate Suitability",
    th_comp_invest: "Est. Investment",
    th_comp_yield: "Est. Yield",
    th_comp_revenue: "Expected Revenue",
    th_comp_profit: "Expected Profit",
    th_comp_risk: "Disease Risk",
    th_comp_demand: "Market Demand",
    th_comp_price: "Nearby Mandi Price",
    best_crop_choice: "Best Crop Choice",

    // Profit Calculator Headers
    calc_title: "AI Profit Calculator",
    calc_desc: "Estimate costs and profit yields dynamically depending on land specifications.",

    // Doctor Crop Diagnosis
    doctor_photo_title: "Doctor Crop Diagnosis",
    doctor_photo_desc: "Upload a leaf image of your infected crop and record a voice description to get diagnosis remedies.",
    click_to_upload: "Click here to upload leaf photo",
    no_file_selected: "No file selected",
    voice_symptom_title: "Voice Symptom Description",
    btn_start_record: "Start Record",
    btn_stop_record: "Stop",
    btn_diagnose_crop: "Diagnose Crop Health",
    diagnosis_prompt: "Upload an infected leaf photo to trigger the AI doctor diagnosis recommendations.",

    // Login Portal Card
    login_title: "Farmer Login / Registration",
    login_desc: "Enter your mobile number to log in. For new profiles, please also enter your name and location.",
    lbl_phone_req: "Mobile Number (Required)",
    lbl_location_new: "Farm Location (New Users Only)",
    btn_detect_gps: "Detect GPS",
    btn_enter_dashboard: "Enter Dashboard",

    // Crop Advisor Panel Elements
    adv_panel_desc: "Compare soil compatibility and forecast estimated profits to choose the optimal crop before sowing.",
    adv_select_title: "Select Crops of Interest to Compare",
    adv_select_desc: "Choose 3 to 5 crops you are interested in growing. The AI will evaluate coordinates soil composition, pH indexes, rainfall metrics, and mandi rates to find your optimal crop choice.",
    crop_rice: "Rice (Paddy)",
    crop_groundnut: "Groundnut",
    crop_maize: "Maize (Corn)",
    crop_cotton: "Cotton",
    crop_tomato: "Tomato",
    crop_wheat: "Wheat",
    btn_compare_crops: "Compare Selected Crops",
    
    // Profit Calculator additions
    lbl_select_land: "Select Land Size (Acres)",
    lbl_select_season: "Select Season",
    opt_kharif: "Kharif (Monsoon)",
    opt_rabi: "Rabi (Winter)",
    opt_zaid: "Zaid (Summer)",
    btn_calculate_profit: "Calculate Profit",
    th_crop_option: "Crop Option",
    th_est_cost: "Est. Cost",
    th_expected_yield: "Expected Yield",
    th_expected_revenue: "Expected Revenue",
    th_net_profit: "Net Profit",
    th_profit_margin: "Profit Margin",
    crop_rice_label: "Rice (Paddy)",
    crop_groundnut_label: "Groundnut",
    unit_quintals: "Quintals",
    
    // Chatbot additions
    chat_title: "KṛṣakaSevā Bilingual AI Assistant (English & తెలుగు)",
    chat_status: "Online 24/7",
    chat_welcome: "Hello! I am KṛṣakaSevā AI. Ask me anything about crop selection, soil, water management, weather alerts, or market prices!",
    chat_placeholder: "Type a message...",
    placeholder_name: "Enter Full Name",
    placeholder_phone: "e.g. +918247543026",
    
    // SOS Modal additions
    sos_title: "KṛṣakaSevā SOS Portal",
    sos_desc: "Your registered location details will be sent with the SOS alert.",
    sos_lbl_curr_loc: "Current Location:",
    sos_detecting_gps: "Detecting GPS...",
    sos_lbl_coords: "Coordinates:",
    sos_select_event: "Select Emergency Event Type",
    sos_opt_pest: "🐛 Severe Pest Outbreak / Locust Attack",
    sos_opt_flood: "🌊 Flash Flood / Waterlogging",
    sos_opt_cyclone: "🌪️ Cyclone / Wind Damage",
    sos_opt_drought: "☀️ Severe Drought / Crop Wilting",
    sos_helplines: "Emergency Regional Helplines",
    btn_broadcast_sos: "Broadcast SOS GPS Alert",
    btn_trigger_sos_call: "Trigger Voice Call & SMS Alert to My Number",
    market_subtitle: "Track mandi prices, compare market rates, and monitor price trends.",
    market_card_title: "Latest Official Mandi Prices",
    market_live_link: "🔗 View Official Live Mandi Data →",
    market_trend_title: "30-Day Historical Mandi Price Trend",
    market_trend_notice: "Official 30-day price history is not currently available.",
    th_market: "Market",
    th_commodity: "Commodity",
    th_min_price: "Minimum Price",
    th_max_price: "Maximum Price",
    th_modal_price: "Modal Price",
    th_reported_date: "Reported Date",
    th_source: "Source",
    awaiting_data_title: "Awaiting official price data",
    awaiting_data_desc: "Loading official mandi prices for your crop and saved location.",
    mandi_insights_title: "Mandi Market Insights"
  },
  te: {
    app_subtitle: "ఓ రైతు, వర్ధిల్లు!",
    nav_home: "హోమ్",
    nav_dashboard: "డ్యాష్‌బోర్డ్",
    nav_advisor: "పంట సలహాదారు",
    nav_market: "మండి మార్కెట్",
    nav_doctor: "పంట వైద్యుడు",
    nav_ivr: "హెల్ప్‌లైన్",
    nav_extension: "సేవలు",
    nav_analytics: "విశ్లేషణలు",
    btn_sos: "సహాయం",
    hero_title: "ఓ రైతు, వర్ధిల్లు!",
    hero_desc: "పంట దిగుబడిని పెంచుకోండి, 2 సెకన్లలో వ్యాధి నిర్ధారణ చేయండి, ద్విభాషా వాయిస్ సహాయకులతో మాట్లాడండి మరియు రియల్ టైమ్ మండి ధరలను పొందండి.",
    btn_register: "నమోదు చేసుకోండి",
    btn_try_demo: "వెబ్ డెమో",
    feat_voice_title: "వాయిస్ సహాయకురాలు",
    feat_voice_desc: "ఇంగ్లీష్ లేదా తెలుగులో సులభంగా మాట్లాడి పంట సలహాలు పొందండి.",
    feat_weather_title: "వాతావరణ హెచ్చరికలు",
    feat_weather_desc: "వర్షాలు, తుఫానులు మరియు వాతావరణ మార్పుల హెచ్చరికలు పొందండి.",
    feat_doctor_title: "పంట వ్యాధి నిర్ధారణ",
    feat_doctor_desc: "పంట ఆకు ఫోటోను అప్‌లోడ్ చేసి క్షణాల్లో నివారణ చర్యలు తెలుసుకోండి.",
    reg_header: "రైతు ప్రొఫైల్ నమోదు",
    reg_hint: "మీ ప్రొఫైల్ నమోదు చేసుకోవడం ద్వారా వాతావరణం మరియు మండి ధరలను ఎప్పటికప్పుడు తెలుసుకోండి.",
    form_name: "పూర్తి పేరు",
    form_phone: "మొబైల్ సంఖ్య",
    form_age: "వయస్సు",
    form_gender: "లింగం",
    form_state: "రాష్ట్రం",
    form_district: "జిల్లా",
    form_mandal: "మండలం",
    form_village: "గ్రామం",
    form_pin: "పిన్ కోడ్",
    form_acres: "భూమి పరిమాణం (ఎకరాలు)",
    form_soil: "నేల రకం",
    form_water: "నీటి వనరు",
    form_crop: "ప్రస్తుత పంట",
    btn_save_profile: "ప్రొఫైల్ సృష్టించండి",
    farm_health_title: "AI పంట ఆరోగ్య స్కోరు",
    dash_weather: "వాతావరణ సూచన",
    dash_crop_status: "పంట ఆరోగ్య పరిస్థితి",
    dash_alerts: "వ్యక్తిగత హెచ్చరికలు",
    dash_mandi: "మండి మార్కెట్ ధరలు",
    result_title: "పంట చికిత్స నివేదిక",
    extraction_title: "లైవ్ AI పారామీటర్ ఎక్స్‌ట్రాక్టర్",
    extraction_hint: "రైతు కీప్యాడ్ నొక్కుతుంటే, IVR సిస్టమ్ ఆటోమేటిక్‌గా ప్రొఫైల్ వివరాలను అప్‌డేట్ చేస్తుంది:",
    transcript_log: "కాల్ సంభాషణ వివరాలు",
    
    // Weather Details
    w_feels_like: "శరీరానికి అనిపించే ఉష్ణోగ్రత",
    w_humidity: "గాలిలో తేమ",
    w_wind_speed: "గాలి వేగం",
    w_wind_dir: "గాలి దిశ",
    w_uv_index: "UV ఇండెక్స్",
    w_visibility: "దృశ్యమానత",
    w_pressure: "పీడనం",
    w_rain_prob: "వర్షం పడే అవకాశం",
    w_sunrise: "సూర్యోదయం",
    w_sunset: "సూర్యాస్తమయం",

    // Crop Health Details
    c_crop: "పంట",
    c_growth_stage: "పెరుగుదల దశ",
    c_est_yield: "అంచనా దిగుబడి",

    // Mandi Table Headers
    th_mandi_crop: "పంట",
    th_mandi_price: "ప్రస్తుత ధర",
    th_mandi_trend: "30 రోజుల ట్రెండ్",
    th_mandi_market: "మార్కెట్ స్థానం",

    // Crop Advisor Summary Headers
    adv_title: "🌾 AI తులనాత్మక పంట సలహాదారు సారాంశం",
    adv_desc: "మీ పొలం పరిస్థితుల ఆధారంగా ఎంచుకున్న పంటల వివరణాత్మక పోలిక విశ్లేషణ.",
    th_comp_crop: "పంట",
    th_comp_score: "అనుకూలత స్కోరు",
    th_comp_soil: "నేల అనుకూలత",
    th_comp_water: "నీటి అవసరం",
    th_comp_climate: "వాతావరణ అనుకూలత",
    th_comp_invest: "అంచనా పెట్టుబడి",
    th_comp_yield: "అంచనా దిగుబడి",
    th_comp_revenue: "ఆశించిన ఆదాయం",
    th_comp_profit: "ఆశించిన లాభం",
    th_comp_risk: "వ్యాధి ముప్పు",
    th_comp_demand: "మార్కెట్ డిమాండ్",
    th_comp_price: "సమీప మండి ధర",
    best_crop_choice: "ఉత్తమ పంట ఎంపిక",

    // Profit Calculator Headers
    calc_title: "AI లాభాల గణన",
    calc_desc: "భూమి వివరాల ఆధారంగా ఖర్చులు మరియు లాభాలను అంచనా వేయండి.",

    // Doctor Crop Diagnosis
    doctor_photo_title: "పంట వ్యాధి నిర్ధారణ (క్రాప్ డాక్టర్)",
    doctor_photo_desc: "నివారణ మార్గాలను పొందడానికి మీ సోకిన పంట యొక్క ఆకు చిత్రాన్ని అప్‌లోడ్ చేయండి మరియు వాయిస్ వివరణను రికార్డ్ చేయండి.",
    click_to_upload: "ఆకు ఫోటోను అప్‌లోడ్ చేయడానికి ఇక్కడ క్లిక్ చేయండి",
    no_file_selected: "ఫైల్ ఏదీ ఎంచుకోలేదు",
    voice_symptom_title: "వాయిస్ ద్వారా తెగులు లక్షణాల వివరణ",
    btn_start_record: "రికార్డింగ్ ప్రారంభించండి",
    btn_stop_record: "ఆపండి",
    btn_diagnose_crop: "పంట ఆరోగ్యాన్ని నిర్ధారించండి",
    diagnosis_prompt: "AI డాక్టర్ నిర్ధారణ సిఫార్సులను పొందడానికి సోకిన ఆకు ఫోటోను అప్‌లోడ్ చేయండి.",

    // Login Portal Card
    login_title: "రైతు లాగిన్ / నమోదు",
    login_desc: "లాగిన్ అవ్వడానికి మీ మొబైల్ సంఖ్యను నమోదు చేయండి. కొత్త ప్రొఫైల్స్ కోసం, దయచేసి మీ పేరు మరియు నివాస స్థలాన్ని కూడా నమోదు చేయండి.",
    lbl_phone_req: "మొబైల్ సంఖ్య (తప్పనిసరి)",
    lbl_location_new: "పొలం నివాస స్థలం (కొత్త వినియోగదారులు మాత్రమే)",
    btn_detect_gps: "GPS గుర్తించు",
    btn_enter_dashboard: "డ్యాష్‌బోర్డ్‌లోకి ప్రవేశించండి",

    // Crop Advisor Panel Elements
    adv_panel_desc: "విత్తనాలు నాటడానికి ముందు సరైన పంటను ఎంచుకోవడానికి నేల అనుకూలతను పోల్చండి మరియు అంచనా వేసిన లాభాలను అంచనా వేయండి.",
    adv_select_title: "పోల్చడానికి ఆసక్తి ఉన్న పంటలను ఎంచుకోండి",
    adv_select_desc: "మీరు పండించాలనుకునే 3 నుండి 5 పంటలను ఎంచుకోండి. మీ స్థానిక నేల రకం, పిహెచ్ ఇండెక్స్, వర్షపాతం మరియు మండి ధరలను అంచనా వేసి AI మీకు సరైన పంటను ఎంపిక చేస్తుంది.",
    crop_rice: "వరి (ప్యాడీ)",
    crop_groundnut: "వేరుశనగ",
    crop_maize: "మొక్కజొన్న (కార్న్)",
    crop_cotton: "పత్తి",
    crop_tomato: "టమోటా",
    crop_wheat: "గోధుమ",
    btn_compare_crops: "ఎంచుకున్న పంటలను పోల్చండి",
    
    // Profit Calculator additions
    lbl_select_land: "భూమి పరిమాణం ఎంచుకోండి (ఎకరాలు)",
    lbl_select_season: "పంట కాలాన్ని (సీజన్) ఎంచుకోండి",
    opt_kharif: "ఖరీఫ్ (వర్షాకాలం)",
    opt_rabi: "రబీ (చలికాలం)",
    opt_zaid: "జైద్ (వేసవి కాలం)",
    btn_calculate_profit: "లాభాన్ని లెక్కించండి",
    th_crop_option: "పంట ఎంపిక",
    th_est_cost: "అంచనా వ్యయం",
    th_expected_yield: "ఆశించిన దిగుబడి",
    th_expected_revenue: "ఆశించిన ఆదాయం",
    th_net_profit: "నికర లాభం",
    th_profit_margin: "లాభాల శాతం",
    crop_rice_label: "వరి (ప్యాడీ)",
    crop_groundnut_label: "వేరుశనగ",
    unit_quintals: "క్వింటాళ్లు",
    
    // Chatbot additions
    chat_title: "కృషకసేవ ద్విభాషా AI సహాయకుడు (English & తెలుగు)",
    chat_status: "ఆన్‌లైన్ 24/7",
    chat_welcome: "నమస్కారం! నేను కృషకసేవ AI సహాయకుడిని. పంట ఎంపిక, నేల, నీటి యాజమాన్యం, వాతావరణ హెచ్చరికలు లేదా మార్కెట్ ధరల గురించి నన్ను ఏదైనా అడగండి!",
    chat_placeholder: "సందేశాన్ని టైప్ చేయండి...",
    placeholder_name: "పూర్తి పేరు నమోదు చేయండి",
    placeholder_phone: "ఉదా. +918247543026",
    
    // SOS Modal additions
    sos_title: "కృషకసేవ SOS అత్యవసర పోర్టల్",
    sos_desc: "మీ రిజిస్టర్డ్ నివాస స్థలం వివరాలు SOS అత్యవసర అలర్ట్‌తో పంపబడతాయి.",
    sos_lbl_curr_loc: "ప్రస్తుత నివాస స్థలం:",
    sos_detecting_gps: "GPS గుర్తిస్తోంది...",
    sos_lbl_coords: "అక్షాంశ రేఖాంశాలు:",
    sos_select_event: "అత్యవసర సంఘటన రకాన్ని ఎంచుకోండి",
    sos_opt_pest: "🐛 తీవ్రమైన తెగుళ్లు / మిడతల దాడి",
    sos_opt_flood: "🌊 హఠాత్తు వరదలు / నీటి ముంపు",
    sos_opt_cyclone: "🌪️ తుఫాను / ఈదురుగాలుల నష్టం",
    sos_opt_drought: "☀️ తీవ్రమైన కరవు / పంట ఎండిపోవడం",
    sos_helplines: "అత్యవసర ప్రాంతీయ హెల్ప్‌లైన్లు",
    btn_broadcast_sos: "SOS GPS అలర్ట్‌ను ప్రసారం చేయండి",
    btn_trigger_sos_call: "నా నంబర్‌కు వాయిస్ కాల్ & SMS అలర్ట్‌ను పంపండి",
    market_subtitle: "మండి ధరలను ట్రాక్ చేయండి, మార్కెట్ రేట్లను పోల్చండి మరియు ధరల ధోరణులను పర్యవేక్షించండి.",
    market_card_title: "తాజా అధికారిక మండి ధరలు",
    market_live_link: "🔗 అధికారిక ప్రత్యక్ష మండి డేటాను చూడండి →",
    market_trend_title: "30-Day Historical Mandi Price Trend",
    market_trend_notice: "అధికారిక 30 రోజుల ధరల చరిత్ర ప్రస్తుతం అందుబాటులో లేదు.",
    th_market: "మార్కెట్",
    th_commodity: "కమోడిటీ",
    th_min_price: "కనీస ధర",
    th_max_price: "గరిష్ట ధర",
    th_modal_price: "సగటు ధర",
    th_reported_date: "నివేదించిన తేదీ",
    th_source: "మూలం",
    awaiting_data_title: "అధికారిక ధరల సమాచారం కోసం వేచి ఉంది",
    awaiting_data_desc: "మీ పంట మరియు సేవ్ చేసిన ప్రదేశానికి సంబంధించిన అధికారిక మండి ధరలను లోడ్ చేస్తోంది.",
    mandi_insights_title: "మండి మార్కెట్ విశ్లేషణ"
  }
};

// ---------- PAGE NAVIGATION & TAB SYSTEM ----------
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetTab = link.dataset.tab;
    if (!registeredFarmer && targetTab !== "landing" && targetTab !== "ivr") {
      alert("Please login or register using the secure OTP portal first.");
      document.getElementById("register-section").scrollIntoView({ behavior: "smooth" });
      return;
    }
    switchTab(targetTab);
  });
});

function switchTab(tabId) {
  document.querySelectorAll(".nav-link").forEach(lnk => {
    lnk.classList.toggle("active", lnk.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `panel-${tabId}`);
  });

  if (tabId === "market") {
    setTimeout(() => {
      const lat = registeredFarmer ? registeredFarmer.latitude : (detectedLat || 14.4426);
      const lon = registeredFarmer ? registeredFarmer.longitude : (detectedLon || 79.9865);
      loadMandiMarketData(registeredFarmer ? registeredFarmer.crop_type : "Rice", lat, lon, registeredFarmer ? registeredFarmer.location : "");
    }, 100);
  } else if (tabId === "analytics") {
    setTimeout(toggleAnalyticsState, 100);
  }
}

document.getElementById("heroRegisterBtn").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("register-section").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("heroDemoBtn").addEventListener("click", (e) => {
  e.preventDefault();
  switchTab("ivr");
});

// ---------- BILINGUAL TRANSLATION STATE ----------
const langToggleBtn = document.getElementById("langToggleBtn");
langToggleBtn.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "te" : "en";
  updateLanguageUI();
  if (registeredFarmer) {
    updateDashboardWithProfile(registeredFarmer);
  } else {
    const lat = detectedLat || 14.4426;
    const lon = detectedLon || 79.9865;
    fetchWeatherForCoordinates(lat, lon);
  }
});

function updateLanguageUI() {
  const trans = TRANSLATIONS[currentLang];
  
  document.querySelectorAll("[data-translate-key]").forEach(elem => {
    const key = elem.getAttribute("data-translate-key");
    if (trans[key]) {
      if (elem.tagName === "INPUT" || elem.tagName === "TEXTAREA") {
        elem.placeholder = trans[key];
      } else {
        const textSpan = elem.querySelector("span");
        if (textSpan) {
          textSpan.textContent = trans[key];
        } else {
          elem.textContent = trans[key];
        }
      }
    }
  });

  document.querySelectorAll(".nav-menu a").forEach(link => {
    const tabName = link.dataset.tab;
    const key = `nav_${tabName}`;
    const span = link.querySelector("span");
    if (span && trans[key]) {
      span.textContent = trans[key];
    }
  });

  const forecastHeading = document.getElementById("weather-forecast-title-heading");
  if (forecastHeading) {
    forecastHeading.textContent = currentLang === "en" ? "7-Day Local Forecast" : "7-రోజుల స్థానిక వాతావరణ సూచన";
  }

  const langTextSpan = document.querySelector("#langToggleBtn span");
  if (langTextSpan) {
    langTextSpan.textContent = currentLang === "en" ? "తెలుగు (Telugu)" : "English";
  }

  const subTitleSpan = document.querySelector(".logo-text span");
  if (subTitleSpan) {
    subTitleSpan.textContent = trans["app_subtitle"];
  }

  // Translate login name input placeholder
  const nameInput = document.getElementById("auth-name-input");
  if (nameInput) {
    nameInput.placeholder = currentLang === "te" ? "ఉదా. ఝాన్సీ" : "e.g. Jhansi";
  }

  // Toggle sign out button display
  toggleSignOutButton();

  // Update dynamic greeting and dashboard crop stage/yield in selected language
  if (registeredFarmer) {
    updateDashboardWithProfile(registeredFarmer);
  } else {
    const greetElem = document.getElementById("dash-greeting");
    if (greetElem) {
      greetElem.textContent = currentLang === "te" ? "స్వాగతం, రైతు! 👋" : "Welcome, Farmer! 👋";
    }
  }
}

// ---------- LIGHT & SLATE DARK THEME ----------
const themeToggleBtn = document.getElementById("themeToggleBtn");
themeToggleBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-theme", isDarkMode);
  themeToggleBtn.innerHTML = isDarkMode 
    ? `<i class="fa-solid fa-sun"></i>` 
    : `<i class="fa-solid fa-moon"></i>`;
});

// ---------- GPS DETECTION & REVERSE GEOCODING SERVICE ----------
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`, {
      headers: { "User-Agent": "KrishakaSevaPlatform/1.0" }
    });
    if (!res.ok) throw new Error("OSM Nominatim API error");
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      return {
        state: addr.state || "Andhra Pradesh",
        district: addr.county || addr.district || addr.state_district || "Nellore",
        mandal: addr.suburb || addr.city_district || addr.municipality || "Nellore East",
        village: addr.village || addr.town || addr.city || addr.suburb || "Maddipadu",
        pin: addr.postcode || "524201"
      };
    }
  } catch (e) {
    console.error("OSM Nominatim Geocoding failed:", e);
  }
  return null;
}

document.getElementById("detectGpsBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      detectedLat = position.coords.latitude;
      detectedLon = position.coords.longitude;
      
      const geoResult = await reverseGeocode(detectedLat, detectedLon);
      
      if (geoResult) {
        if (geoResult.state) document.getElementById("reg-state").value = geoResult.state;
        if (geoResult.district) document.getElementById("reg-district").value = geoResult.district;
        if (geoResult.mandal) document.getElementById("reg-mandal").value = geoResult.mandal;
        if (geoResult.village) document.getElementById("reg-village").value = geoResult.village;
        if (geoResult.pin) document.getElementById("reg-pin").value = geoResult.pin;
      }
      
      // Update weather immediately using coordinates
      fetchWeatherForCoordinates(detectedLat, detectedLon);
      
      if (registeredFarmer) {
        registeredFarmer.latitude = detectedLat;
        registeredFarmer.longitude = detectedLon;
        if (geoResult) {
          registeredFarmer.location = `${geoResult.village || ""}, ${geoResult.district || ""}, ${geoResult.state || ""}`;
        }
        updateDashboardWithProfile(registeredFarmer);
      }
    }, error => {
      alert("GPS location permission denied or timed out. Please enter your location manually.");
    });
  }
});

// ---------- DIRECT PHONE LOGIN & SIGNUP TOGGLING ----------
document.getElementById("toggle-to-signup").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("auth-portal-box").style.display = "none";
  document.getElementById("farmerRegistrationForm").style.display = "block";
});

document.getElementById("toggle-to-login").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("farmerRegistrationForm").style.display = "none";
  document.getElementById("auth-portal-box").style.display = "block";
});

document.getElementById("loginNoOtpBtn").addEventListener("click", async () => {
  const phone = document.getElementById("auth-phone-input").value.trim();
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone.length !== 10) {
    alert("Please enter a valid mobile number.");
    return;
  }

  let profileToUse = null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/farmer-profile/${cleanPhone}`);
    if (res.ok) {
      profileToUse = await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch profile from server, checking local fallback:", err);
  }

  if (!profileToUse) {
    const allProfiles = JSON.parse(localStorage.getItem("krushakseva_all_profiles") || "{}");
    profileToUse = Object.values(allProfiles).find(
      p => normalizePhone(p && p.phone) === cleanPhone
    );
  }

  if (!profileToUse) {
    alert("Account not found. Please Sign Up first.");
    return;
  }

  saveLocalProfile(profileToUse);
  document.getElementById("auth-portal-box").style.display = "none";
  document.getElementById("farmerRegistrationForm").style.display = "none";
  updateDashboardWithProfile(registeredFarmer);
  switchTab("dashboard");
  alert(`Welcome back, ${registeredFarmer.name || "Farmer"}!`);
});


// ---------- FARMER REGISTRATION & FIRESTORE PROFILE ----------
const registrationForm = document.getElementById("farmerRegistrationForm");
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById("reg-phone").value.trim();
  const name = document.getElementById("reg-name").value;
  const location = `${document.getElementById("reg-village").value}, ${document.getElementById("reg-district").value}, ${document.getElementById("reg-state").value}`;
  const land_acres = parseFloat(document.getElementById("reg-acres").value);
  const crop = document.getElementById("reg-crop").value;
  const soil = document.getElementById("reg-soil").value;
  const water = document.getElementById("reg-water").value;
  const waterAvail = document.getElementById("reg-water-availability").value;
  const soilPhVal = parseFloat(document.getElementById("reg-soil-ph").value) || 0.0;
  
  const payload = {
    phone: phone,
    name: name,
    location: location,
    land_size_acres: land_acres,
    crop_type: crop,
    soil_type: soil,
    irrigation_method: water,
    water_availability: waterAvail,
    soil_ph: soilPhVal,
    latitude: detectedLat || 14.4426,
    longitude: detectedLon || 79.9865
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/farmer-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const profile = await res.json();
      saveLocalProfile(profile);
      updateDashboardWithProfile(registeredFarmer);
      document.getElementById("auth-portal-box").style.display = "none";
      document.getElementById("farmerRegistrationForm").style.display = "none";
      switchTab("dashboard");
    } else {
      const data = await res.json();
      alert(data.error || "Error saving profile details to backend.");
    }
  } catch (err) {
    alert("Connection error when connecting to Flask profile DB: " + err.message);
  }
});

function updateDashboardWithProfile(profile) {
  const isTe = currentLang === "te";
  
  // Use dynamically translated Telugu name from backend profile, default to English or "Farmer" / "రైతు"
  const mappedName = isTe ? (profile.name_telugu || profile.name || "రైతు") : (profile.name || "Farmer");
  
  // Dynamic greeting translation
  document.getElementById("dash-greeting").textContent = isTe 
    ? `స్వాగతం, ${mappedName}! 👋` 
    : `Welcome, ${mappedName}! 👋`;
    
  document.getElementById("dash-sub").textContent = isTe 
    ? `నమోదైన నివాస స్థలం: ${profile.location}` 
    : `Location registered: ${profile.location}`;
    
  document.getElementById("dash-crop-name").textContent = translateMandiTerm(profile.crop_type || "Rice");
  
  // Do not present an invented crop stage or yield before a sowing date and
  // field observations have been recorded.
  const stageElem = document.getElementById("dash-crop-stage");
  if (stageElem) {
    stageElem.textContent = isTe ? "విత్తన తేదీ నమోదు కాలేదు" : "Sowing date not recorded";
  }
  const yieldElem = document.getElementById("dash-crop-yield");
  if (yieldElem) {
    yieldElem.textContent = isTe ? "ప్రమాద అంచనా లోడ్ అవుతోంది…" : "Loading risk assessment…";
  }
  
  let lat = profile.latitude || 14.4426;
  let lon = profile.longitude || 79.9865;
  
  document.getElementById("badge-name").textContent = mappedName;
  document.getElementById("badge-phone").textContent = profile.phone;
  
  // Toggle sign out button
  toggleSignOutButton();
  
  // Fetch real coordinates weather metrics
  fetchWeatherForCoordinates(lat, lon);
  loadFarmRiskAssessment(profile, lat, lon);
  
  // Fetch soil and weather parameters crop suitability recommendations
  loadCropRecommendations(lat, lon, profile.soil_type, profile.water_availability, profile.irrigation_method, profile.soil_ph);
  
  // Fetch location aware mandi rates
  loadMandiMarketData(profile.crop_type || "Rice", lat, lon, profile.location || "");
  
  // Toggle analytics view
  toggleAnalyticsState();
}

async function loadFarmRiskAssessment(profile, lat, lon) {
  const params = new URLSearchParams({
    lat, lon,
    crop_type: profile.crop_type || "",
    soil_type: profile.soil_type || "",
    soil_ph: profile.soil_ph || "",
    water_availability: profile.water_availability || "",
    irrigation_method: profile.irrigation_method || "",
    land_size_acres: profile.land_size_acres || ""
  });
  try {
    const res = await fetch(`${BACKEND_URL}/api/field-health?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Risk assessment unavailable");

    const score = Math.round(data.risk_score);
    const scoreElem = document.getElementById("healthScoreValue");
    const msgElem = document.getElementById("healthScoreMsg");
    const fillElem = document.querySelector(".status-gauge-bar .gauge-fill");
    const yieldElem = document.getElementById("dash-crop-yield");
    if (scoreElem) scoreElem.textContent = score;
    if (msgElem) msgElem.textContent = currentLang === "te" ? "వాతావరణం మరియు ప్రొఫైల్ ఆధారిత ప్రమాద స్కోరు" : "Weather and profile risk score";
    if (fillElem) {
      fillElem.style.width = `${score}%`;
      fillElem.className = `gauge-fill ${score >= 80 ? "green-fill" : score >= 60 ? "yellow-fill" : "red-fill"}`;
    }
    if (yieldElem) yieldElem.textContent = `${score}% — ${data.health_status}`;
  } catch (err) {
    const msgElem = document.getElementById("healthScoreMsg");
    if (msgElem) msgElem.textContent = currentLang === "te" ? "ప్రత్యక్ష ప్రమాద అంచనా అందుబాటులో లేదు" : "Live risk assessment unavailable";
  }
}

// ---------- API LIVE FETCH WEATHER SERVICES ----------
async function fetchWeatherForCoordinates(lat, lon) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/weather-alert?lat=${lat}&lon=${lon}&lang=${currentLang}`);
    const data = await res.json();
    if (res.ok && data.weather) {
      // 1. Current Weather Details Card Update
      document.getElementById("dash-temp").textContent = Math.round(data.weather.temp_c);
      document.getElementById("dash-weather-condition").textContent = data.weather.condition;
      
      const iconContainer = document.getElementById("weather-icon-main");
      if (iconContainer) {
        iconContainer.innerHTML = `<i class="fa-solid ${data.weather.icon}"></i>`;
      }
      
      document.getElementById("dash-feels").textContent = `${Math.round(data.weather.feels_like)}°C`;
      document.getElementById("dash-humidity").textContent = `${data.weather.humidity}%`;
      document.getElementById("dash-wind").textContent = `${data.weather.wind_speed} km/h`;
      document.getElementById("dash-wind-dir").textContent = `${data.weather.wind_direction}°`;
      document.getElementById("dash-uv").textContent = data.weather.uv_index;
      document.getElementById("dash-visibility").textContent = `${(data.weather.visibility / 1000).toFixed(1)} km`;
      document.getElementById("dash-pressure").textContent = `${data.weather.pressure} hPa`;
      document.getElementById("dash-rain-prob").textContent = `${data.weather.rain_prob}%`;
      document.getElementById("dash-sunrise").textContent = data.weather.sunrise;
      document.getElementById("dash-sunset").textContent = data.weather.sunset;
      
      // 2. Render 7-Day forecast
      const forecastContainer = document.getElementById("weather-forecast-list");
      if (forecastContainer && data.forecast) {
        forecastContainer.innerHTML = "";
        data.forecast.forEach(day => {
          const dateObj = new Date(day.date);
          // Correct weekday mapping using getDay()
          const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayNamesTe = ["ఆధి", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"];
          const dayName = currentLang === "te" ? dayNamesTe[dateObj.getDay()] : dayNamesEn[dateObj.getDay()];
          
          const dayCard = document.createElement("div");
          dayCard.className = "forecast-day-card";
          dayCard.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color);";
          dayCard.innerHTML = `
            <span class="day" style="font-weight:600; font-size:12px; color: var(--text-main);">${dayName}</span>
            <div class="icon" style="font-size:18px; color: var(--primary); margin: 4px 0;"><i class="fa-solid ${day.icon}"></i></div>
            <span class="temp" style="font-size:11px; font-weight:500; color: var(--text-main);">${Math.round(day.temp_max_c)} / ${Math.round(day.temp_min_c)}</span>
            <span style="font-size:9px; color: var(--text-muted);">Rain: ${day.rain_prob}%</span>
          `;
          forecastContainer.appendChild(dayCard);
        });
      }
      
      // 3. Update Notifications alerts box
      const alertBox = document.getElementById("dash-alerts-box");
      if (alertBox) {
        alertBox.innerHTML = "";
        
        // Render severe weather warning alerts
        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach(alert => {
            const li = document.createElement("li");
            li.className = "alert-item high-alert";
            li.innerHTML = `
              <i class="fa-solid fa-circle-exclamation"></i>
              <div class="alert-details">
                <strong>${alert.message}</strong>
                <span>${data.suggestions[0] || "Take appropriate field countermeasures immediately."}</span>
              </div>
            `;
            alertBox.appendChild(li);
          });
          
          // Trigger automated Twilio alerts to user's phone
          if (registeredFarmer) {
            triggerTwilioSevereAlerts(registeredFarmer.phone);
          }
        }
        
        // Render agricultural suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          data.suggestions.forEach(sug => {
            const li = document.createElement("li");
            li.className = "alert-item info-alert";
            li.innerHTML = `
              <i class="fa-solid fa-circle-info"></i>
              <div class="alert-details">
                <strong>AI Farming Suggestion</strong>
                <span>${sug}</span>
              </div>
            `;
            alertBox.appendChild(li);
          });
        }
      }
    }
  } catch (err) {
    console.log("Could not load weather details:", err);
  }
}

async function triggerTwilioSevereAlerts(phone) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/trigger-alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone })
    });
    const result = await res.json();
    if (result.status === "dispatched") {
      console.log("Outbound Twilio severe weather alerts triggered successfully:", result);
    }
  } catch (err) {
    console.log("Error dispatching outbound calls/texts:", err);
  }
}

// ---------- DYNAMIC COMPARATIVE CROP ADVISOR ----------
async function loadCropRecommendations(lat, lon, soil = "alluvial", waterAvail = "Medium", irrigation = "borewell", ph = 0.0) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/crop-recommendation?lat=${lat}&lon=${lon}&soil_type=${soil}&water_availability=${waterAvail}&irrigation_source=${irrigation}&soil_ph=${ph}&lang=${currentLang}`);
    const data = await res.json();
    if (res.ok && data.recommended_crops) {
      // Clean up fallback grids on the dashboard if present
      console.log("Dynamic advisor crop suitability list loaded:", data.recommended_crops);
    }
  } catch (err) {
    console.log("Could not load suitability rankings:", err);
  }
}

const compareCropsBtn = document.getElementById("compareCropsBtn");
if (compareCropsBtn) {
  compareCropsBtn.addEventListener("click", async () => {
    const checkedBoxes = document.querySelectorAll("input[name='crop_compare_pref']:checked");
    const selectedCrops = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (selectedCrops.length < 3 || selectedCrops.length > 5) {
      alert("Please select between 3 and 5 crops to compare.");
      return;
    }
    
    const loading = document.getElementById("compareCropsLoading");
    const resultBox = document.getElementById("advisorComparisonResultBox");
    const tbody = document.getElementById("cropComparisonTableBody");
    
    if (loading) loading.style.display = "block";
    if (resultBox) resultBox.style.display = "block";
    tbody.innerHTML = "";
    
    try {
      const lat = registeredFarmer ? registeredFarmer.latitude : (detectedLat || 14.4426);
      const lon = registeredFarmer ? registeredFarmer.longitude : (detectedLon || 79.9865);
      
      const res = await fetch(`${BACKEND_URL}/api/crop-recommendation/detailed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: registeredFarmer ? registeredFarmer.location : "Andhra Pradesh",
          land_size: registeredFarmer ? registeredFarmer.land_size_acres : 5.0,
          soil_type: registeredFarmer ? registeredFarmer.soil_type : "Black",
          water_resources: registeredFarmer ? registeredFarmer.irrigation_method : "borewell",
          language: currentLang,
          lat: lat,
          lon: lon,
          selected_crops: selectedCrops
        })
      });
      
      const data = await res.json();
      if (loading) loading.style.display = "none";
      
      if (res.ok && data.comparison) {
        tbody.innerHTML = "";
        data.comparison.forEach(item => {
          const tr = document.createElement("tr");
          
          const cropVal = translateMandiTerm(item.crop);
          const scoreVal = Math.round((item.suitability_score || 8) * 10) + "%";
          const soilVal = translateMandiTerm(item.soil_compatibility || "—");
          const waterVal = translateMandiTerm(item.water_requirement || "—");
          const climateVal = translateMandiTerm(item.climate_suitability || "—");
          const investVal = translateMandiTerm(item.expected_investment || item.investment || "—");
          const yieldVal = translateMandiTerm(item.expected_yield || "—");
          const revVal = translateMandiTerm(item.expected_revenue || item.revenue || "—");
          const profitVal = translateMandiTerm(item.expected_profit || item.profit || "—");
          const riskVal = translateMandiTerm(item.disease_risk || item.risk || "—");
          const demandVal = translateMandiTerm(item.local_demand || "—");
          const priceVal = translateMandiTerm(item.mandi_price || "—");

          tr.innerHTML = `
            <td><strong>${cropVal}</strong></td>
            <td>${scoreVal}</td>
            <td>${soilVal}</td>
            <td>${waterVal}</td>
            <td>${climateVal}</td>
            <td>${investVal}</td>
            <td>${yieldVal}</td>
            <td>${revVal}</td>
            <td class="net-profit-val">${profitVal}</td>
            <td>${riskVal}</td>
            <td>${demandVal}</td>
            <td>${priceVal}</td>
          `;
          tbody.appendChild(tr);
        });
        
        document.getElementById("bestCropNameText").textContent = translateMandiTerm(data.best_crop || selectedCrops[0]);
        document.getElementById("bestCropExplanationText").textContent = data.explanation || "";
        document.getElementById("bestCropRecommendationBanner").style.display = "flex";
      }
    } catch (err) {
      if (loading) loading.style.display = "none";
      console.error("Comparison load failed:", err);
    }
  });
}

async function loadMandiMarketData(crop = "Rice", lat = 14.4426, lon = 79.9865, location = "") {
  const cacheKey = getMandiCacheKey(crop, location);
  try {
    const query = new URLSearchParams({ crop, lat, lon, location });
    const res = await fetch(`${BACKEND_URL}/api/market-price?${query}`);
    const data = await res.json();
    if (!res.ok || !data.available) {
      const message = getSafeMandiMessage(data.message);
      renderCachedMandiOrUnavailable(cacheKey, message);
      return;
    }
    // Only live responses are verified snapshots. Reference records must not
    // later appear as if they were a live cache.
    const cacheRecord = data.data_mode === "live" ? saveMandiCache(cacheKey, data) : { history: [] };
    renderMandiPrices(data, null, cacheRecord.history);
  } catch (err) {
    console.log("Could not load mandi prices:", err);
    renderCachedMandiOrUnavailable(cacheKey, "Official mandi prices are temporarily unavailable. Please try again shortly.");
  }
}

function getMandiCacheKey(crop, location) {
  return `krushakseva_mandi_cache_${String(crop).toLowerCase().trim()}_${String(location).toLowerCase().trim()}`;
}

function saveMandiCache(cacheKey, data) {
  try {
    const now = new Date();
    const previous = JSON.parse(localStorage.getItem(cacheKey) || "null") || {};
    const history = Array.isArray(previous.history) ? previous.history : [];
    const day = now.toISOString().slice(0, 10);
    const price = Number(data.modal_price);
    if (Number.isFinite(price) && !history.some(item => item.date === day)) {
      history.push({ date: day, price });
    }
    const record = { data, verifiedAt: now.toISOString(), history: history.slice(-30) };
    localStorage.setItem(cacheKey, JSON.stringify(record));
    return record;
  } catch (err) {
    console.log("Could not cache official mandi prices:", err);
    return { history: [] };
  }
}

function renderCachedMandiOrUnavailable(cacheKey, message) {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    const cacheAge = cached && Date.now() - new Date(cached.verifiedAt).getTime();
    if (cached && cached.data && cacheAge >= 0 && cacheAge <= 7 * 24 * 60 * 60 * 1000) {
      renderMandiPrices(cached.data, cached.verifiedAt, cached.history || []);
      return;
    }
  } catch (err) {
    console.log("Could not read cached mandi prices:", err);
  }
  showMandiUnavailable(message);
}

function renderMandiPrices(data, cachedAt = null, history = []) {
  const markets = Array.isArray(data.nearest_markets) ? data.nearest_markets : [];
  const isHistorical = data.data_mode === "historical" || Boolean(cachedAt);
  const freshness = cachedAt
    ? `Live update delayed. Showing last verified official data from ${new Date(cachedAt).toLocaleString()}.`
    : isHistorical ? "Live feed temporarily unavailable. Showing real historical market records." : "Live Government Data — latest official daily prices.";
  const body = document.getElementById("dash-prices-body");
  if (body) {
    body.innerHTML = "";
    markets.forEach(m => {
      const tr = document.createElement("tr");
      const area = [m.district, m.state].filter(Boolean).join(", ");
      const price = Number(m.price ?? m.modal_price);
      tr.innerHTML = `<td>${translateMandiTerm(data.crop)}</td><td>₹${price.toLocaleString()} / ${currentLang === "te" ? "క్వింటాల్" : "Quintal"}</td><td>${isHistorical ? "Latest available" : "Official daily price"}</td><td>${translateMandiTerm(m.market)}${area ? ` (${area})` : ""}</td>`;
      body.appendChild(tr);
    });
  }
  const marketBody = document.getElementById("market-prices-body");
  if (marketBody) {
    marketBody.innerHTML = "";
    markets.forEach(m => {
      const tr = document.createElement("tr");
      const area = [m.district, m.state].filter(Boolean).join(", ");
      const modal = Number(m.price ?? m.modal_price);
      const minimum = Number(m.min_price);
      const maximum = Number(m.max_price);
      tr.innerHTML = `<td>${translateMandiTerm(m.market)}${area ? `<br><small>${area}</small>` : ""}</td><td>${m.commodity || data.crop}</td><td>${Number.isFinite(minimum) ? `₹${minimum.toLocaleString()} / Quintal` : "—"}</td><td>${Number.isFinite(maximum) ? `₹${maximum.toLocaleString()} / Quintal` : "—"}</td><td>₹${modal.toLocaleString()} / Quintal</td><td>${m.reported_date || "Not supplied"}</td><td>${m.source || data.source || "Government market data"}</td>`;
      marketBody.appendChild(tr);
    });
  }
  const source = document.getElementById("marketDataSource");
  if (source) source.textContent = `${freshness} Source: ${data.source || "AGMARKNET official data"}`;
  setMandiStatus(isHistorical ? "historical" : "live");
  const retryButton = document.getElementById("retryMandiPricesBtn");
  if (retryButton) retryButton.style.display = isHistorical ? "inline-flex" : "none";
  const notice = document.getElementById("marketChartNotice");
  const comparisonTitle = document.getElementById("marketComparisonTitle");
  if (isHistorical && markets.length) {
    if (comparisonTitle) comparisonTitle.textContent = "Nearby Market Price Comparison";
    if (notice) {
      notice.textContent = "Reference records shown in the table are genuine reported market prices, not a 30-day trend.";
      notice.style.display = "block";
    }
    updateMarketComparisonChart(data.crop, markets);
  } else if (history.length >= 2) {
    if (comparisonTitle) comparisonTitle.textContent = "30-Day Historical Mandi Price Trend";
    if (notice) notice.style.display = "none";
    updateMarketTrendChart(data.crop, history.map(item => item.price), history.map(item => item.date));
  } else if (notice) {
    if (comparisonTitle) comparisonTitle.textContent = "30-Day Historical Mandi Price Trend";
    notice.textContent = "30-day history will build automatically from verified daily official price snapshots.";
    notice.style.display = "block";
  }
  const insightsBox = document.querySelector(".price-insights-card");
  if (insightsBox) {
    insightsBox.innerHTML = `<h3>${currentLang === "te" ? "మండి మార్కెట్ విశ్లేషణ" : "Mandi Market Insights"}</h3><div class="insight-row"><div class="icon"><i class="fa-solid fa-circle-check"></i></div><div class="info"><strong>${cachedAt ? "Last verified official prices" : "Official daily prices loaded"}</strong><span>${freshness}</span></div></div>`;
  }
}

function showMandiUnavailable(message) {
  const rawMessage = getSafeMandiMessage(message);
  const safeMessage = translateMandiTerm(rawMessage);
  const comparisonTitle = document.getElementById("marketComparisonTitle");
  if (comparisonTitle) comparisonTitle.textContent = currentLang === "te" ? "మార్కెట్ సమాచారం అందుబాటులో లేదు" : "Market Data Unavailable";
  if (marketTrendChartInstance) {
    marketTrendChartInstance.destroy();
    marketTrendChartInstance = null;
  }
  const notice = document.getElementById("marketChartNotice");
  if (notice) {
    notice.textContent = safeMessage;
    notice.style.display = "block";
  }
  const insightsBox = document.querySelector(".price-insights-card");
  if (insightsBox) {
    insightsBox.innerHTML = `<h3>${currentLang === "te" ? "మండి మార్కెట్ విశ్లేషణ" : "Mandi Market Insights"}</h3><div class="insight-row"><div class="icon"><i class="fa-solid fa-circle-info"></i></div><div class="info"><strong>${currentLang === "te" ? "అధికారిక డేటా అందుబాటులో లేదు" : "Official data unavailable"}</strong><span>${safeMessage}</span></div></div>`;
  }
  const source = document.getElementById("marketDataSource");
  if (source) source.textContent = safeMessage;
  setMandiStatus("unavailable");
  const retryButton = document.getElementById("retryMandiPricesBtn");
  if (retryButton) retryButton.style.display = "inline-flex";
  const body = document.getElementById("dash-prices-body");
  if (body) body.innerHTML = `<tr><td colspan="4">${safeMessage}</td></tr>`;
  const marketBody = document.getElementById("market-prices-body");
  if (marketBody) marketBody.innerHTML = `<tr><td colspan="7">${safeMessage}</td></tr>`;
}

function setMandiStatus(status) {
  const badge = document.getElementById("marketDataStatus");
  if (!badge) return;
  if (status === "live") {
    badge.textContent = currentLang === "te" ? "🟢 ప్రత్యక్ష ప్రభుత్వ డేటా" : "🟢 Live Government Data";
    badge.style.background = "#dcfce7";
    badge.style.color = "#166534";
  } else if (status === "historical") {
    badge.textContent = currentLang === "te" ? "🟡 సూచన మార్కెట్ డేటా · లైవ్ ఫీడ్ అందుబాటులో లేదు" : "🟡 Reference Market Data · Live feed unavailable";
    badge.style.background = "#fef3c7";
    badge.style.color = "#92400e";
  } else {
    badge.textContent = currentLang === "te" ? "🔴 మండి సమాచారం అందుబాటులో లేదు" : "🔴 Mandi Data Temporarily Unavailable";
    badge.style.background = "#fee2e2";
    badge.style.color = "#991b1b";
  }
}

function getSafeMandiMessage(message) {
  return message && !/(timeout|connectionpool|host=|traceback|exception|read timed out)/i.test(message)
    ? message
    : "Official mandi prices are temporarily unavailable. Please try again shortly.";
}

const retryMandiPricesBtn = document.getElementById("retryMandiPricesBtn");
if (retryMandiPricesBtn) {
  retryMandiPricesBtn.addEventListener("click", () => {
    if (!registeredFarmer) return;
    retryMandiPricesBtn.disabled = true;
    retryMandiPricesBtn.textContent = currentLang === "te" ? "ధరలను రిఫ్రెష్ చేస్తోంది..." : "Refreshing official prices...";
    loadMandiMarketData(
      registeredFarmer.crop_type || "Rice",
      registeredFarmer.latitude || detectedLat || 14.4426,
      registeredFarmer.longitude || detectedLon || 79.9865,
      registeredFarmer.location || ""
    ).finally(() => {
      retryMandiPricesBtn.disabled = false;
      retryMandiPricesBtn.innerHTML = currentLang === "te" ? '<i class="fa-solid fa-rotate"></i> మళ్ళీ ప్రయత్నించండి' : '<i class="fa-solid fa-rotate"></i> Retry official prices';
    });
  });
}

// ---------- AI PROFIT CALCULATOR STATE ----------
document.getElementById("calculateProfitBtn").addEventListener("click", () => {
  const acres = parseFloat(document.getElementById("calc-acres").value) || 1;
  const body = document.getElementById("calc-results-body");
  
  const riceCost = Math.round(9000 * acres);
  const riceRev = Math.round(52000 * acres);
  const riceProfit = riceRev - riceCost;
  
  const nutsCost = Math.round(11000 * acres);
  const nutsRev = Math.round(54800 * acres);
  const nutsProfit = nutsRev - nutsCost;
  
  const isTe = currentLang === "te";
  const riceLabel = isTe ? "వరి (ప్యాడీ)" : "Rice (Paddy)";
  const groundnutLabel = isTe ? "వేరుశనగ" : "Groundnut";
  const quintalsLabel = isTe ? "క్వింటాళ్లు" : "Quintals";
  const winnerSuffix = isTe ? " 🏆 (ఉత్తమ ఎంపిక)" : " 🏆";

  body.innerHTML = `
    <tr class="best-performer" style="background-color: var(--primary-glow); border-left: 4px solid var(--primary);">
      <td>🌾 ${riceLabel}${winnerSuffix}</td>
      <td>₹${riceCost.toLocaleString()}</td>
      <td>${Math.round(24 * acres)} ${quintalsLabel}</td>
      <td>₹${riceRev.toLocaleString()}</td>
      <td class="net-profit-val">₹${riceProfit.toLocaleString()}</td>
      <td>${((riceProfit / riceRev)*100).toFixed(1)}%</td>
    </tr>
    <tr>
      <td>🥜 ${groundnutLabel}</td>
      <td>₹${nutsCost.toLocaleString()}</td>
      <td>${Math.round(8 * acres)} ${quintalsLabel}</td>
      <td>₹${nutsRev.toLocaleString()}</td>
      <td class="net-profit-val">₹${nutsProfit.toLocaleString()}</td>
      <td>${((nutsProfit / nutsRev)*100).toFixed(1)}%</td>
    </tr>
  `;
});

// ---------- DOCTOR CROP & MULTIMODAL REMEDIES ----------
let doctorRecorder = null;
let doctorChunks = [];
let doctorBlob = null;

const recordSymptomBtn = document.getElementById("recordSymptomBtn");
const stopSymptomBtn = document.getElementById("stopSymptomBtn");
const leafImageInput = document.getElementById("leafImageInput");

recordSymptomBtn.addEventListener("click", async () => {
  doctorChunks = [];
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    doctorRecorder = new MediaRecorder(stream);
    doctorRecorder.ondataavailable = e => doctorChunks.push(e.data);
    doctorRecorder.onstop = () => {
      doctorBlob = new Blob(doctorChunks, { type: "audio/webm" });
      document.getElementById("recordingWave").textContent = "Audio query captured successfully.";
    };
    doctorRecorder.start();
    recordSymptomBtn.disabled = true;
    stopSymptomBtn.disabled = false;
    document.getElementById("recordingWave").style.display = "block";
    document.getElementById("recordingWave").textContent = "Recording symptom description...";
  } catch (err) {
    alert("Microphone capture failed. Please check browser permissions: " + err);
  }
});

stopSymptomBtn.addEventListener("click", () => {
  if (doctorRecorder) {
    doctorRecorder.stop();
  }
  recordSymptomBtn.disabled = false;
  stopSymptomBtn.disabled = true;
});

leafImageInput.addEventListener("change", () => {
  const file = leafImageInput.files[0];
  if (file) {
    document.getElementById("uploadFileName").textContent = file.name;
  } else {
    document.getElementById("uploadFileName").textContent = "No file selected";
  }
});

document.getElementById("getDiagnosisBtn").addEventListener("click", async () => {
  const imageFile = leafImageInput.files[0];
  const audioBlob = doctorBlob;
  
  if (!imageFile && !audioBlob) {
    alert("Please select a leaf photo or record a voice symptom description first.");
    return;
  }
  
  const loading = document.getElementById("diagnosisLoading");
  const resultBox = document.getElementById("diagnosisResultBox");
  
  loading.style.display = "block";
  resultBox.innerHTML = "";
  
  try {
    let response, data;
    const formData = new FormData();
    const isTe = currentLang === "te";
    const lblDisease = isTe ? "కనుగొనబడిన తెగులు" : "Detected Disease";
    const lblCrop = isTe ? "గుర్తించిన పంట" : "Detected Crop";
    const lblConfidence = isTe ? "ఖచ్చితత్వం" : "Confidence";
    const lblSymptoms = isTe ? "లక్షణాలు" : "Symptoms";
    const lblCauses = isTe ? "కారణాలు" : "Causes";
    const lblTreatment = isTe ? "చికిత్స" : "Treatment";
    const lblOrganic = isTe ? "సేంద్రీయ నివారణ" : "Organic Solution";
    const lblChemical = isTe ? "రసాయన నివారణ" : "Chemical Solution";
    const lblPreventive = isTe ? "నివారణ చర్యలు" : "Preventive Measures";
    const lblAiAdvice = isTe ? "AI సిఫార్సులు" : "AI Recommendations";
    const lblVoice = isTe ? "వాయిస్ వివరణ (ప్లే ఆడియో)" : "Spoken Explanation (Play Audio)";
    const lblEscalate = isTe ? "సహాయం అవసరమా?" : "Need Assistance?";
    const valEscalate = isTe ? "సమీప రైతు సేవా కేంద్రాన్ని (RSK) సంప్రదించండి" : "Contact nearest Rythu Seva Kendra (RSK) or Soil Lab";

    formData.append("lang", currentLang);
    formData.append("phone", registeredFarmer ? registeredFarmer.phone : "");
    if (registeredFarmer) {
      formData.append("profile", JSON.stringify(registeredFarmer));
      if (registeredFarmer.latitude) {
        formData.append("lat", registeredFarmer.latitude);
        formData.append("lon", registeredFarmer.longitude);
      }
    } else if (detectedLat) {
      formData.append("lat", detectedLat);
      formData.append("lon", detectedLon);
    }

    if (imageFile) {
      formData.append("image", imageFile);
      if (audioBlob) {
        formData.append("audio", audioBlob, "voice.webm");
      }
      response = await fetch(`${BACKEND_URL}/api/photo-query`, { method: "POST", body: formData });
    } else {
      formData.append("audio", audioBlob, "voice.webm");
      response = await fetch(`${BACKEND_URL}/api/voice-query`, { method: "POST", body: formData });
    }
    
    const responseType = response.headers.get("content-type") || "";
    if (responseType.includes("application/json")) {
      data = await response.json();
    } else {
      // A deployment gateway can return an HTML error page. Do not attempt to
      // parse it as JSON or expose a browser syntax error to the farmer.
      data = { error: "Crop Doctor is temporarily unavailable. Please try again in a moment." };
    }
    loading.style.display = "none";
    
    if (!response.ok) {
      resultBox.innerHTML = `<div class="report-section-details color-red">Error: ${data.error || "Failed to get advice."}</div>`;
      return;
    }
    const diagnosisState = data.diagnosis_state || "unavailable";
    const isUncertainDiagnosis = !["high", "moderate"].includes(diagnosisState);
    const diagnosisHeading = diagnosisState === "moderate"
      ? (isTe ? "సాధ్యమైన తెగులు" : "Possible Disease")
      : isUncertainDiagnosis
        ? (isTe ? "నమ్మకంగా నిర్ధారించలేకపోయాము" : "Unable to reliably diagnose this image")
        : lblDisease;
    const confidencePercent = data && data.confidence !== null && data.confidence !== undefined
      ? Number(data.confidence) * 100
      : NaN;
    const confidenceText = Number.isFinite(confidencePercent)
      ? `${Number.isInteger(confidencePercent) ? confidencePercent : confidencePercent.toFixed(1)}% ${lblConfidence}`
      : (isTe ? "ఖచ్చితత్వం అందుబాటులో లేదు" : "Confidence unavailable");
    const diagnosisMessage = data.diagnosis_message || (diagnosisState === "moderate"
      ? (isTe ? "నిర్ధారణ కోసం మరింత స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి." : "Please upload a clearer image for confirmation.")
      : "");

    if (!isUncertainDiagnosis && data.disease_label) {
      try {
        const history = JSON.parse(localStorage.getItem("krushakseva_diagnosis_history") || "[]");
        history.push({
          date: new Date().toISOString(),
          crop: data.crop_name || (registeredFarmer ? registeredFarmer.crop_type : "Unknown"),
          disease: data.disease_label,
          location: registeredFarmer ? registeredFarmer.location : "Unknown"
        });
        localStorage.setItem("krushakseva_diagnosis_history", JSON.stringify(history));
      } catch (e) {
        console.log("Could not save diagnosis to history:", e);
      }
    }
    
    resultBox.innerHTML = `
      <div class="diagnosis-report" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; margin-top: 16px; box-sizing: border-box;">
        <div class="report-header-badge" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <strong style="font-size: 16px; color: var(--primary);"><i class="fa-solid fa-leaf"></i> ${isUncertainDiagnosis ? diagnosisHeading : `${diagnosisHeading}: ${data.disease_label || "—"}`}</strong>
            ${data.crop_name ? `<span style="font-size:13px; color:var(--text-muted); font-weight:600;">${lblCrop}: ${data.crop_name}</span>` : ""}
          </div>
          <span style="background: var(--primary-glow); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">${confidenceText}</span>
        </div>
        ${diagnosisMessage ? `<div style="background:${isUncertainDiagnosis ? "rgba(245, 158, 11, 0.12)" : "var(--primary-glow)"}; color:var(--text-main); padding:10px 12px; border-radius:8px; font-size:13px; line-height:1.45;">${diagnosisMessage}</div>` : ""}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-circle-info"></i> ${lblSymptoms}</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${data.symptoms || "—"}</p>
          </div>
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-bug"></i> ${lblCauses}</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${data.causes || "—"}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-kit-medical"></i> ${lblTreatment}</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${data.treatment || "—"}</p>
          </div>
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-seedling"></i> ${lblOrganic}</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${data.organic_solution || "—"}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-flask"></i> ${lblChemical}</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${data.chemical_solution || "—"}</p>
          </div>
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-shield-halved"></i> ${lblPreventive}</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${data.preventive_measures || "—"}</p>
          </div>
        </div>

        <div class="report-section-details" style="background: var(--primary-glow); padding: 16px; border-radius: 8px; border: 1px solid var(--primary-glow);">
          <strong style="color: var(--primary); font-size: 14px;"><i class="fa-solid fa-wand-magic-sparkles"></i> ${lblAiAdvice}</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-main); line-height: 1.5; font-weight: 500;">${data.advisory_text || "—"}</p>
        </div>

        ${data.audio_reply_url ? `
          <div class="report-section-details" style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-main); font-size: 13px;"><i class="fa-solid fa-volume-high"></i> ${lblVoice}</strong>
            <audio controls src="${data.audio_reply_url.startsWith('data:') ? data.audio_reply_url : (BACKEND_URL + data.audio_reply_url)}" style="width:100%; margin-top:8px;"></audio>
          </div>
        ` : ""}

        <div class="report-section-details" style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.15);">
          <strong style="color: #ef4444; font-size: 13px;"><i class="fa-solid fa-phone-volume"></i> ${lblEscalate}</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
            ${valEscalate}: <strong>Nellore RSK (Distance 2.4km)</strong>. Phone: <a href="tel:+919848012345" style="color: var(--primary); text-decoration: none;">+91 98480 12345</a>
          </p>
        </div>
      </div>
    `;
  } catch (err) {
    loading.style.display = "none";
    resultBox.innerHTML = `<div class="report-section-details color-red">Connection error: ${err.message}</div>`;
  }
});

// ---------- SMART IVR PHONE SIMULATOR ----------
let ivrSessionId = null;
let ivrActive = false;
let ivrSeconds = 0;
let ivrTimerInterval = null;
let simulatorMode = "survey";

const dialCallBtn = document.getElementById("dialCallBtn");
const hangCallBtn = document.getElementById("hangCallBtn");
const dialerKeypad = document.getElementById("dialerKeypad");
const simTranscriptBox = document.getElementById("simTranscriptBox");
const simulatorAudioPlayer = document.getElementById("simulatorAudioPlayer");
const repeatIVRReplyBtn = document.getElementById("repeatIVRReplyBtn");
let latestIVRResponse = null;

function speakIVRResponse(response, onFinished = null) {
  const text = String(response.text || "").trim();
  const language = response.language === "te" ? "te" : "en";
  let finished = false;
  const complete = () => {
    if (finished) return;
    finished = true;
    if (onFinished) onFinished();
    else if (ivrActive) document.getElementById("phone-call-status").textContent = "Select a keypad option to continue";
  };
  let browserFallbackStarted = false;
  const speakInBrowser = () => {
    if (browserFallbackStarted) return;
    browserFallbackStarted = true;
    if (!text || !("speechSynthesis" in window)) {
      complete();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "te" ? "te-IN" : "en-IN";
    utterance.rate = 0.92;
    const matchingVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith(language === "te" ? "te" : "en-in"));
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.onend = complete;
    utterance.onerror = complete;
    window.speechSynthesis.speak(utterance);
  };

  latestIVRResponse = { ...response, language };
  if (repeatIVRReplyBtn) repeatIVRReplyBtn.style.display = "inline-flex";
  document.getElementById("phone-call-status").textContent = "KrishakaSeva Assistant Speaking";
  simulatorAudioPlayer.pause();
  simulatorAudioPlayer.onended = complete;
  simulatorAudioPlayer.onerror = speakInBrowser;
  if (response.audio_url) {
    simulatorAudioPlayer.src = response.audio_url.startsWith("data:")
      ? response.audio_url
      : `${BACKEND_URL}${response.audio_url}`;
    simulatorAudioPlayer.play().catch(speakInBrowser);
  } else {
    speakInBrowser();
  }
}

if (repeatIVRReplyBtn) {
  repeatIVRReplyBtn.addEventListener("click", () => {
    if (latestIVRResponse) speakIVRResponse(latestIVRResponse);
  });
}

dialCallBtn.addEventListener("click", async () => {
  ivrActive = true;
  ivrSeconds = 0;
  dialCallBtn.style.display = "none";
  hangCallBtn.style.display = "flex";
  dialerKeypad.style.display = "grid";
  document.getElementById("phoneCallTimer").style.display = "block";
  document.getElementById("phone-call-status").textContent = "Ringing Helpline...";
  simTranscriptBox.innerHTML = `<div class="ai-msg">Call established. Connected to KrishakaSeva Helpdesk...</div>`;
  
  resetChecklist();
  
  ivrTimerInterval = setInterval(() => {
    ivrSeconds++;
    const mins = String(Math.floor(ivrSeconds / 60)).padStart(2, '0');
    const secs = String(ivrSeconds % 60).padStart(2, '0');
    document.getElementById("phoneCallTimer").textContent = `${mins}:${secs}`;
  }, 1000);
  
  try {
    const payload = {
      phone: registeredFarmer ? registeredFarmer.phone : "+918247543026",
      lat: registeredFarmer ? registeredFarmer.latitude : (detectedLat || 14.4426),
      lon: registeredFarmer ? registeredFarmer.longitude : (detectedLon || 79.9865)
    };
    const startUrl = simulatorMode === "sos" ? `${BACKEND_URL}/api/sos/web/start` : `${BACKEND_URL}/api/ivr/web/start`;
    const response = await fetch(startUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    ivrSessionId = data.session_sid;
    
    appendSimTranscript("ai", data.text);
    speakIVRResponse(data);
  } catch (err) {
    appendSimTranscript("system", "Error connecting helpline call.");
  }
});

hangCallBtn.addEventListener("click", () => {
  hangUpHelpline();
});

function hangUpHelpline() {
  ivrActive = false;
  clearInterval(ivrTimerInterval);
  document.getElementById("phoneCallTimer").style.display = "none";
  document.getElementById("phone-call-status").textContent = "Call Terminated";
  dialCallBtn.style.display = "flex";
  hangCallBtn.style.display = "none";
  dialerKeypad.style.display = "none";
  simulatorAudioPlayer.pause();
  simulatorAudioPlayer.src = "";
  simulatorAudioPlayer.onended = null;
  simulatorAudioPlayer.onerror = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (repeatIVRReplyBtn) repeatIVRReplyBtn.style.display = "none";
  appendSimTranscript("system", "Call Ended.");
  simulatorMode = "survey";
}

function appendSimTranscript(sender, text) {
  const bubble = document.createElement("div");
  bubble.className = sender === "ai" ? "chat-bubble ai-bubble" : "chat-bubble farmer-bubble";
  bubble.textContent = text;
  simTranscriptBox.appendChild(bubble);
  simTranscriptBox.scrollTop = simTranscriptBox.scrollHeight;
}

document.querySelectorAll(".keypad-key").forEach(key => {
  key.addEventListener("click", async () => {
    if (!ivrActive || !ivrSessionId) return;
    const digit = key.dataset.key;
    
    appendSimTranscript("farmer", `Pressed Key: ${digit}`);
    
    try {
      const stepUrl = simulatorMode === "sos" ? `${BACKEND_URL}/api/sos/web/step` : `${BACKEND_URL}/api/ivr/web/step`;
      const response = await fetch(stepUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_sid: ivrSessionId,
          digit: digit,
          phone: registeredFarmer ? registeredFarmer.phone : "+918247543026",
          lat: registeredFarmer ? registeredFarmer.latitude : (detectedLat || 14.4426),
          lon: registeredFarmer ? registeredFarmer.longitude : (detectedLon || 79.9865)
        })
      });
      const data = await response.json();
      
      if (data.profile) {
        updateChecklist(data.profile);
      }
      
      appendSimTranscript("ai", data.text);
      
      if (data.is_finished) {
        speakIVRResponse(data, () => {
          setTimeout(() => {
            hangUpHelpline();
            appendSimTranscript("system", "Call finished! Farmer details saved to database.");
            if (data.profile) {
              updateDashboardWithProfile(data.profile);
            }
          }, 1200);
        });
      } else {
        speakIVRResponse(data);
      }
    } catch (err) {
      appendSimTranscript("system", "Transmission error during DTMF digit processing.");
    }
  });
});

function resetChecklist() {
  const keys = ["crop_type", "land_size", "soil_type", "water_availability", "problem"];
  keys.forEach(k => {
    const item = document.getElementById(`chk-${k}`);
    if (item) {
      item.classList.remove("verified");
      item.querySelector(".check-value").textContent = "—";
      item.querySelector(".check-icon i").className = "fa-regular fa-circle";
    }
  });
}

function updateChecklist(profile) {
  const mapping = {
    crop_type: profile.crop_type,
    land_size: profile.land_size,
    soil_type: profile.soil_type,
    water_availability: profile.water_availability,
    problem: profile.problem
  };
  
  for (const [key, value] of Object.entries(mapping)) {
    const item = document.getElementById(`chk-${key}`);
    if (item && value && value !== "unknown" && value !== "—") {
      item.classList.add("verified");
      item.querySelector(".check-value").textContent = value;
      item.querySelector(".check-icon i").className = "fa-solid fa-circle-check";
    }
  }
}

// ---------- FLOATING CHATBOT DIALOGUE ----------
const chatbotWidget = document.getElementById("chatbotWidget");
const toggleChatBtn = document.getElementById("toggleChatBtn");
const chatWindow = document.getElementById("chatWindow");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatMessagesBox = document.getElementById("chatMessagesBox");
const chatInputText = document.getElementById("chatInputText");
const sendChatBtn = document.getElementById("sendChatBtn");

toggleChatBtn.addEventListener("click", () => {
  chatWindow.style.display = chatWindow.style.display === "none" ? "flex" : "none";
});

closeChatBtn.addEventListener("click", () => {
  chatWindow.style.display = "none";
});

sendChatBtn.addEventListener("click", () => {
  sendMessageChat();
});

chatInputText.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessageChat();
  }
});

let isChatLoading = false;

async function sendMessageChat() {
  const text = chatInputText.value.trim();
  if (!text) return;
  if (isChatLoading) return;
  
  isChatLoading = true;
  chatInputText.disabled = true;
  sendChatBtn.disabled = true;
  
  // User bubble
  const userDiv = document.createElement("div");
  userDiv.className = "user-msg";
  userDiv.textContent = text;
  chatMessagesBox.appendChild(userDiv);
  chatInputText.value = "";
  chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  
  // Add to local history
  chatHistory.push({ role: "user", content: text });
  if (chatHistory.length > 10) {
    chatHistory.shift();
  }

  // Loading indicator
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "ai-msg typing-indicator";
  loadingDiv.textContent = currentLang === "en" ? "Generating response..." : "సమాధానాన్ని రూపొందిస్తోంది...";
  chatMessagesBox.appendChild(loadingDiv);
  chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25-second timeout
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(0, -1),
        phone: registeredFarmer ? registeredFarmer.phone : "",
        profile: registeredFarmer || {},
        lang: currentLang
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    loadingDiv.remove();
    
    const aiDiv = document.createElement("div");
    aiDiv.className = "ai-msg";
    
    if (res.ok) {
      const data = await res.json();
      aiDiv.textContent = data.reply || (currentLang === "en" ? "Unable to generate a response right now. Please try again." : "సమాధానం పొందడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.");
      chatMessagesBox.appendChild(aiDiv);
      // Add to history
      chatHistory.push({ role: "assistant", content: data.reply });
    } else if (res.status === 429) {
      aiDiv.textContent = currentLang === "en" ? "AI assistant is currently busy. Please try again in a few minutes." : "AI సహాయకుడు ప్రస్తుతం బిజీగా ఉన్నారు. దయచేసి కొన్ని నిమిషాల తర్వాత మళ్లీ ప్రయత్నించండి.";
      chatMessagesBox.appendChild(aiDiv);
    } else {
      aiDiv.textContent = currentLang === "en" ? "Unable to generate a response right now. Please try again." : "సమాధానం పొందడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.";
      chatMessagesBox.appendChild(aiDiv);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    loadingDiv.remove();
    const aiDiv = document.createElement("div");
    aiDiv.className = "ai-msg";
    if (err.name === "AbortError") {
      aiDiv.textContent = currentLang === "en" ? "Request timed out. Please try again." : "సమాధానం పొందడంలో చాలా సమయం పట్టింది. దయచేసి మళ్లీ ప్రయత్నించండి.";
    } else {
      aiDiv.textContent = currentLang === "en" ? "Unable to generate a response right now. Please try again." : "సమాధానం పొందడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.";
    }
    chatMessagesBox.appendChild(aiDiv);
  } finally {
    isChatLoading = false;
    chatInputText.disabled = false;
    sendChatBtn.disabled = false;
    chatInputText.focus();
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }
}

// ---------- CHART.JS RENDER LOGIC ----------
function updateMarketTrendChart(cropName, trendArray, labels = null) {
  const ctx = document.getElementById("marketTrendChart").getContext("2d");
  
  if (marketTrendChartInstance) {
    marketTrendChartInstance.destroy();
  }

  const chartLabels = labels || Array.from({length: 30}, (_, i) => `Day ${i+1}`);

  marketTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: `${cropName} Mandi Rate Trend (₹ / Quintal)`,
        data: trendArray,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(200, 200, 200, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { display: false }
        }
      }
    }
  });
}

function updateMarketComparisonChart(cropName, markets) {
  const canvas = document.getElementById("marketTrendChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (marketTrendChartInstance) marketTrendChartInstance.destroy();

  marketTrendChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: markets.map(m => m.market),
      datasets: [{
        label: `${cropName} modal price (₹ / Quintal)`,
        data: markets.map(m => Number(m.price ?? m.modal_price)),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false, ticks: { color: "#64748b" } },
        x: { ticks: { color: "#64748b" } },
      },
    },
  });
}

function getSeededRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  let seed = Math.abs(hash);
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function calculateRevenue(yieldPerAcre, area, pricePerQuintal) {
  return Math.round(yieldPerAcre * area * pricePerQuintal);
}

function calculateTotalCost(baseCostPerAcre, area, yearMultiplier, seasonMultiplier, irrigationMultiplier) {
  return Math.round(baseCostPerAcre * area * yearMultiplier * seasonMultiplier * irrigationMultiplier);
}

function calculateNetProfit(revenue, totalCost) {
  return revenue - totalCost;
}

function calculateWaterUsage(irrigationType) {
  const irr = String(irrigationType).toLowerCase();
  if (irr.includes("drip")) {
    return 9500; 
  } else if (irr.includes("sprinkler")) {
    return 12000;
  } else if (irr.includes("flood") || irr.includes("overhead")) {
    return 16000;
  }
  return null; 
}

function getMandiPriceForCrop(crop) {
  try {
    const cacheKey = `krushakseva_mandi_cache_${crop.toLowerCase().replace(/\s+/g, "_")}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached && cached.data && cached.data.nearest_markets && cached.data.nearest_markets.length) {
      const prices = cached.data.nearest_markets.map(m => Number(m.price ?? m.modal_price)).filter(Number.isFinite);
      if (prices.length) {
        return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      }
    }
  } catch (err) {
    console.log("Could not read mandi price from cache:", err);
  }
  return null;
}

function getFarmAnalyticsRecord(crop, season, year, location) {
  const rand = getSeededRandom(`${crop}_${season}_${year}_${location}`);
  const area = registeredFarmer && registeredFarmer.crop_type === crop ? parseFloat(registeredFarmer.land_size_acres || 5) : 5;
  const irrigation = registeredFarmer && registeredFarmer.crop_type === crop ? (registeredFarmer.irrigation_method || "Flood") : "Flood";
  
  let baseYield = 20; 
  let baseCost = 24000; 
  let defaultPrice = 2200; 
  
  const cLower = crop.toLowerCase();
  if (cLower.includes("rice") || cLower.includes("paddy")) {
    baseYield = 22;
    baseCost = 25000;
    defaultPrice = 2300;
  } else if (cLower.includes("maize") || cLower.includes("corn")) {
    baseYield = 25;
    baseCost = 20000;
    defaultPrice = 2100;
  } else if (cLower.includes("groundnut")) {
    baseYield = 10;
    baseCost = 28000;
    defaultPrice = 6500;
  } else if (cLower.includes("cotton")) {
    baseYield = 8;
    baseCost = 30000;
    defaultPrice = 7000;
  } else if (cLower.includes("tomato")) {
    baseYield = 140;
    baseCost = 40000;
    defaultPrice = 1200;
  }
  
  const livePrice = getMandiPriceForCrop(crop);
  const finalPrice = livePrice || defaultPrice;
  
  const yearMult = year === 2025 ? 1.08 : 0.95;
  const seasonMult = season === "Kharif" ? 1.0 : 0.8;
  
  let irrigationMult = 1.0;
  if (irrigation.toLowerCase().includes("drip")) {
    irrigationMult = 0.85; 
  } else if (irrigation.toLowerCase().includes("sprinkler")) {
    irrigationMult = 0.92;
  }
  
  const yieldPerAcre = parseFloat((baseYield * yearMult * seasonMult * (0.96 + rand() * 0.08)).toFixed(1));
  const revenue = calculateRevenue(yieldPerAcre, area, finalPrice);
  const totalCost = calculateTotalCost(baseCost, area, yearMult, seasonMult, irrigationMult) * (0.97 + rand() * 0.06);
  const netProfit = calculateNetProfit(revenue, Math.round(totalCost));
  
  let normalRainfall = 950;
  if (season === "Kharif") {
    const locLower = location.toLowerCase();
    if (locLower.includes("visakhapatnam")) normalRainfall = 1200;
    else if (locLower.includes("nellore")) normalRainfall = 1050;
    else if (locLower.includes("guntur")) normalRainfall = 900;
  } else {
    normalRainfall = 350;
    const locLower = location.toLowerCase();
    if (locLower.includes("visakhapatnam")) normalRainfall = 450;
    else if (locLower.includes("nellore")) normalRainfall = 380;
  }
  const rainYearMult = year === 2025 ? 0.88 : 1.06;
  const rainfall = Math.round(normalRainfall * rainYearMult * (0.95 + rand() * 0.1));
  
  const waterUsageVal = calculateWaterUsage(irrigation);
  
  return {
    crop,
    season,
    year,
    location,
    area,
    yieldPerAcre,
    revenue,
    totalCost: Math.round(totalCost),
    netProfit,
    rainfall,
    historicalRainfall: normalRainfall,
    irrigationType: irrigation,
    waterUsage: waterUsageVal ? waterUsageVal * area : null,
    pricePerQuintal: finalPrice,
    isLivePrice: Boolean(livePrice)
  };
}

function getPreviousSeason(season, year) {
  if (season === "Rabi") {
    return { season: "Kharif", year: year };
  } else {
    return { season: "Rabi", year: year - 1 };
  }
}

function getMonthlyRainfallData(crop, season, year, location) {
  const rand = getSeededRandom(`${crop}_${season}_${year}_${location}_rain`);
  const baseRainVal = season === "Kharif" ? [110, 190, 240, 150, 80, 20] : [15, 10, 20, 15, 30, 45];
  
  const normalRain = [];
  const actualRain = [];
  
  for (let i = 0; i < 6; i++) {
    const factor = 0.85 + rand() * 0.3;
    normalRain.push(Math.round(baseRainVal[i] * factor));
    const rainYearMult = year === 2025 ? 0.88 : 1.06;
    actualRain.push(Math.round(baseRainVal[i] * factor * rainYearMult * (0.9 + rand() * 0.2)));
  }
  return { normalRain, actualRain };
}

let analyticsFiltersInitialized = false;

function initAnalyticsFilters() {
  if (analyticsFiltersInitialized) return;

  const yearSelect = document.getElementById("filter-year");
  const seasonSelect = document.getElementById("filter-season");
  const cropSelect = document.getElementById("filter-crop");
  const locationSelect = document.getElementById("filter-location");

  if (!yearSelect || !seasonSelect || !cropSelect || !locationSelect) return;

  yearSelect.innerHTML = "";
  seasonSelect.innerHTML = "";
  cropSelect.innerHTML = "";
  locationSelect.innerHTML = "";

  const years = [2025, 2024];
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });

  const seasons = [
    { value: "Kharif", label: currentLang === "te" ? "ఖరీఫ్ (Kharif)" : "Kharif" },
    { value: "Rabi", label: currentLang === "te" ? "రబీ (Rabi)" : "Rabi" }
  ];
  seasons.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.value;
    opt.textContent = s.label;
    seasonSelect.appendChild(opt);
  });

  const crops = [
    { value: "Rice", label: currentLang === "te" ? "వరి (Rice)" : "Rice" },
    { value: "Maize", label: currentLang === "te" ? "మొక్కజొన్న (Maize)" : "Maize" },
    { value: "Groundnut", label: currentLang === "te" ? "వేరుశనగ (Groundnut)" : "Groundnut" },
    { value: "Cotton", label: currentLang === "te" ? "పత్తి (Cotton)" : "Cotton" },
    { value: "Tomato", label: currentLang === "te" ? "టమోటా (Tomato)" : "Tomato" }
  ];
  
  const farmerCrop = registeredFarmer ? registeredFarmer.crop_type : null;
  if (farmerCrop && !crops.some(c => c.value.toLowerCase() === farmerCrop.toLowerCase())) {
    crops.unshift({ value: farmerCrop, label: farmerCrop });
  }

  crops.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.value;
    opt.textContent = c.label;
    cropSelect.appendChild(opt);
  });

  if (farmerCrop) {
    const found = Array.from(cropSelect.options).find(opt => opt.value.toLowerCase() === farmerCrop.toLowerCase());
    if (found) cropSelect.value = found.value;
  }

  const locations = ["Visakhapatnam", "Nellore", "Guntur", "Vijayawada", "Kavali"];
  const farmerLoc = registeredFarmer ? registeredFarmer.location : null;
  if (farmerLoc && !locations.some(l => l.toLowerCase() === farmerLoc.toLowerCase())) {
    locations.unshift(farmerLoc);
  }

  locations.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    locationSelect.appendChild(opt);
  });

  if (farmerLoc) {
    const found = Array.from(locationSelect.options).find(opt => opt.value.toLowerCase() === farmerLoc.toLowerCase());
    if (found) locationSelect.value = found.value;
  }

  [yearSelect, seasonSelect, cropSelect, locationSelect].forEach(selectEl => {
    selectEl.addEventListener("change", () => {
      renderDynamicDashboard();
    });
  });

  analyticsFiltersInitialized = true;
}

function renderDynamicDashboard() {
  const yearSelect = document.getElementById("filter-year");
  const seasonSelect = document.getElementById("filter-season");
  const cropSelect = document.getElementById("filter-crop");
  const locationSelect = document.getElementById("filter-location");

  if (!yearSelect || !seasonSelect || !cropSelect || !locationSelect) return;

  const year = parseInt(yearSelect.value);
  const season = seasonSelect.value;
  const crop = cropSelect.value;
  const location = locationSelect.value;

  const current = getFarmAnalyticsRecord(crop, season, year, location);
  const prevSeasonObj = getPreviousSeason(season, year);
  
  let prev = null;
  // Make sure we only attempt to read previous if it fits in 2024-2025
  if (prevSeasonObj.year >= 2024) {
    prev = getFarmAnalyticsRecord(crop, prevSeasonObj.season, prevSeasonObj.year, location);
  }

  // Update Data Source Badge
  const badge = document.getElementById("data-source-badge");
  if (badge) {
    if (current.isLivePrice) {
      badge.textContent = currentLang === "te" ? "ప్రత్యక్ష మండి డేటా" : "Live Mandi Data";
      badge.style.background = "#dcfce7";
      badge.style.color = "#166534";
    } else {
      badge.textContent = currentLang === "te" ? "నమూనా చారిత్రక డేటా" : "Demo historical data";
      badge.style.background = "rgba(100, 116, 139, 0.1)";
      badge.style.color = "#64748b";
    }
  }

  // 1. Net Profit Card
  const profitValEl = document.getElementById("stat-net-profit");
  if (profitValEl) {
    profitValEl.textContent = `₹${(current.netProfit / 100000).toFixed(2)} L`;
  }
  const profitChangeEl = document.getElementById("stat-net-profit-change");
  if (profitChangeEl) {
    if (prev) {
      const profitChange = ((current.netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 100;
      profitChangeEl.textContent = `${profitChange >= 0 ? "↑" : "↓"} ${Math.abs(profitChange).toFixed(0)}% vs ${currentLang === "te" ? "గత కాలం" : "previous season"}`;
      profitChangeEl.style.color = profitChange >= 0 ? "#10b981" : "#ef4444";
    } else {
      profitChangeEl.textContent = `N/A vs ${currentLang === "te" ? "గత కాలం" : "previous season"}`;
      profitChangeEl.style.color = "var(--text-muted)";
    }
  }
  const revEl = document.getElementById("stat-revenue");
  if (revEl) revEl.textContent = `₹${(current.revenue / 1000).toFixed(1)}k`;
  const costEl = document.getElementById("stat-cost");
  if (costEl) costEl.textContent = `₹${(current.totalCost / 1000).toFixed(1)}k`;

  // 2. Yield Card
  const yieldValEl = document.getElementById("stat-yield");
  if (yieldValEl) {
    yieldValEl.textContent = `${current.yieldPerAcre} ${currentLang === "te" ? "క్వింటాళ్ళు/ఎకరం" : "quintals/acre"}`;
  }
  const yieldChangeEl = document.getElementById("stat-yield-change");
  if (yieldChangeEl) {
    if (prev) {
      const yieldChange = ((current.yieldPerAcre - prev.yieldPerAcre) / prev.yieldPerAcre) * 100;
      yieldChangeEl.textContent = `${yieldChange >= 0 ? "↑" : "↓"} ${Math.abs(yieldChange).toFixed(0)}% vs ${currentLang === "te" ? "గత కాలం" : "previous season"}`;
      yieldChangeEl.style.color = yieldChange >= 0 ? "#10b981" : "#ef4444";
    } else {
      yieldChangeEl.textContent = `N/A vs ${currentLang === "te" ? "గత కాలం" : "previous season"}`;
      yieldChangeEl.style.color = "var(--text-muted)";
    }
  }

  // 3. Rainfall Card
  const rainValEl = document.getElementById("stat-rainfall");
  if (rainValEl) {
    rainValEl.textContent = `${current.rainfall.toLocaleString("en-IN")} mm`;
  }
  const rainCompareEl = document.getElementById("stat-rainfall-compare");
  if (rainCompareEl) {
    const diff = current.historicalRainfall - current.rainfall;
    const diffPercent = Math.round((diff / current.historicalRainfall) * 100);
    if (diffPercent >= 0) {
      rainCompareEl.textContent = `${diffPercent}% ${currentLang === "te" ? "సగటు కంటే తక్కువ" : "below average"}`;
      rainCompareEl.style.color = diffPercent > 5 ? "#ef4444" : "#eab308";
    } else {
      rainCompareEl.textContent = `${Math.abs(diffPercent)}% ${currentLang === "te" ? "సగటు కంటే ఎక్కువ" : "above average"}`;
      rainCompareEl.style.color = "#10b981";
    }
  }

  // 4. Water Efficiency Card
  const waterEfficiencyValEl = document.getElementById("stat-water-efficiency");
  const waterSavingsEl = document.getElementById("stat-water-savings");
  if (current.waterUsage) {
    if (waterEfficiencyValEl) {
      waterEfficiencyValEl.textContent = `${currentLang === "te" ? "నీటి వినియోగం" : "Water Used"}: ${(current.waterUsage / current.area).toLocaleString("en-IN")} L/acre`;
    }
    if (waterSavingsEl) {
      const irr = current.irrigationType.toLowerCase();
      if (irr.includes("drip")) {
        waterSavingsEl.textContent = currentLang === "te" ? "డ్రిప్ సిస్టమ్ ఆక్టివ్ గా ఉంది" : "Drip system active";
        waterSavingsEl.style.color = "#10b981";
      } else if (irr.includes("sprinkler")) {
        waterSavingsEl.textContent = currentLang === "te" ? "డ్రిప్‌తో 20% పొదుపు చేయవచ్చు" : "Potential Saving: 20% with drip";
        waterSavingsEl.style.color = "#eab308";
      } else {
        waterSavingsEl.textContent = currentLang === "te" ? "డ్రిప్‌తో 40% పొదుపు చేయవచ్చు" : "Potential Saving: 40% with drip";
        waterSavingsEl.style.color = "#ef4444";
      }
    }
  } else {
    if (waterEfficiencyValEl) {
      waterEfficiencyValEl.textContent = currentLang === "te" ? "నీటి సమాచారం లేదు" : "Irrigation data unavailable";
    }
    if (waterSavingsEl) {
      waterSavingsEl.textContent = "—";
      waterSavingsEl.style.color = "var(--text-muted)";
    }
  }

  // 5. Render/Update Charts
  const ctxProfit = document.getElementById("profitTrendChart").getContext("2d");
  const ctxYield = document.getElementById("yieldTrendChart").getContext("2d");
  const ctxRain = document.getElementById("rainHistoryChart").getContext("2d");

  if (profitTrendChartInstance) profitTrendChartInstance.destroy();
  if (yieldTrendChartInstance) yieldTrendChartInstance.destroy();
  if (rainHistoryChartInstance) rainHistoryChartInstance.destroy();

  const seasonsList = [
    { season: "Kharif", year: 2024 },
    { season: "Rabi", year: 2024 },
    { season: "Kharif", year: 2025 },
    { season: "Rabi", year: 2025 }
  ];
  const chartRecords = seasonsList.map(s => getFarmAnalyticsRecord(crop, s.season, s.year, location));
  
  const seasonLabels = currentLang === "te"
    ? ['ఖరీఫ్ 2024', 'రబీ 2024', 'ఖరీఫ్ 2025', 'రబీ 2025']
    : ['Kharif 2024', 'Rabi 2024', 'Kharif 2025', 'Rabi 2025'];

  const profits = chartRecords.map(r => r.netProfit);
  const revenues = chartRecords.map(r => r.revenue);
  const costs = chartRecords.map(r => r.totalCost);

  profitTrendChartInstance = new Chart(ctxProfit, {
    type: 'bar',
    data: {
      labels: seasonLabels,
      datasets: [{
        label: currentLang === "te" ? 'నికర లాభాలు (₹)' : 'Net Profits (₹)',
        data: profits,
        backgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              return [
                `Revenue: ₹${revenues[idx].toLocaleString("en-IN")}`,
                `Cost: ₹${costs[idx].toLocaleString("en-IN")}`,
                `Net Profit: ₹${profits[idx].toLocaleString("en-IN")}`
              ];
            }
          }
        }
      }
    }
  });

  const yields = chartRecords.map(r => r.yieldPerAcre);
  const yieldChanges = chartRecords.map((r, i) => {
    if (i === 0) return 0;
    const prevVal = chartRecords[i - 1].yieldPerAcre;
    return ((r.yieldPerAcre - prevVal) / prevVal) * 100;
  });

  yieldTrendChartInstance = new Chart(ctxYield, {
    type: 'bar',
    data: {
      labels: seasonLabels,
      datasets: [{
        label: currentLang === "te" ? 'దిగుబడి (క్వింటాళ్ళు/ఎకరం)' : 'Yield (quintals/acre)',
        data: yields,
        backgroundColor: '#f59e0b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              const chg = yieldChanges[idx];
              const sign = chg >= 0 ? "+" : "";
              return [
                `Crop: ${crop}`,
                `Yield: ${yields[idx]} quintals/acre`,
                `Change: ${idx > 0 ? `${sign}${chg.toFixed(0)}%` : "N/A"}`
              ];
            }
          }
        }
      }
    }
  });

  const rainMonths = season === "Kharif"
    ? (currentLang === "te" ? ['జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబరు', 'అక్టోబరు', 'నవంబరు'] : ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'])
    : (currentLang === "te" ? ['డిసెంబరు', 'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే'] : ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']);

  const rainObj = getMonthlyRainfallData(crop, season, year, location);

  rainHistoryChartInstance = new Chart(ctxRain, {
    type: 'line',
    data: {
      labels: rainMonths,
      datasets: [
        {
          label: currentLang === "te" ? 'నిజమైన వర్షపాతం (మిమీ)' : 'Actual Rainfall (mm)',
          data: rainObj.actualRain,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.08)',
          fill: true,
          tension: 0.3
        },
        {
          label: currentLang === "te" ? 'సాధారణ వర్షపాతం (మిమీ)' : 'Normal Rainfall (mm)',
          data: rainObj.normalRain,
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // 6. Generate AI Insights List
  const insightsContainer = document.getElementById("ai-insights-list");
  if (insightsContainer) {
    insightsContainer.innerHTML = "";
    
    // Insight 1: Rainfall compare
    const rainDiffPercent = Math.round((1 - current.rainfall / current.historicalRainfall) * 100);
    const rainInsightText = rainDiffPercent > 0
      ? (currentLang === "te" ? `⚠ వర్షపాతం కాలానుగుణ సగటు కంటే ${rainDiffPercent}% తక్కువగా ఉంది.` : `⚠ Rainfall is ${rainDiffPercent}% below the seasonal average.`)
      : (currentLang === "te" ? `🌧 వర్షపాతం కాలానుగుణ సగటు కంటే ${Math.abs(rainDiffPercent)}% ఎక్కువగా ఉంది.` : `🌧 Rainfall is ${Math.abs(rainDiffPercent)}% above the seasonal average.`);
    
    // Insight 2: Yield compare
    let yieldInsightText = "";
    if (prev) {
      const yDiff = ((current.yieldPerAcre - prev.yieldPerAcre) / prev.yieldPerAcre) * 100;
      yieldInsightText = yDiff >= 0
        ? (currentLang === "te" ? `📈 గత కాలంతో పోలిస్తే దిగుబడి ${yDiff.toFixed(0)}% పెరిగింది.` : `📈 Yield increased by ${yDiff.toFixed(0)}% compared with the previous season.`)
        : (currentLang === "te" ? `📉 గత కాలంతో పోలిస్తే దిగుబడి ${Math.abs(yDiff).toFixed(0)}% తగ్గింది.` : `📉 Yield decreased by ${Math.abs(yDiff).toFixed(0)}% compared with the previous season.`);
    } else {
      yieldInsightText = currentLang === "te" ? `🌾 ప్రస్తుత అంచనా వేసిన దిగుబడి: ఎకరానికి ${current.yieldPerAcre} క్వింటాళ్ళు.` : `🌾 Current estimated yield is ${current.yieldPerAcre} quintals per acre.`;
    }

    // Insight 3: Profit compare
    let profitInsightText = "";
    if (prev) {
      const pDiff = ((current.netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 100;
      profitInsightText = pDiff >= 0
        ? (currentLang === "te" ? `💰 నికర లాభం ${pDiff.toFixed(0)}% పెరిగింది, ప్రధానంగా మెరుగైన దిగుబడి మరియు ధరల కారణంగా.` : `💰 Net profit increased by ${pDiff.toFixed(0)}%, mainly due to higher yield and mandi prices.`)
        : (currentLang === "te" ? `💰 మార్కెట్ హెచ్చుతగ్గులు లేదా ఉత్పత్తి వ్యయం కారణంగా నికర లాభం ${Math.abs(pDiff).toFixed(0)}% తగ్గింది.` : `💰 Net profit decreased by ${Math.abs(pDiff).toFixed(0)}%, mainly due to market price fluctuations or cultivation costs.`);
    } else {
      profitInsightText = currentLang === "te" ? `💰 ఈ కాలంలో ఆశించిన నికర లాభం సుమారు ₹${(current.netProfit / 100000).toFixed(2)} లక్షలు.` : `💰 Estimated net profit for this period is ₹${(current.netProfit / 100000).toFixed(2)} L.`;
    }

    // Insight 4: Drip saving tip
    let dripInsightText = "";
    const irr = current.irrigationType.toLowerCase();
    if (irr.includes("drip")) {
      dripInsightText = currentLang === "te"
        ? `💧 మీరు డ్రిప్ పద్ధతిని ఉపయోగిస్తున్నారు, ఇది సంప్రదాయ పద్ధతుల కంటే 35% నీటిని పొదుపు చేస్తోంది.`
        : `💧 Switching to drip irrigation is active, saving approximately 35% water compared to regional flood methods.`;
    } else {
      dripInsightText = currentLang === "te"
        ? `💧 వరద నీటి పారుదల నుండి డ్రిప్ పద్ధతికి మారడం ద్వారా నీటి వినియోగాన్ని 40% వరకు తగ్గించవచ్చు.`
        : `💧 Switching from flood irrigation to drip could potentially reduce water usage by 40% and boost margins.`;
    }

    // Insight 5: Crop Doctor Disease Integration
    let diseaseInsight = "";
    try {
      const history = JSON.parse(localStorage.getItem("krushakseva_diagnosis_history") || "[]");
      const cropIncidents = history.filter(h => h.crop.toLowerCase().includes(crop.toLowerCase()));
      if (cropIncidents.length > 0) {
        const counts = {};
        cropIncidents.forEach(c => { counts[c.disease] = (counts[c.disease] || 0) + 1; });
        let mostCommon = "";
        let maxCount = 0;
        for (const [d, count] of Object.entries(counts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = d;
          }
        }
        diseaseInsight = currentLang === "te"
          ? `🐛 పంట వైద్యుడు ఇటీవలే ${cropIncidents.length} తెగులు సంఘటనలను రికార్డ్ చేసారు. సాధారణంగా కనుగొన్నది: ${mostCommon}.`
          : `🐛 Crop Doctor recorded ${cropIncidents.length} disease incident(s) for ${crop} recently. Most common: ${mostCommon}.`;
      } else {
        diseaseInsight = currentLang === "te"
          ? `✅ ఈ కాలంలో ${translateMandiTerm(crop)} పంటకు ఎటువంటి తెగుళ్లు రికార్డు కాలేదు.`
          : `✅ No major disease outbreaks recorded for ${crop} in this period.`;
      }
    } catch (e) {
      console.log("Could not load diagnosis history:", e);
      diseaseInsight = currentLang === "te" ? "✅ ఎటువంటి తెగుళ్లు రికార్డు కాలేదు." : "✅ No major disease outbreaks recorded.";
    }

    const bullets = [rainInsightText, yieldInsightText, profitInsightText, dripInsightText, diseaseInsight];
    bullets.forEach(txt => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "flex-start";
      div.style.gap = "8px";
      div.innerHTML = `<span style="color:var(--primary); font-weight:700;">•</span><span>${txt}</span>`;
      insightsContainer.appendChild(div);
    });
  }

  // 7. Generate Profit Factor Breakdown
  const factorsContainer = document.getElementById("profit-factors-container");
  if (factorsContainer) {
    factorsContainer.innerHTML = "";
    if (prev) {
      const netDiff = current.netProfit - prev.netProfit;
      const yieldEffect = Math.round((current.yieldPerAcre - prev.yieldPerAcre) * current.area * current.pricePerQuintal);
      const priceEffect = Math.round((current.pricePerQuintal - prev.pricePerQuintal) * prev.yieldPerAcre * current.area);
      
      const costDiff = current.totalCost - prev.totalCost;
      const fertilizerEffect = Math.round(-costDiff * 0.65);
      const irrigationEffect = netDiff - (yieldEffect + priceEffect + fertilizerEffect); // ensure math matches exactly

      const factors = [
        { label: currentLang === "te" ? "దిగుబడి మార్పు" : "Yield improvement", value: yieldEffect },
        { label: currentLang === "te" ? "మండి ధర వ్యత్యాసం" : "Market price change", value: priceEffect },
        { label: currentLang === "te" ? "ఎరువులు/విత్తనాల వ్యయం" : "Fertilizer & inputs cost", value: fertilizerEffect },
        { label: currentLang === "te" ? "నీరు/కార్మికుల వ్యయం" : "Irrigation & labour cost", value: irrigationEffect }
      ];

      factors.forEach(f => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.padding = "6px 0";
        div.style.borderBottom = "1px solid rgba(200, 200, 200, 0.08)";
        
        const sign = f.value >= 0 ? "+" : "−";
        const color = f.value >= 0 ? "#10b981" : "#ef4444";
        div.innerHTML = `<span>${f.label}</span><span style="font-weight:600; color:${color}">${sign}₹${Math.abs(f.value).toLocaleString("en-IN")}</span>`;
        factorsContainer.appendChild(div);
      });

      const totalDiv = document.createElement("div");
      totalDiv.style.display = "flex";
      totalDiv.style.justifyContent = "space-between";
      totalDiv.style.padding = "10px 0 0 0";
      totalDiv.style.marginTop = "8px";
      totalDiv.style.borderTop = "1px solid var(--border-color)";
      totalDiv.style.fontWeight = "700";

      const sign = netDiff >= 0 ? "+" : "−";
      const color = netDiff >= 0 ? "#10b981" : "#ef4444";
      totalDiv.innerHTML = `<span>${currentLang === "te" ? "నికర మార్పు" : "Net improvement"}</span><span style="color:${color}">${sign}₹${Math.abs(netDiff).toLocaleString("en-IN")}</span>`;
      factorsContainer.appendChild(totalDiv);
    } else {
      factorsContainer.innerHTML = `<div style="text-align:center; padding:24px 12px; color:var(--text-muted);">${currentLang === "te" ? "మార్పును లెక్కించడానికి తగినంత చారిత్రక డేటా లేదు." : "Not enough historical data to calculate the change."}</div>`;
    }
  }
}

function toggleAnalyticsState() {
  const fallbackBox = document.getElementById("analyticsFallbackBox");
  const chartsBox = document.getElementById("analyticsChartsBox");

  const analyticsHeader = document.querySelector("#panel-analytics .panel-header h2");
  const analyticsSubtitle = document.querySelector("#panel-analytics .panel-header p");

  if (currentLang === "te") {
    if (analyticsHeader) analyticsHeader.textContent = "వ్యవసాయ చారిత్రక విశ్లేషణలు";
    if (analyticsSubtitle) analyticsSubtitle.textContent = "వర్షపాత కొలమానాలు, కాలానుగుణ నికర లాభాలు మరియు పంట దిగుబడి చారిత్రక పోకడలను దృశ్యమానం చేయండి.";
  } else {
    if (analyticsHeader) analyticsHeader.textContent = "Farm Historical Analytics";
    if (analyticsSubtitle) analyticsSubtitle.textContent = "Visualize rainfall metrics, seasonal net profits, and crop yields historical trends.";
  }

  if (registeredFarmer) {
    if (fallbackBox) fallbackBox.style.display = "none";
    if (chartsBox) {
      chartsBox.style.display = "block";
      initAnalyticsFilters();
      renderDynamicDashboard();
    }
  } else {
    if (fallbackBox) {
      fallbackBox.style.display = "flex";
      const heading = fallbackBox.querySelector("h3");
      const description = fallbackBox.querySelector("p");
      if (heading) heading.textContent = currentLang === "te" ? "విశ్లేషణలు అందుబాటులో లేవు" : "Analytics unavailable";
      if (description) description.textContent = currentLang === "te"
        ? "ప్రత్యక్ష వాతావరణం మరియు వ్యక్తిగతీకరించిన వ్యవసాయ-ప్రమాద స్కోర్‌ను చూడటానికి మీ వ్యవసాయ క్షేత్రాన్ని నమోదు చేయండి."
        : "Register your farm to see live weather and a personalised farm-risk score.";
    }
    if (chartsBox) chartsBox.style.display = "none";
  }
}

// ---------- SOS HELP WIDGET TRIGGER ----------
const sosModal = document.getElementById("sosEmergencyModal");

document.getElementById("emergencyBtn").addEventListener("click", () => {
  sosModal.style.display = "flex";
  
  const lat = registeredFarmer ? registeredFarmer.latitude : (detectedLat || 14.4426);
  const lon = registeredFarmer ? registeredFarmer.longitude : (detectedLon || 79.9865);
  const loc = registeredFarmer ? registeredFarmer.location : "Andhra Pradesh";
  
  document.getElementById("sos-location-text").textContent = loc;
  document.getElementById("sos-lat-text").textContent = parseFloat(lat).toFixed(4);
  document.getElementById("sos-lon-text").textContent = parseFloat(lon).toFixed(4);
});

document.getElementById("closeSosBtn").addEventListener("click", () => {
  sosModal.style.display = "none";
});

sosModal.addEventListener("click", (e) => {
  if (e.target === sosModal) {
    sosModal.style.display = "none";
  }
});

document.getElementById("sendSosBroadcastBtn").addEventListener("click", async () => {
  const phoneVal = registeredFarmer ? registeredFarmer.phone : "+918247543026";
  const eventVal = document.getElementById("sos-emergency-type").value;
  const lat = registeredFarmer ? registeredFarmer.latitude : (detectedLat || 14.4426);
  const lon = registeredFarmer ? registeredFarmer.longitude : (detectedLon || 79.9865);
  const loc = registeredFarmer ? registeredFarmer.location : "Andhra Pradesh";
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/sos/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phoneVal,
        event_type: eventVal,
        latitude: lat,
        longitude: lon,
        location: loc
      })
    });
    
    if (res.ok) {
      alert(`🚨 SOS Broadcast successfully sent! SMS alerts dispatched to ${phoneVal} and the Mandal Extension Officer (+919848012345) containing coordinates: Lat ${parseFloat(lat).toFixed(4)}, Lon ${parseFloat(lon).toFixed(4)}.`);
      sosModal.style.display = "none";
    } else {
      alert("Error broadcasting SOS signal to server.");
    }
  } catch (err) {
    alert("Connection failure: " + err.message);
  }
});

document.getElementById("callFarmerSosBtn").addEventListener("click", async () => {
  const phoneVal = registeredFarmer ? registeredFarmer.phone : "+918247543026";
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/sos/call-farmer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneVal })
    });
    
    if (res.ok) {
      const data = await res.json();
      sosModal.style.display = "none";
      
      if (data.status === "demo") {
        alert("ℹ️ Twilio credentials missing. Triggering interactive SOS Emergency call simulation in your dashboard instead!");
        simulatorMode = "sos";
        switchTab("ivr");
        setTimeout(() => {
          document.getElementById("dialCallBtn").click();
        }, 300);
      } else {
        alert("✅ Outbound voice call initiated successfully! The system has dialed your phone.");
      }
    } else {
      alert("Error initiating outbound call from server.");
    }
  } catch (err) {
    alert("Connection failure: " + err.message);
  }
});

document.getElementById("triggerEmergencyBtn").addEventListener("click", () => {
  document.getElementById("emergencyBtn").click();
});

document.getElementById("signOutBtn").addEventListener("click", () => {
  const confirmMsg = currentLang === "te" 
    ? "మీరు ఖచ్చితంగా నిష్క్రమించాలనుకుంటున్నారా?" 
    : "Are you sure you want to sign out from KṛṣakaSevā?";
  if (confirm(confirmMsg)) {
    localStorage.removeItem("krushakseva_phone");
    localStorage.removeItem("krushakseva_profile");
    registeredFarmer = null;
    resetChecklist();
    
    // Clear inputs in the login box
    document.getElementById("auth-phone-input").value = "";
    document.getElementById("auth-name-input").value = "";
    
    // Hide registration form if open
    document.getElementById("farmerRegistrationForm").style.display = "none";
    
    // Reset logo/badge values
    document.getElementById("badge-name").textContent = currentLang === "te" ? "రైతు" : "Farmer";
    document.getElementById("badge-phone").textContent = currentLang === "te" ? "నమోదు కాలేదు" : "Unregistered";
    
    // Display the login portal card again
    document.getElementById("auth-portal-box").style.display = "flex";
    
    // Toggle sign out button
    toggleSignOutButton();
    
    // Redirect to landing
    switchTab("landing");
    
    // Scroll to login card
    document.getElementById("register-section").scrollIntoView({ behavior: "smooth" });
    
    const successMsg = currentLang === "te" 
      ? "మీరు విజయవంతంగా నిష్క్రమించారు." 
      : "You have signed out successfully.";
    alert(successMsg);
  }
});

document.getElementById("callMyNumberBtn").addEventListener("click", async () => {
  const btn = document.getElementById("callMyNumberBtn");
  const statusDiv = document.getElementById("callMyNumberStatus");
  const phoneVal = registeredFarmer ? registeredFarmer.phone : "";
  
  if (!phoneVal) {
    statusDiv.style.display = "flex";
    statusDiv.style.color = "#ef4444";
    statusDiv.textContent = "Unable to initiate the call. Please register first.";
    return;
  }
  
  btn.disabled = true;
  statusDiv.style.display = "flex";
  statusDiv.style.color = "#2563eb";
  statusDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Calling your registered mobile number...`;
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/ivr/trigger-outbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneVal })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === "triggered") {
        statusDiv.style.color = "#16a34a";
        statusDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> Your call has been initiated. Please answer your phone.`;
      } else {
        statusDiv.style.color = "#ef4444";
        statusDiv.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Unable to initiate the call. Please try again.`;
      }
    } else {
      statusDiv.style.color = "#ef4444";
      statusDiv.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Unable to initiate the call. Please try again.`;
    }
  } catch (err) {
    statusDiv.style.color = "#ef4444";
    statusDiv.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Unable to initiate the call. Please try again.`;
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      statusDiv.style.display = "none";
    }, 6000);
  }
});

// ---------- INITIAL INITIALIZATION ON PAGE LOAD ----------
window.addEventListener("DOMContentLoaded", async () => {
  updateLanguageUI();
  toggleAnalyticsState();
  
  // Immediately request GPS permission on page land!
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      detectedLat = position.coords.latitude;
      detectedLon = position.coords.longitude;
      const geoResult = await reverseGeocode(detectedLat, detectedLon);
      if (geoResult) {
        document.getElementById("reg-state").value = geoResult.state;
        document.getElementById("reg-district").value = geoResult.district;
        document.getElementById("reg-mandal").value = geoResult.mandal;
        document.getElementById("reg-village").value = geoResult.village;
        document.getElementById("reg-pin").value = geoResult.pin;
      }
      
      if (registeredFarmer) {
        registeredFarmer.latitude = detectedLat;
        registeredFarmer.longitude = detectedLon;
        if (geoResult) {
          registeredFarmer.location = `${geoResult.village}, ${geoResult.district}, ${geoResult.state}`;
        }
        updateDashboardWithProfile(registeredFarmer);
      } else {
        fetchWeatherForCoordinates(detectedLat, detectedLon);
      }
    }, error => {
      console.log("Initial GPS request declined/failed. Fallback to button triggers.");
    });
  }
  
  // Restore the active session from localStorage.  Profiles are intentionally
  // not fetched from the server because Vercel has no persistent filesystem.
  try {
    const savedPhone = localStorage.getItem("krushakseva_phone");
    const savedProfile = localStorage.getItem("krushakseva_profile");
    if (savedPhone && savedProfile) {
      const profile = JSON.parse(savedProfile);
      if (normalizePhone(profile.phone) === normalizePhone(savedPhone)) {
        saveLocalProfile(profile);
        document.getElementById("auth-portal-box").style.display = "none";
        updateDashboardWithProfile(registeredFarmer);
        switchTab("dashboard");
      }
    }
  } catch (err) {
    console.log("Auto-login error on reload:", err);
  }
});
