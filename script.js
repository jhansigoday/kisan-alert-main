// Base Backend API configuration dynamically loaded
const BACKEND_URL = window.location.protocol === "file:"
  ? "http://127.0.0.1:5000"
  : "";

// Global State
let currentLang = "en";
let isDarkMode = false;
let registeredFarmer = null;
let chatHistory = [];
let detectedLocationName = null;
let analyticsLocationDetected = false;

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
      switchTab("landing");
      const regSec = document.getElementById("register-section");
      if (regSec) regSec.scrollIntoView({ behavior: "smooth" });
      const phoneInput = document.getElementById("auth-phone-input");
      if (phoneInput) phoneInput.focus();
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
        detectedLocationName = geoResult.village || geoResult.district || geoResult.state;
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
  
  // Render extension services & schemes dynamically based on profile
  renderExtensionServices();
}

const MOCK_MANDI_DATA = [
  { market: "Nellore", commodity: "Rice", min_price: 2100, max_price: 2400, modal_price: 2300, district: "Nellore", state: "Andhra Pradesh" },
  { market: "Nellore", commodity: "Groundnut", min_price: 6100, max_price: 6700, modal_price: 6500, district: "Nellore", state: "Andhra Pradesh" },
  { market: "Nellore", commodity: "Wheat", min_price: 2200, max_price: 2500, modal_price: 2400, district: "Nellore", state: "Andhra Pradesh" },
  { market: "Visakhapatnam", commodity: "Rice", min_price: 2000, max_price: 2300, modal_price: 2150, district: "Visakhapatnam", state: "Andhra Pradesh" },
  { market: "Visakhapatnam", commodity: "Maize", min_price: 1950, max_price: 2200, modal_price: 2100, district: "Visakhapatnam", state: "Andhra Pradesh" },
  { market: "Visakhapatnam", commodity: "Cotton", min_price: 6800, max_price: 7200, modal_price: 7000, district: "Visakhapatnam", state: "Andhra Pradesh" },
  { market: "Visakhapatnam", commodity: "Mustard", min_price: 5200, max_price: 5700, modal_price: 5500, district: "Visakhapatnam", state: "Andhra Pradesh" },
  { market: "Guntur", commodity: "Chilli", min_price: 14000, max_price: 16500, modal_price: 15500, district: "Guntur", state: "Andhra Pradesh" },
  { market: "Guntur", commodity: "Cotton", min_price: 6900, max_price: 7300, modal_price: 7100, district: "Guntur", state: "Andhra Pradesh" },
  { market: "Guntur", commodity: "Chickpea", min_price: 5000, max_price: 5600, modal_price: 5300, district: "Guntur", state: "Andhra Pradesh" },
  { market: "Vijayawada", commodity: "Tomato", min_price: 900, max_price: 1100, modal_price: 1000, district: "Krishna", state: "Andhra Pradesh" },
  { market: "Vijayawada", commodity: "Maize", min_price: 2000, max_price: 2250, modal_price: 2150, district: "Krishna", state: "Andhra Pradesh" },
  { market: "Vijayawada", commodity: "Potato", min_price: 1100, max_price: 1300, modal_price: 1200, district: "Krishna", state: "Andhra Pradesh" },
  { market: "Kavali", commodity: "Groundnut", min_price: 6000, max_price: 6600, modal_price: 6300, district: "Nellore", state: "Andhra Pradesh" },
  { market: "Kavali", commodity: "Rice", min_price: 2050, max_price: 2350, modal_price: 2200, district: "Nellore", state: "Andhra Pradesh" },
  { market: "Kavali", commodity: "Tomato", min_price: 850, max_price: 1050, modal_price: 950, district: "Nellore", state: "Andhra Pradesh" }
];

let latestWeatherState = {
  temp: 28,
  humidity: 75,
  rainfall: 850,
  status: "live"
};

const CROP_KNOWLEDGE_BASE = {
  Rice: {
    soil: ["alluvial", "clayey", "loamy"],
    phMin: 5.5,
    phMax: 7.0,
    tempMin: 20,
    tempMax: 35,
    rainMin: 1000,
    rainMax: 2000,
    waterRequirement: "High",
    seasons: ["Kharif", "Rabi"],
    durationDays: 120,
    typicalYieldMin: 18,
    typicalYieldMax: 25,
    cultivationCostPerAcre: 18000,
    diseaseRisk: "Blast, BLB",
    marketDemand: "High",
    icon: "🌾"
  },
  Groundnut: {
    soil: ["sandy", "loamy", "alluvial"],
    phMin: 6.0,
    phMax: 7.5,
    tempMin: 20,
    tempMax: 30,
    rainMin: 500,
    rainMax: 1000,
    waterRequirement: "Low",
    seasons: ["Kharif", "Rabi"],
    durationDays: 110,
    typicalYieldMin: 8,
    typicalYieldMax: 12,
    cultivationCostPerAcre: 15000,
    diseaseRisk: "Tikka Leaf Spot",
    marketDemand: "Medium",
    icon: "🥜"
  },
  Maize: {
    soil: ["alluvial", "loamy", "red"],
    phMin: 5.8,
    phMax: 7.2,
    tempMin: 18,
    tempMax: 27,
    rainMin: 600,
    rainMax: 1200,
    waterRequirement: "Medium",
    seasons: ["Kharif", "Rabi"],
    durationDays: 100,
    typicalYieldMin: 15,
    typicalYieldMax: 22,
    cultivationCostPerAcre: 12000,
    diseaseRisk: "Turcicum Blight",
    marketDemand: "High",
    icon: "🌽"
  },
  Cotton: {
    soil: ["black", "alluvial"],
    phMin: 6.0,
    phMax: 8.0,
    tempMin: 21,
    tempMax: 30,
    rainMin: 500,
    rainMax: 1100,
    waterRequirement: "Medium",
    seasons: ["Kharif"],
    durationDays: 160,
    typicalYieldMin: 10,
    typicalYieldMax: 15,
    cultivationCostPerAcre: 20000,
    diseaseRisk: "Bollworm",
    marketDemand: "High",
    icon: "🧶"
  },
  Tomato: {
    soil: ["sandy", "loamy", "red", "alluvial"],
    phMin: 6.0,
    phMax: 7.0,
    tempMin: 18,
    tempMax: 32,
    rainMin: 400,
    rainMax: 800,
    waterRequirement: "Medium",
    seasons: ["Kharif", "Rabi"],
    durationDays: 90,
    typicalYieldMin: 80,
    typicalYieldMax: 120,
    cultivationCostPerAcre: 25000,
    diseaseRisk: "Early Blight",
    marketDemand: "High",
    icon: "🍅"
  },
  Wheat: {
    soil: ["clayey", "loamy", "alluvial"],
    phMin: 6.0,
    phMax: 7.5,
    tempMin: 10,
    tempMax: 25,
    rainMin: 400,
    rainMax: 750,
    waterRequirement: "Medium",
    seasons: ["Rabi"],
    durationDays: 130,
    typicalYieldMin: 16,
    typicalYieldMax: 22,
    cultivationCostPerAcre: 14000,
    diseaseRisk: "Rust, Mildew",
    marketDemand: "High",
    icon: "🌾"
  },
  Chilli: {
    soil: ["loamy", "black", "red", "alluvial"],
    phMin: 6.0,
    phMax: 7.5,
    tempMin: 20,
    tempMax: 35,
    rainMin: 600,
    rainMax: 1000,
    waterRequirement: "Medium",
    seasons: ["Kharif", "Rabi"],
    durationDays: 140,
    typicalYieldMin: 12,
    typicalYieldMax: 18,
    cultivationCostPerAcre: 22000,
    diseaseRisk: "Anthracnose",
    marketDemand: "High",
    icon: "🌶"
  },
  Chickpea: {
    soil: ["clayey", "loamy", "black"],
    phMin: 6.0,
    phMax: 7.2,
    tempMin: 15,
    tempMax: 25,
    rainMin: 350,
    rainMax: 500,
    waterRequirement: "Low",
    seasons: ["Rabi"],
    durationDays: 110,
    typicalYieldMin: 6,
    typicalYieldMax: 10,
    cultivationCostPerAcre: 10000,
    diseaseRisk: "Fusarium Wilt",
    marketDemand: "Medium",
    icon: "🌱"
  },
  Mustard: {
    soil: ["loamy", "clayey", "sandy"],
    phMin: 6.0,
    phMax: 7.5,
    tempMin: 10,
    tempMax: 25,
    rainMin: 300,
    rainMax: 500,
    waterRequirement: "Low",
    seasons: ["Rabi"],
    durationDays: 110,
    typicalYieldMin: 5,
    typicalYieldMax: 8,
    cultivationCostPerAcre: 8000,
    diseaseRisk: "White Rust",
    marketDemand: "Medium",
    icon: "🌼"
  },
  Potato: {
    soil: ["sandy", "loamy", "alluvial"],
    phMin: 5.2,
    phMax: 6.5,
    tempMin: 15,
    tempMax: 22,
    rainMin: 500,
    rainMax: 800,
    waterRequirement: "Medium",
    seasons: ["Rabi"],
    durationDays: 100,
    typicalYieldMin: 80,
    typicalYieldMax: 120,
    cultivationCostPerAcre: 28000,
    diseaseRisk: "Late Blight",
    marketDemand: "High",
    icon: "🥔"
  }
};

const CROP_SEASONAL_DATA = {
  Rice: {
    Kharif: {
      typicalYieldMin: 20,
      typicalYieldMax: 26,
      seedCost: 1500,
      fertilizerCost: 3500,
      pesticideCost: 2000,
      labourCost: 6000,
      irrigationCost: 1000,
      machineryCost: 3000,
      otherCosts: 1000,
      waterRequirement: "High",
      durationDays: 120,
      rainMin: 1000,
      rainMax: 2000,
      tempMin: 22,
      tempMax: 35
    },
    Rabi: {
      typicalYieldMin: 18,
      typicalYieldMax: 24,
      seedCost: 1500,
      fertilizerCost: 3500,
      pesticideCost: 2200,
      labourCost: 6500,
      irrigationCost: 3000,
      machineryCost: 3000,
      otherCosts: 1200,
      waterRequirement: "High",
      durationDays: 130,
      rainMin: 400,
      rainMax: 800,
      tempMin: 18,
      tempMax: 30
    },
    Zaid: {
      typicalYieldMin: 14,
      typicalYieldMax: 18,
      seedCost: 1500,
      fertilizerCost: 3000,
      pesticideCost: 1800,
      labourCost: 5500,
      irrigationCost: 4500,
      machineryCost: 2500,
      otherCosts: 1000,
      waterRequirement: "High",
      durationDays: 100,
      rainMin: 100,
      rainMax: 400,
      tempMin: 25,
      tempMax: 40
    }
  },
  Groundnut: {
    Kharif: {
      typicalYieldMin: 8,
      typicalYieldMax: 12,
      seedCost: 3000,
      fertilizerCost: 2500,
      pesticideCost: 1500,
      labourCost: 4500,
      irrigationCost: 500,
      machineryCost: 2500,
      otherCosts: 800,
      waterRequirement: "Low",
      durationDays: 110,
      rainMin: 500,
      rainMax: 1000,
      tempMin: 22,
      tempMax: 32
    },
    Rabi: {
      typicalYieldMin: 9,
      typicalYieldMax: 13,
      seedCost: 3200,
      fertilizerCost: 2800,
      pesticideCost: 1600,
      labourCost: 5000,
      irrigationCost: 2000,
      machineryCost: 2500,
      otherCosts: 900,
      waterRequirement: "Low",
      durationDays: 115,
      rainMin: 200,
      rainMax: 500,
      tempMin: 18,
      tempMax: 28
    },
    Zaid: {
      typicalYieldMin: 7,
      typicalYieldMax: 10,
      seedCost: 3000,
      fertilizerCost: 2200,
      pesticideCost: 1400,
      labourCost: 4000,
      irrigationCost: 3000,
      machineryCost: 2000,
      otherCosts: 800,
      waterRequirement: "Low",
      durationDays: 95,
      rainMin: 50,
      rainMax: 300,
      tempMin: 24,
      tempMax: 38
    }
  },
  Maize: {
    Kharif: {
      typicalYieldMin: 16,
      typicalYieldMax: 22,
      seedCost: 2000,
      fertilizerCost: 3000,
      pesticideCost: 1800,
      labourCost: 4500,
      irrigationCost: 800,
      machineryCost: 2500,
      otherCosts: 900,
      waterRequirement: "Medium",
      durationDays: 100,
      rainMin: 600,
      rainMax: 1200,
      tempMin: 20,
      tempMax: 32
    },
    Rabi: {
      typicalYieldMin: 18,
      typicalYieldMax: 25,
      seedCost: 2200,
      fertilizerCost: 3200,
      pesticideCost: 2000,
      labourCost: 5000,
      irrigationCost: 2200,
      machineryCost: 2500,
      otherCosts: 1000,
      waterRequirement: "Medium",
      durationDays: 115,
      rainMin: 200,
      rainMax: 600,
      tempMin: 15,
      tempMax: 28
    },
    Zaid: {
      typicalYieldMin: 12,
      typicalYieldMax: 16,
      seedCost: 2000,
      fertilizerCost: 2500,
      pesticideCost: 1500,
      labourCost: 3800,
      irrigationCost: 3200,
      machineryCost: 2000,
      otherCosts: 800,
      waterRequirement: "Medium",
      durationDays: 90,
      rainMin: 100,
      rainMax: 400,
      tempMin: 22,
      tempMax: 38
    }
  },
  Cotton: {
    Kharif: {
      typicalYieldMin: 8,
      typicalYieldMax: 14,
      seedCost: 4000,
      fertilizerCost: 4000,
      pesticideCost: 3500,
      labourCost: 6500,
      irrigationCost: 1500,
      machineryCost: 3000,
      otherCosts: 1500,
      waterRequirement: "Medium",
      durationDays: 160,
      rainMin: 600,
      rainMax: 1200,
      tempMin: 22,
      tempMax: 35
    },
    Rabi: null,
    Zaid: null
  },
  Tomato: {
    Kharif: {
      typicalYieldMin: 70,
      typicalYieldMax: 100,
      seedCost: 5000,
      fertilizerCost: 5000,
      pesticideCost: 4000,
      labourCost: 7000,
      irrigationCost: 1500,
      machineryCost: 2500,
      otherCosts: 1500,
      waterRequirement: "Medium",
      durationDays: 90,
      rainMin: 500,
      rainMax: 900,
      tempMin: 20,
      tempMax: 32
    },
    Rabi: {
      typicalYieldMin: 80,
      typicalYieldMax: 120,
      seedCost: 5500,
      fertilizerCost: 5500,
      pesticideCost: 4200,
      labourCost: 7500,
      irrigationCost: 2500,
      machineryCost: 2500,
      otherCosts: 1800,
      waterRequirement: "Medium",
      durationDays: 100,
      rainMin: 200,
      rainMax: 500,
      tempMin: 16,
      tempMax: 28
    },
    Zaid: {
      typicalYieldMin: 50,
      typicalYieldMax: 80,
      seedCost: 5000,
      fertilizerCost: 4500,
      pesticideCost: 3500,
      labourCost: 6000,
      irrigationCost: 4000,
      machineryCost: 2000,
      otherCosts: 1200,
      waterRequirement: "Medium",
      durationDays: 85,
      rainMin: 50,
      rainMax: 300,
      tempMin: 24,
      tempMax: 38
    }
  },
  Wheat: {
    Kharif: null,
    Rabi: {
      typicalYieldMin: 16,
      typicalYieldMax: 22,
      seedCost: 2200,
      fertilizerCost: 3200,
      pesticideCost: 1500,
      labourCost: 4500,
      irrigationCost: 2000,
      machineryCost: 2800,
      otherCosts: 1000,
      waterRequirement: "Medium",
      durationDays: 120,
      rainMin: 400,
      rainMax: 700,
      tempMin: 12,
      tempMax: 25
    },
    Zaid: null
  },
  Chilli: {
    Kharif: {
      typicalYieldMin: 12,
      typicalYieldMax: 16,
      seedCost: 6000,
      fertilizerCost: 6000,
      pesticideCost: 5000,
      labourCost: 8000,
      irrigationCost: 2000,
      machineryCost: 3000,
      otherCosts: 2000,
      waterRequirement: "Medium",
      durationDays: 140,
      rainMin: 600,
      rainMax: 1100,
      tempMin: 20,
      tempMax: 35
    },
    Rabi: {
      typicalYieldMin: 14,
      typicalYieldMax: 18,
      seedCost: 6500,
      fertilizerCost: 6500,
      pesticideCost: 5200,
      labourCost: 8500,
      irrigationCost: 3500,
      machineryCost: 3000,
      otherCosts: 2200,
      waterRequirement: "Medium",
      durationDays: 150,
      rainMin: 300,
      rainMax: 700,
      tempMin: 18,
      tempMax: 30
    },
    Zaid: null
  },
  Chickpea: {
    Kharif: null,
    Rabi: {
      typicalYieldMin: 6,
      typicalYieldMax: 10,
      seedCost: 2000,
      fertilizerCost: 2000,
      pesticideCost: 1200,
      labourCost: 3500,
      irrigationCost: 1000,
      machineryCost: 2000,
      otherCosts: 800,
      waterRequirement: "Low",
      durationDays: 110,
      rainMin: 350,
      rainMax: 500,
      tempMin: 15,
      tempMax: 25
    },
    Zaid: null
  },
  Mustard: {
    Kharif: null,
    Rabi: {
      typicalYieldMin: 5,
      typicalYieldMax: 8,
      seedCost: 1000,
      fertilizerCost: 2200,
      pesticideCost: 1200,
      labourCost: 3000,
      irrigationCost: 1000,
      machineryCost: 1800,
      otherCosts: 800,
      waterRequirement: "Low",
      durationDays: 110,
      rainMin: 300,
      rainMax: 500,
      tempMin: 10,
      tempMax: 25
    },
    Zaid: null
  },
  Potato: {
    Kharif: null,
    Rabi: {
      typicalYieldMin: 80,
      typicalYieldMax: 120,
      seedCost: 8000,
      fertilizerCost: 6000,
      pesticideCost: 3000,
      labourCost: 7000,
      irrigationCost: 3000,
      machineryCost: 2500,
      otherCosts: 1500,
      waterRequirement: "Medium",
      durationDays: 100,
      rainMin: 500,
      rainMax: 800,
      tempMin: 15,
      tempMax: 22
    },
    Zaid: null
  }
};

const CropEngine = {
  calculateSuitability(cropName, profile, weather) {
    const crop = CROP_KNOWLEDGE_BASE[cropName];
    if (!crop) return null;

    const activeSeason = document.getElementById("calc-season")?.value || "kharif";
    const activeSeasonNorm = activeSeason.charAt(0).toUpperCase() + activeSeason.slice(1).toLowerCase();
    const seasonal = CROP_SEASONAL_DATA[cropName]?.[activeSeasonNorm];

    // Soil compatibility
    const cropSoil = crop.soil;
    const farmerSoil = (profile.soil_type || "loamy").toLowerCase();
    let soilScore = 30;
    if (cropSoil.includes(farmerSoil)) {
      soilScore = 100;
    } else if (farmerSoil === "loamy" || farmerSoil === "alluvial") {
      soilScore = 70;
    }

    // pH compatibility
    const farmerPh = parseFloat(profile.soil_ph) || 6.5;
    let phScore = 100;
    if (farmerPh < crop.phMin) {
      const diff = crop.phMin - farmerPh;
      phScore = Math.max(40, Math.round(100 - diff * 40));
    } else if (farmerPh > crop.phMax) {
      const diff = farmerPh - crop.phMax;
      phScore = Math.max(40, Math.round(100 - diff * 40));
    }

    // Temperature & Rainfall suitability (derived from seasonal profile if suitable)
    let tempScore = 10;
    let rainScore = 10;
    let seasonScore = 10;
    let waterScore = 50;

    if (seasonal) {
      seasonScore = 100;
      
      const temp = weather?.temp || 28;
      if (temp >= seasonal.tempMin && temp <= seasonal.tempMax) {
        tempScore = 100;
      } else {
        const mid = (seasonal.tempMin + seasonal.tempMax) / 2;
        const diff = Math.abs(temp - mid);
        tempScore = Math.max(40, Math.round(100 - diff * 8));
      }

      const rain = weather?.rainfall || 800;
      if (rain >= seasonal.rainMin && rain <= seasonal.rainMax) {
        rainScore = 100;
      } else {
        const mid = (seasonal.rainMin + seasonal.rainMax) / 2;
        const diff = Math.abs(rain - mid);
        rainScore = Math.max(40, Math.round(100 - (diff / mid) * 80));
      }

      // Water suitability matching water requirement of this season
      const waterAvail = (profile.water_availability || "Medium").toLowerCase();
      if (seasonal.waterRequirement === "High") {
        if (waterAvail === "high") waterScore = 100;
        else if (waterAvail === "medium") waterScore = 60;
        else waterScore = 20;
      } else if (seasonal.waterRequirement === "Medium") {
        if (waterAvail === "high") waterScore = 90;
        else if (waterAvail === "medium") waterScore = 100;
        else waterScore = 50;
      } else {
        if (waterAvail === "high") waterScore = 70;
        else if (waterAvail === "medium") waterScore = 90;
        else waterScore = 100;
      }
    }

    // Market score
    let marketScore = 80;
    if (crop.marketDemand === "High") marketScore = 100;
    else if (crop.marketDemand === "Medium") marketScore = 80;
    else marketScore = 60;

    // Risk score
    let riskScore = 90;
    try {
      const history = JSON.parse(localStorage.getItem("krushakseva_diagnosis_history") || "[]");
      const cropIncidents = history.filter(h => h.crop.toLowerCase().includes(cropName.toLowerCase()));
      if (cropIncidents.length > 0) {
        riskScore = Math.max(40, 90 - cropIncidents.length * 15);
      }
    } catch (e) {}

    const overallSuitability = Math.round(
      (soilScore * 0.2) +
      (phScore * 0.1) +
      (tempScore * 0.15) +
      (rainScore * 0.15) +
      (waterScore * 0.2) +
      (seasonScore * 0.2)
    );

    return {
      overallSuitability,
      soilScore,
      phScore,
      tempScore,
      rainScore,
      waterScore,
      seasonScore,
      marketScore,
      riskScore
    };
  },

  estimateYieldRange(cropName, suitabilityScore, landSize) {
    const crop = CROP_KNOWLEDGE_BASE[cropName];
    const activeSeason = document.getElementById("calc-season")?.value || "kharif";
    const activeSeasonNorm = activeSeason.charAt(0).toUpperCase() + activeSeason.slice(1).toLowerCase();
    const seasonal = CROP_SEASONAL_DATA[cropName]?.[activeSeasonNorm];

    let baseMin = crop.typicalYieldMin;
    let baseMax = crop.typicalYieldMax;
    let seasonalPenalty = 1.0;

    if (seasonal) {
      baseMin = seasonal.typicalYieldMin;
      baseMax = seasonal.typicalYieldMax;
    } else {
      seasonalPenalty = 0.2; // off-season penalty
    }

    const suitabilityFactor = 0.5 + (suitabilityScore / 100) * 0.5;
    const yieldPerAcreMin = parseFloat((baseMin * suitabilityFactor * seasonalPenalty).toFixed(1));
    const yieldPerAcreMax = parseFloat((baseMax * suitabilityFactor * seasonalPenalty).toFixed(1));
    
    return {
      yieldPerAcreMin,
      yieldPerAcreMax,
      expectedYieldMin: parseFloat((yieldPerAcreMin * landSize).toFixed(1)),
      expectedYieldMax: parseFloat((yieldPerAcreMax * landSize).toFixed(1))
    };
  },

  calculateFinancials(cropName, yieldRange, landSize, mandiPrice) {
    const crop = CROP_KNOWLEDGE_BASE[cropName];
    const activeSeason = document.getElementById("calc-season")?.value || "kharif";
    const activeSeasonNorm = activeSeason.charAt(0).toUpperCase() + activeSeason.slice(1).toLowerCase();
    const seasonal = CROP_SEASONAL_DATA[cropName]?.[activeSeasonNorm];

    let costPerAcre = crop.cultivationCostPerAcre;
    if (seasonal) {
      costPerAcre = seasonal.seedCost + seasonal.fertilizerCost + seasonal.pesticideCost +
                    seasonal.labourCost + seasonal.irrigationCost + seasonal.machineryCost +
                    seasonal.otherCosts;
    }

    const totalCost = Math.round(costPerAcre * landSize);
    
    const revenueMin = Math.round(yieldRange.expectedYieldMin * mandiPrice);
    const revenueMax = Math.round(yieldRange.expectedYieldMax * mandiPrice);
    
    const profitMin = revenueMin - totalCost;
    const profitMax = revenueMax - totalCost;
    
    const profitMarginMin = revenueMin > 0 ? parseFloat(((profitMin / revenueMin) * 100).toFixed(1)) : 0;
    const profitMarginMax = revenueMax > 0 ? parseFloat(((profitMax / revenueMax) * 100).toFixed(1)) : 0;
    
    // Deterministic ranges (+/-10% yield variance, +/-5% price variance, +/-5% cost variance)
    const lowRev = Math.round((yieldRange.expectedYieldMin * 0.9) * (mandiPrice * 0.95));
    const highRev = Math.round((yieldRange.expectedYieldMax * 1.1) * (mandiPrice * 1.1));
    const lowCost = Math.round(totalCost * 0.95);
    const highCost = Math.round(totalCost * 1.05);

    const profitRangeMin = Math.round(lowRev - highCost);
    const profitRangeMax = Math.round(highRev - lowCost);

    return {
      costPerAcre,
      totalCost,
      revenueMin,
      revenueMax,
      profitMin,
      profitMax,
      profitMarginMin,
      profitMarginMax,
      profitRangeMin,
      profitRangeMax
    };
  },

  evaluateCrop(cropName, profile, weather, mandiPrice, landSize) {
    const suitability = this.calculateSuitability(cropName, profile, weather);
    const yieldRange = this.estimateYieldRange(cropName, suitability.overallSuitability, landSize);
    const financials = this.calculateFinancials(cropName, yieldRange, landSize, mandiPrice);
    
    let confidence = "High";
    if (weather.status === "unavailable" || activeMandiData?.isDemo) {
      confidence = "Medium";
    }
    if (weather.status === "unavailable" && activeMandiData?.isDemo) {
      confidence = "Low";
    }

    return {
      crop: cropName,
      suitability: suitability.overallSuitability,
      scores: suitability,
      yieldRange,
      financials,
      confidence,
      mandiPrice,
      diseaseRisk: CROP_KNOWLEDGE_BASE[cropName].diseaseRisk,
      marketDemand: CROP_KNOWLEDGE_BASE[cropName].marketDemand,
      icon: CROP_KNOWLEDGE_BASE[cropName].icon
    };
  }
};

const CropRecommendation = {
  findBestRecommendations(evaluationList) {
    if (!evaluationList || evaluationList.length === 0) return null;
    
    let bestOverall = evaluationList[0];
    evaluationList.forEach(e => {
      if (e.suitability > bestOverall.suitability) bestOverall = e;
    });

    let highestProfit = evaluationList[0];
    evaluationList.forEach(e => {
      if (e.financials.profitMax > highestProfit.financials.profitMax) highestProfit = e;
    });

    let bestSoil = evaluationList[0];
    evaluationList.forEach(e => {
      if (e.scores.soilScore > bestSoil.scores.soilScore) bestSoil = e;
    });

    let lowestWater = evaluationList[0];
    const waterMapping = { "Low": 1, "Medium": 2, "High": 3 };
    evaluationList.forEach(e => {
      const eReq = CROP_KNOWLEDGE_BASE[e.crop].waterRequirement;
      const lwReq = CROP_KNOWLEDGE_BASE[lowestWater.crop].waterRequirement;
      if (waterMapping[eReq] < waterMapping[lwReq]) lowestWater = e;
    });

    let lowestRisk = evaluationList[0];
    evaluationList.forEach(e => {
      if (e.scores.riskScore > lowestRisk.scores.riskScore) lowestRisk = e;
    });

    return {
      bestOverall,
      highestProfit,
      bestSoil,
      lowestWater,
      lowestRisk
    };
  }
};

function generateAIAdvisoryExplanation(evalItem) {
  const crop = evalItem.crop;
  const isTe = currentLang === "te";
  
  let explanation = "";
  if (isTe) {
    explanation += `<h3 style="font-weight:700; color:var(--text-main); margin-bottom:8px;">${translateMandiTerm(crop)} ఎందుకు ఉత్తమ ఎంపిక?</h3><ul style="margin-top:8px; display:flex; flex-direction:column; gap:6px; padding-left:20px; list-style-type:disc; color:var(--text-main);">`;
    explanation += `<li><strong>నేల అనుకూలత:</strong> మీ క్షేత్ర నేల రకానికి ఈ పంట ${evalItem.scores.soilScore}% అనుకూలంగా ఉంది.</li>`;
    explanation += `<li><strong>వాతావరణం:</strong> ప్రస్తుత ఉష్ణోగ్రత మరియు వర్షపాతం ఈ పంట అవసరాలకు ${evalItem.scores.tempScore}% సరిపోతాయి.</li>`;
    explanation += `<li><strong>మార్కెట్ విలువ:</strong> మండి మార్కెట్లో క్వింటాలుకు ₹${evalItem.mandiPrice.toLocaleString()} సగటు ధర లభిస్తుంది.</li>`;
    explanation += `<li><strong>లాభాల అంచనా:</strong> ఈ పంట సాగు ద్వారా హెక్టారుకు ₹${evalItem.financials.profitMin.toLocaleString()} నుండి ₹${evalItem.financials.profitMax.toLocaleString()} నికర లాభం పొందవచ్చు.</li>`;
    explanation += `</ul>`;
  } else {
    explanation += `<h3 style="font-weight:700; color:var(--text-main); margin-bottom:8px;">Why ${crop} is the Best Match?</h3><ul style="margin-top:8px; display:flex; flex-direction:column; gap:6px; padding-left:20px; list-style-type:disc; color:var(--text-main);">`;
    
    if (evalItem.scores.soilScore >= 80) {
      explanation += `<li><strong>Soil Compatibility:</strong> Highly compatible with your registered soil type (Compatibility Score: ${evalItem.scores.soilScore}%).</li>`;
    } else {
      explanation += `<li><strong>Soil Compatibility:</strong> Sub-optimal soil fit (Compatibility Score: ${evalItem.scores.soilScore}%) but manageable with local soil additives.</li>`;
    }
    
    if (evalItem.scores.tempScore >= 80) {
      explanation += `<li><strong>Climate Suitability:</strong> Temperature conditions are perfect for growth (Climate Match: ${evalItem.scores.tempScore}%).</li>`;
    } else {
      explanation += `<li><strong>Climate Suitability:</strong> Temperatures are slightly extreme but within acceptable cultivation limits.</li>`;
    }
    
    explanation += `<li><strong>Profit Outlook:</strong> Strong financial prospects with expected profit margins between ${evalItem.financials.profitMarginMin}% and ${evalItem.financials.profitMarginMax}%.</li>`;
    explanation += `<li><strong>Water/Irrigation match:</strong> Suitable water allocation profile aligned with your available irrigation sources.</li>`;
    
    if (evalItem.scores.riskScore < 70) {
      explanation += `<li>⚠️ <strong>Risk Warning:</strong> Moderate local disease history noted for ${crop} (Blast/Blight risk). Keep crop doctor monitoring enabled.</li>`;
    } else {
      explanation += `<li>✓ <strong>Low Disease Risk:</strong> Crop shows low historical disease occurrences in this geographical sector.</li>`;
    }
    
    explanation += `</ul>`;
  }
  
  return explanation;
}

function getMandiPriceForCrop(crop) {
  if (!crop) return 2000;
  
  // 1. Try to get cached official mandi price
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

  // 2. Try to get demo market price for the selected market
  try {
    const marketSelect = document.getElementById("filter-mandi-market");
    const activeMarket = marketSelect ? marketSelect.value : "Nellore";
    const res = getDemoMarketPrice(crop, activeMarket);
    if (res && typeof res === "object" && res.modal) {
      return res.modal;
    }
    if (typeof res === "number") {
      return res;
    }
  } catch (e) {}

  // 3. Fallback to base reference crop price
  return getDemoBasePriceForCrop(crop);
}

// Bind compareCropsBtn click event
const compareCropsBtn = document.getElementById("compareCropsBtn");
if (compareCropsBtn) {
  compareCropsBtn.addEventListener("click", () => {
    const checkedBoxes = document.querySelectorAll("input[name='crop_compare_pref']:checked");
    const selectedCrops = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (selectedCrops.length < 3) {
      alert("Please select at least 3 crops to compare.");
      return;
    }
    
    const loading = document.getElementById("compareCropsLoading");
    const resultBox = document.getElementById("advisorComparisonResultBox");
    const tbody = document.getElementById("cropComparisonTableBody");
    
    if (loading) loading.style.display = "block";
    if (resultBox) resultBox.style.display = "block";
    tbody.innerHTML = "";

    const profile = registeredFarmer || {
      location: detectedLocationName || "Andhra Pradesh",
      land_size_acres: 5.0,
      soil_type: "Loamy",
      soil_ph: 6.5,
      water_availability: "Medium",
      irrigation_method: "borewell"
    };

    const landSize = parseFloat(profile.land_size_acres) || 5.0;
    const weather = latestWeatherState || {
      temp: 28,
      humidity: 75,
      rainfall: 850,
      status: "reference"
    };

    // Update Environmental Data Used Display
    const usedLoc = document.getElementById("used-location");
    const usedSoil = document.getElementById("used-soil");
    const usedPh = document.getElementById("used-ph");
    const usedWater = document.getElementById("used-water");
    const usedSeason = document.getElementById("used-season");
    const usedRain = document.getElementById("used-rainfall");
    const usedTemp = document.getElementById("used-temp");
    const usedMandi = document.getElementById("used-mandi");
    const usedUpdated = document.getElementById("used-last-updated");

    if (usedLoc) usedLoc.textContent = profile.location || "Not provided";
    if (usedSoil) usedSoil.textContent = profile.soil_type || "Not provided";
    if (usedPh) usedPh.textContent = profile.soil_ph || "Not provided";
    if (usedWater) usedWater.textContent = profile.water_availability ? `${profile.water_availability} (${profile.irrigation_method || "None"})` : "Not provided";
    if (usedSeason) usedSeason.textContent = document.getElementById("calc-season")?.value || "Kharif";
    if (usedRain) usedRain.textContent = weather.rainfall ? `${weather.rainfall} mm` : "Not provided";
    if (usedTemp) usedTemp.textContent = weather.temp ? `${weather.temp}°C` : "Not provided";
    if (usedMandi) usedMandi.textContent = activeMandiData && !activeMandiData.isDemo ? "AGMARKNET (Live)" : "Reference/Demo Data";
    if (usedUpdated) usedUpdated.textContent = new Date().toLocaleTimeString();

    // Data Status Badge update
    const statusBadge = document.getElementById("advisor-data-status-badge");
    if (statusBadge) {
      if (weather.status === "live" && activeMandiData && !activeMandiData.isDemo) {
        statusBadge.textContent = "🟢 Live Weather & Market Data";
        statusBadge.style.background = "#dcfce7";
        statusBadge.style.color = "#166534";
      } else if (weather.status === "live" || (activeMandiData && !activeMandiData.isDemo)) {
        statusBadge.textContent = "🟡 Cached Environmental Records";
        statusBadge.style.background = "#fef3c7";
        statusBadge.style.color = "#92400e";
      } else {
        statusBadge.textContent = "🔵 Agricultural Reference Data";
        statusBadge.style.background = "rgba(100, 116, 139, 0.1)";
        statusBadge.style.color = "#64748b";
      }
    }

    setTimeout(() => {
      try {
        if (loading) loading.style.display = "none";
        
        const evaluationList = [];
        selectedCrops.forEach(cropName => {
          let price = getMandiPriceForCrop(cropName);
          const evaluation = CropEngine.evaluateCrop(cropName, profile, weather, price, landSize);
          evaluationList.push(evaluation);
        });

        tbody.innerHTML = "";
        evaluationList.forEach(e => {
          const tr = document.createElement("tr");
          
          const isTe = currentLang === "te";
          const cropVal = `${e.icon} ${isTe ? translateMandiTerm(e.crop) : e.crop}`;
          const scoreVal = `${e.suitability}%`;
          const soilVal = `${e.scores.soilScore}%`;
          const waterVal = isTe ? translateMandiTerm(CROP_KNOWLEDGE_BASE[e.crop].waterRequirement) : CROP_KNOWLEDGE_BASE[e.crop].waterRequirement;
          const climateVal = `${e.scores.tempScore}%`;
          const investVal = `₹${e.financials.totalCost.toLocaleString()}`;
          const yieldVal = `${e.yieldRange.expectedYieldMin}–${e.yieldRange.expectedYieldMax} ${isTe ? "క్వింటాళ్ళు" : "Quintals"}`;
          const revVal = `₹${e.financials.revenueMin.toLocaleString()}–₹${e.financials.revenueMax.toLocaleString()}`;
          const profitVal = `₹${e.financials.profitMin.toLocaleString()}–₹${e.financials.profitMax.toLocaleString()}`;
          const marginVal = `${e.financials.profitMarginMin}%–${e.financials.profitMarginMax}%`;
          const riskVal = isTe ? translateMandiTerm(CROP_KNOWLEDGE_BASE[e.crop].diseaseRisk) : CROP_KNOWLEDGE_BASE[e.crop].diseaseRisk;
          const demandVal = isTe ? translateMandiTerm(CROP_KNOWLEDGE_BASE[e.crop].marketDemand) : CROP_KNOWLEDGE_BASE[e.crop].marketDemand;
          const priceVal = `₹${e.mandiPrice.toLocaleString()} / Qtl`;
          const confVal = isTe ? translateMandiTerm(e.confidence) : e.confidence;

          tr.innerHTML = `
            <td><strong>${cropVal}</strong></td>
            <td style="font-weight:600; color:var(--primary);">${scoreVal}</td>
            <td>${soilVal}</td>
            <td>${waterVal}</td>
            <td>${climateVal}</td>
            <td>${investVal}</td>
            <td>${yieldVal}</td>
            <td>${revVal}</td>
            <td class="net-profit-val" style="font-weight:600;">${profitVal}</td>
            <td>${marginVal}</td>
            <td style="color:#eab308; font-size:11px;">${riskVal}</td>
            <td>${demandVal}</td>
            <td>${priceVal}</td>
            <td style="font-size:11px; font-weight:600;">${confVal}</td>
          `;
          tbody.appendChild(tr);
        });

        const recs = CropRecommendation.findBestRecommendations(evaluationList);
        if (recs) {
          const isTe = currentLang === "te";
          const bestNameEl = document.getElementById("bestCropNameText");
          const bestExpEl = document.getElementById("bestCropExplanationText");
          const bannerEl = document.getElementById("bestCropRecommendationBanner");
          
          if (bestNameEl) bestNameEl.textContent = isTe ? translateMandiTerm(recs.bestOverall.crop) : recs.bestOverall.crop;
          
          const explanationText = generateAIAdvisoryExplanation(recs.bestOverall);
          
          let choicesHtml = explanationText;
          choicesHtml += `
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(200, 200, 200, 0.1); display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; font-size: 11px; color:var(--text-main);">
              <div>💎 <strong>${isTe ? "గరిష్ట లాభం:" : "Highest Profit:"}</strong> ${isTe ? translateMandiTerm(recs.highestProfit.crop) : recs.highestProfit.crop}</div>
              <div>🤎 <strong>${isTe ? "మట్టికి అనుకూలం:" : "Best Soil Match:"}</strong> ${isTe ? translateMandiTerm(recs.bestSoil.crop) : recs.bestSoil.crop}</div>
              <div>💧 <strong>${isTe ? "తక్కువ నీటి వాడకం:" : "Lowest Water:"}</strong> ${isTe ? translateMandiTerm(recs.lowestWater.crop) : recs.lowestWater.crop}</div>
              <div>🛡️ <strong>${isTe ? "అతి తక్కువ ప్రమాదం:" : "Lowest Risk:"}</strong> ${isTe ? translateMandiTerm(recs.lowestRisk.crop) : recs.lowestRisk.crop}</div>
            </div>
          `;
          if (bestExpEl) bestExpEl.innerHTML = choicesHtml;
          if (bannerEl) bannerEl.style.display = "flex";
        }
      } catch (err) {
        console.error("Comparison execution error:", err);
        if (loading) loading.style.display = "none";
        tbody.innerHTML = `
          <tr>
            <td colspan="14" style="text-align: center; color: var(--text-muted); padding: 20px;">
              <span style="color: #ef4444; font-weight: 600;"><i class="fa-solid fa-circle-exclamation"></i> Unable to calculate crop comparison. Please check your farm inputs and try again.</span>
              <br><small style="font-size: 11px;">Error details: ${err.message}</small>
            </td>
          </tr>
        `;
        const bannerEl = document.getElementById("bestCropRecommendationBanner");
        if (bannerEl) bannerEl.style.display = "none";
      }
    }, 500);
  });
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

let activeMandiData = null;

function filterMandiData() {
  const marketFilter = document.getElementById("filter-mandi-market").value;
  const commodityFilter = document.getElementById("filter-mandi-commodity").value;

  if (!activeMandiData) return;

  let displayDemo = activeMandiData.isDemo;
  let filteredMarkets = [];

  if (!displayDemo) {
    filteredMarkets = activeMandiData.nearest_markets.filter(m => {
      const matchMarket = marketFilter === "All" || String(m.market).toLowerCase().includes(marketFilter.toLowerCase());
      const matchCommodity = commodityFilter === "All" || String(m.commodity || activeMandiData.crop).toLowerCase().includes(commodityFilter.toLowerCase());
      return matchMarket && matchCommodity;
    });

    if (filteredMarkets.length === 0) {
      displayDemo = true;
    }
  }

  let displayMarkets = [];
  let reportedDate = "";
  let sourceVal = "";

  if (displayDemo) {
    displayMarkets = getFilteredOrGeneratedMarkets(marketFilter, commodityFilter);
    reportedDate = "Demo";
    sourceVal = "Demo data";

    setMandiStatus("demo");
    const warningBanner = document.getElementById("mandiWarningBanner");
    if (warningBanner) {
      warningBanner.style.display = "block";
      warningBanner.textContent = currentLang === "te"
        ? "అధికారిక మండి ధరలు తాత్కాలికంగా అందుబాటులో లేవు. దిగువ విలువలు డెమో సమాచారం మరియు ప్రత్యక్ష ధరలు కావు."
        : "Live official mandi prices are temporarily unavailable. The values below are demonstration data and are not live prices.";
    }

    const sourceEl = document.getElementById("marketDataSource");
    if (sourceEl) {
      sourceEl.textContent = currentLang === "te"
        ? "లైవ్ ప్రభుత్వ సమాచారం అందుబాటులో లేదు. ప్రదర్శన డేటా చూపబడుతోంది."
        : "Live official mandi prices are temporarily unavailable. Showing demonstration market data.";
    }
  } else {
    displayMarkets = filteredMarkets;
    reportedDate = activeMandiData.nearest_markets[0]?.reported_date || "Not supplied";
    sourceVal = activeMandiData.source || "Government market data";

    const warningBanner = document.getElementById("mandiWarningBanner");
    if (warningBanner) warningBanner.style.display = "none";

    setMandiStatus(activeMandiData.data_mode === "historical" ? "historical" : "live");

    const freshness = activeMandiData.data_mode === "historical"
      ? "Live feed temporarily unavailable. Showing real historical market records."
      : "Live Government Data — latest official daily prices.";
    const sourceEl = document.getElementById("marketDataSource");
    if (sourceEl) {
      sourceEl.textContent = `${freshness} Source: ${sourceVal}`;
    }
  }

  const marketBody = document.getElementById("market-prices-body");
  if (marketBody) {
    marketBody.innerHTML = "";
    displayMarkets.forEach(m => {
      const tr = document.createElement("tr");
      const area = [m.district, m.state].filter(Boolean).join(", ");
      const modal = Number(m.price ?? m.modal_price);
      const minimum = Number(m.min_price);
      const maximum = Number(m.max_price);

      const priceSuffix = currentLang === "te" ? " / క్వింటాల్" : " / Quintal";

      tr.innerHTML = `
        <td>${translateMandiTerm(m.market)}${area ? `<br><small>${area}</small>` : ""}</td>
        <td>${translateMandiTerm(m.commodity || activeMandiData.crop)}</td>
        <td>${Number.isFinite(minimum) ? `₹${minimum.toLocaleString()} ${priceSuffix}` : "—"}</td>
        <td>${Number.isFinite(maximum) ? `₹${maximum.toLocaleString()} ${priceSuffix}` : "—"}</td>
        <td>₹${modal.toLocaleString()} ${priceSuffix}</td>
        <td>${m.reported_date || reportedDate}</td>
        <td>${m.source || sourceVal}</td>
      `;
      marketBody.appendChild(tr);
    });
  }

  const selectedCrop = commodityFilter === "All" ? activeMandiData.crop : commodityFilter;
  const selectedMarket = marketFilter === "All" ? "Nellore" : marketFilter;

  let avgModal = 0;
  if (displayMarkets.length > 0) {
    const sum = displayMarkets.reduce((acc, curr) => acc + Number(curr.price ?? curr.modal_price), 0);
    avgModal = Math.round(sum / displayMarkets.length);
  } else {
    avgModal = getDemoBasePriceForCrop(selectedCrop);
  }

  updateMandiInsights(selectedCrop, selectedMarket, avgModal, displayDemo);

  if (displayDemo) {
    updateDemoMarketTrendChart(selectedCrop);
    if (selectedCrop !== "All" && selectedMarket !== "All") {
      fetchMandiForFilter(selectedCrop, selectedMarket);
    }
  } else {
    const comparisonTitle = document.getElementById("marketComparisonTitle");
    const notice = document.getElementById("marketChartNotice");

    if (activeMandiData.history && activeMandiData.history.length >= 2 && commodityFilter === "All") {
      if (comparisonTitle) comparisonTitle.textContent = `${translateMandiTerm(selectedCrop)} Mandi Rate Trend (₹ / Quintal)`;
      if (notice) notice.style.display = "none";
      updateMarketTrendChart(selectedCrop, activeMandiData.history.map(item => item.price), activeMandiData.history.map(item => item.date));
    } else if (displayMarkets.length) {
      if (comparisonTitle) comparisonTitle.textContent = `${translateMandiTerm(selectedCrop)} Market Comparison (₹ / Quintal)`;
      if (notice) {
        notice.textContent = "Reference records shown in the table are genuine reported market prices, not a 30-day trend.";
        notice.style.display = "block";
      }
      updateMarketComparisonChart(selectedCrop, displayMarkets);
    } else {
      if (marketTrendChartInstance) {
        marketTrendChartInstance.destroy();
        marketTrendChartInstance = null;
      }
      if (notice) {
        notice.textContent = "No trend data available for current filters.";
        notice.style.display = "block";
      }
    }
  }
}

function getDemoBasePriceForCrop(crop) {
  const c = crop.toLowerCase();
  if (c.includes("rice")) return 2200;
  if (c.includes("wheat")) return 2350;
  if (c.includes("maize")) return 2050;
  if (c.includes("groundnut")) return 6200;
  if (c.includes("cotton")) return 7000;
  if (c.includes("chilli")) return 15000;
  if (c.includes("tomato")) return 1000;
  if (c.includes("chickpea")) return 5200;
  if (c.includes("mustard")) return 5450;
  if (c.includes("potato")) return 1200;
  return 2500;
}

function getDemoMarketPrice(crop, market) {
  const basePrice = getDemoBasePriceForCrop(crop);
  const m = market.toLowerCase();
  let multiplier = 1.0;
  if (m.includes("nellore")) multiplier = 1.02;
  else if (m.includes("visakhapatnam")) multiplier = 0.98;
  else if (m.includes("guntur")) multiplier = 1.05;
  else if (m.includes("vijayawada")) multiplier = 1.01;
  else if (m.includes("kavali")) multiplier = 0.96;

  const modal = Math.round(basePrice * multiplier);
  const min = Math.round(modal * 0.92);
  const max = Math.round(modal * 1.08);
  return { min, max, modal };
}

function getFilteredOrGeneratedMarkets(marketFilter, commodityFilter) {
  const marketsList = ["Nellore", "Visakhapatnam", "Guntur", "Vijayawada", "Kavali"];
  const commoditiesList = ["Rice", "Wheat", "Maize", "Groundnut", "Cotton", "Tomato", "Chilli", "Chickpea", "Mustard", "Potato"];

  let targetMarkets = marketFilter === "All" ? marketsList : [marketFilter];
  let targetCommodities = commodityFilter === "All" ? commoditiesList : [commodityFilter];

  let list = [];
  targetMarkets.forEach(m => {
    targetCommodities.forEach(c => {
      const existing = MOCK_MANDI_DATA.find(item => item.market.toLowerCase() === m.toLowerCase() && item.commodity.toLowerCase() === c.toLowerCase());
      if (existing) {
        list.push({ ...existing });
      } else {
        const prices = getDemoMarketPrice(c, m);
        list.push({
          market: m,
          commodity: c,
          min_price: prices.min,
          max_price: prices.max,
          modal_price: prices.modal,
          district: m,
          state: "Andhra Pradesh"
        });
      }
    });
  });
  return list;
}

function updateMandiInsights(crop, market, modalPrice, isDemo) {
  const insightsBox = document.querySelector(".price-insights-card");
  if (!insightsBox) return;

  const isTe = currentLang === "te";
  const formattedPrice = `₹${modalPrice.toLocaleString()}`;

  let insightTitle = "";
  let insightText = "";
  let iconClass = "fa-solid fa-chart-line";

  if (isDemo) {
    insightTitle = isTe ? `${translateMandiTerm(crop)} మార్కెట్ విశ్లేషణ (డెమో)` : `${crop} Market Trend (Demo)`;
    if (crop.toLowerCase() === "chilli") {
      insightText = isTe
        ? `గుంటూరు మిర్చి మార్కెట్ ధర క్వింటాలుకు ${formattedPrice} వద్ద ఉంది. కొత్త పంట రాకతో ధరలు త్వరలో సర్దుబాటు కావచ్చు.`
        : `Guntur Chilli prices are holding at ${formattedPrice}/Quintal. Normal arrivals from farmers are keeping the trading volume active in the region.`;
    } else if (crop.toLowerCase() === "rice") {
      insightText = isTe
        ? `నెల్లూరు మసూరి బియ్యం ధర క్వింటాలుకు ${formattedPrice} వద్ద స్థిరంగా ఉంది. రాబోయే సీజన్‌లో స్థానిక డిమాండ్ పెరగవచ్చు.`
        : `Nellore Rice modal prices are steady at ${formattedPrice}/Quintal. Local demand remains high due to upcoming festival season purchasing.`;
    } else if (crop.toLowerCase() === "cotton") {
      insightText = isTe
        ? `పత్తి ధర క్వింటాలుకు ${formattedPrice} వద్ద స్థిరంగా ఉంది. నాణ్యమైన పత్తికి కొనుగోలుదారులు ఆసక్తి చూపుతున్నారు.`
        : `Cotton prices in Visakhapatnam and Guntur are trading around ${formattedPrice}/Quintal. Export inquiry is supporting stable prices.`;
    } else {
      insightText = isTe
        ? `${translateMandiTerm(crop)} సగటు మార్కెట్ ధర క్వింటాలుకు ${formattedPrice} వద్ద ఉంది. స్థానిక మార్కెట్లలో డిమాండ్ స్థిరంగా ఉంది.`
        : `Average mandi rate for ${crop} is trading around ${formattedPrice}/Quintal in Andhra Pradesh markets. Soil health and seasonal rainfall are supporting normal yields.`;
    }
  } else {
    insightTitle = isTe ? `అధికారిక విశ్లేషణ: ${translateMandiTerm(crop)}` : `Official Insight: ${crop}`;
    insightText = isTe
      ? `నిజ సమయ ప్రభుత్వ డేటా ప్రకారం ${translateMandiTerm(market)} మార్కెట్లో క్వింటాలుకు ${formattedPrice} వద్ద ట్రేడింగ్ జరుగుతోంది.`
      : `Live AGMARKNET prices for ${crop} in ${market} are trading at a modal price of ${formattedPrice}/Quintal. Daily arrivals are normal.`;
    iconClass = "fa-solid fa-circle-check";
  }

  insightsBox.innerHTML = `
    <h3>${isTe ? "మండి మార్కెట్ విశ్లేషణ" : "Mandi Market Insights"}</h3>
    <div class="insight-row">
      <div class="icon"><i class="${iconClass}" style="color: var(--primary);"></i></div>
      <div class="info">
        <strong>${insightTitle}</strong>
        <span>${insightText}</span>
      </div>
    </div>
  `;
}

function updateDemoMarketTrendChart(crop) {
  const basePrice = getDemoBasePriceForCrop(crop);
  const historyData = [];
  const labels = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(d.toISOString().slice(0, 10));

    const rand = getSeededRandom(`${crop}_mandi_hist_${i}`)();
    const price = Math.round(basePrice * (0.95 + rand * 0.1));
    historyData.push(price);
  }

  const comparisonTitle = document.getElementById("marketComparisonTitle");
  if (comparisonTitle) comparisonTitle.textContent = `${translateMandiTerm(crop)} Mandi Rate Trend (₹ / Quintal)`;

  const notice = document.getElementById("marketChartNotice");
  if (notice) {
    notice.textContent = currentLang === "te"
      ? "గమనిక: ఈ చారిత్రక ధరల ధోరణి కేవలం ప్రదర్శన కోసం మాత్రమే మరియు నిజమైనది కాదు."
      : "Live official mandi prices are temporarily unavailable. The trend below is demonstration historical data and not live prices.";
    notice.style.display = "block";
  }

  updateMarketTrendChart(crop, historyData, labels);
}

let mandiFetchDebounce = null;
async function fetchMandiForFilter(crop, location) {
  if (mandiFetchDebounce) clearTimeout(mandiFetchDebounce);
  mandiFetchDebounce = setTimeout(async () => {
    try {
      const cacheKey = getMandiCacheKey(crop, location);
      const query = new URLSearchParams({ crop, location });
      const res = await fetch(`${BACKEND_URL}/api/market-price?${query}`);
      const data = await res.json();
      if (res.ok && data.available) {
        const cacheRecord = data.data_mode === "live" ? saveMandiCache(cacheKey, data) : { history: [] };
        const currentCrop = document.getElementById("filter-mandi-commodity").value;
        const currentMarket = document.getElementById("filter-mandi-market").value;
        if (
          (currentCrop === "All" || currentCrop.toLowerCase() === crop.toLowerCase()) &&
          (currentMarket === "All" || currentMarket.toLowerCase() === location.toLowerCase())
        ) {
          renderMandiPrices(data, null, cacheRecord.history);
        }
      }
    } catch (err) {
      console.log("Background mandi fetch failed for filters:", err);
    }
  }, 800);
}

async function loadMandiMarketData(crop = "Rice", lat = 14.4426, lon = 79.9865, location = "") {
  const cacheKey = getMandiCacheKey(crop, location);
  try {
    const query = new URLSearchParams({ crop, lat, lon, location });
    const res = await fetch(`${BACKEND_URL}/api/market-price?${query}`);
    const data = await res.json();
    if (!res.ok || !data.available) {
      const message = getSafeMandiMessage(data.message);
      renderCachedMandiOrUnavailable(cacheKey, message, crop);
      return;
    }
    const cacheRecord = data.data_mode === "live" ? saveMandiCache(cacheKey, data) : { history: [] };
    renderMandiPrices(data, null, cacheRecord.history);
  } catch (err) {
    console.log("Could not load mandi prices:", err);
    renderCachedMandiOrUnavailable(cacheKey, "Official mandi prices are temporarily unavailable. Please try again shortly.", crop);
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

function renderCachedMandiOrUnavailable(cacheKey, message, crop) {
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
  showMandiFallbackDemoData(crop);
}

function renderMandiPrices(data, cachedAt = null, history = []) {
  const warningBanner = document.getElementById("mandiWarningBanner");
  if (warningBanner) warningBanner.style.display = "none";

  activeMandiData = {
    ...data,
    isDemo: false,
    history: history
  };

  const freshness = cachedAt
    ? `Live update delayed. Showing last verified official data from ${new Date(cachedAt).toLocaleString()}.`
    : data.data_mode === "historical" ? "Live feed temporarily unavailable. Showing real historical market records." : "Live Government Data — latest official daily prices.";

  const body = document.getElementById("dash-prices-body");
  if (body) {
    body.innerHTML = "";
    const markets = Array.isArray(data.nearest_markets) ? data.nearest_markets : [];
    markets.forEach(m => {
      const tr = document.createElement("tr");
      const area = [m.district, m.state].filter(Boolean).join(", ");
      const price = Number(m.price ?? m.modal_price);
      tr.innerHTML = `<td>${translateMandiTerm(data.crop)}</td><td>₹${price.toLocaleString()} / ${currentLang === "te" ? "క్వింటాల్" : "Quintal"}</td><td>${data.data_mode === "historical" ? "Latest available" : "Official daily price"}</td><td>${translateMandiTerm(m.market)}${area ? ` (${area})` : ""}</td>`;
      body.appendChild(tr);
    });
  }

  const source = document.getElementById("marketDataSource");
  if (source) source.textContent = `${freshness} Source: ${data.source || "AGMARKNET official data"}`;

  setMandiStatus(data.data_mode === "historical" || Boolean(cachedAt) ? "historical" : "live");

  const retryButton = document.getElementById("retryMandiPricesBtn");
  if (retryButton) retryButton.style.display = data.data_mode === "historical" || Boolean(cachedAt) ? "inline-flex" : "none";

  const insightsBox = document.querySelector(".price-insights-card");
  if (insightsBox) {
    insightsBox.innerHTML = `<h3>${currentLang === "te" ? "మండి మార్కెట్ విశ్లేషణ" : "Mandi Market Insights"}</h3><div class="insight-row"><div class="icon"><i class="fa-solid fa-circle-check"></i></div><div class="info"><strong>${cachedAt ? "Last verified official prices" : "Official daily prices loaded"}</strong><span>${freshness}</span></div></div>`;
  }

  filterMandiData();
}

function showMandiFallbackDemoData(crop) {
  const warningBanner = document.getElementById("mandiWarningBanner");
  if (warningBanner) {
    warningBanner.style.display = "block";
    warningBanner.textContent = currentLang === "te"
      ? "అధికారిక మండి ధరలు తాత్కాలికంగా అందుబాటులో లేవు. దిగువ విలువలు డెమో సమాచారం మరియు ప్రత్యక్ష ధరలు కావు."
      : "Live official mandi prices are temporarily unavailable. The values below are demonstration data and are not live prices.";
  }

  activeMandiData = {
    crop: crop,
    source: "Demo data",
    isDemo: true,
    nearest_markets: MOCK_MANDI_DATA.map(m => ({
      market: m.market,
      commodity: m.commodity,
      min_price: m.min_price,
      max_price: m.max_price,
      modal_price: m.modal_price,
      district: m.district,
      state: m.state,
      reported_date: "Demo",
      source: "Demo data"
    }))
  };

  const body = document.getElementById("dash-prices-body");
  if (body) {
    body.innerHTML = "";
    const relevantDemo = MOCK_MANDI_DATA.filter(m => m.commodity.toLowerCase() === crop.toLowerCase());
    if (relevantDemo.length === 0) {
      body.innerHTML = `<tr><td colspan="4" style="text-align:center;">${currentLang === "te" ? "మండి సమాచారం అందుబాటులో లేదు" : "No market records available."}</td></tr>`;
    } else {
      relevantDemo.forEach(m => {
        const tr = document.createElement("tr");
        const area = [m.district, m.state].filter(Boolean).join(", ");
        tr.innerHTML = `<td>${translateMandiTerm(m.commodity)}</td><td>₹${m.modal_price.toLocaleString()} / ${currentLang === "te" ? "క్వింటాల్" : "Quintal"}</td><td>Demo price</td><td>${translateMandiTerm(m.market)}${area ? ` (${area})` : ""}</td>`;
        body.appendChild(tr);
      });
    }
  }

  const source = document.getElementById("marketDataSource");
  if (source) {
    source.textContent = currentLang === "te"
      ? "లైవ్ ప్రభుత్వ సమాచారం అందుబాటులో లేదు. ప్రదర్శన డేటా చూపబడుతోంది."
      : "Live official mandi prices are temporarily unavailable. Showing demonstration market data.";
  }

  setMandiStatus("demo");

  const retryButton = document.getElementById("retryMandiPricesBtn");
  if (retryButton) retryButton.style.display = "inline-flex";

  const insightsBox = document.querySelector(".price-insights-card");
  if (insightsBox) {
    insightsBox.innerHTML = `
      <h3>${currentLang === "te" ? "మండి మార్కెట్ విశ్లేషణ" : "Mandi Market Insights"}</h3>
      <div class="insight-row">
        <div class="icon"><i class="fa-solid fa-circle-info" style="color:#eab308;"></i></div>
        <div class="info">
          <strong>${currentLang === "te" ? "ప్రదర్శన మార్కెట్ డేటా చూపబడుతోంది" : "Showing Demonstration Market Data"}</strong>
          <span>${currentLang === "te" ? "అధికారిక ప్రభుత్వ మండి సర్వర్ కనెక్టివిటీ సమస్యలను ఎదుర్కొంటోంది." : "The official government mandi server is experiencing connectivity issues."}</span>
        </div>
      </div>
    `;
  }

  filterMandiData();
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
  } else if (status === "demo") {
    badge.textContent = currentLang === "te" ? "🟡 ప్రదర్శన డేటా (Demo)" : "🟡 Demo Market Data";
    badge.style.background = "rgba(100, 116, 139, 0.1)";
    badge.style.color = "#64748b";
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
  if (!body) return;

  const profile = registeredFarmer || {
    location: detectedLocationName || "Andhra Pradesh",
    land_size_acres: acres,
    soil_type: "Loamy",
    soil_ph: 6.5,
    water_availability: "Medium",
    irrigation_method: "borewell"
  };

  // Temporarily override land size in profile to match user input
  profile.land_size_acres = acres;

  const weather = latestWeatherState || {
    temp: 28,
    humidity: 75,
    rainfall: 850,
    status: "reference"
  };

  const activeSeason = document.getElementById("calc-season")?.value || "kharif";
  const activeSeasonNorm = activeSeason.charAt(0).toUpperCase() + activeSeason.slice(1).toLowerCase();

  // Evaluate all crops in the knowledge base
  const evaluationList = [];
  Object.keys(CROP_KNOWLEDGE_BASE).forEach(cropName => {
    let price = getMandiPriceForCrop(cropName);
    const evaluation = CropEngine.evaluateCrop(cropName, profile, weather, price, acres);
    if (evaluation) {
      evaluationList.push(evaluation);
    }
  });

  // Sort by suitability descending
  evaluationList.sort((a, b) => b.suitability - a.suitability);

  if (evaluationList.length === 0) return;

  const isTe = currentLang === "te";
  const winnerCrop = evaluationList[0];

  body.innerHTML = "";
  evaluationList.forEach((e, idx) => {
    const tr = document.createElement("tr");
    
    // Highlight the best crop
    if (idx === 0) {
      tr.className = "best-performer";
      tr.style.cssText = "background-color: var(--primary-glow); border-left: 4px solid var(--primary);";
    }

    const cropNameTranslated = isTe ? translateMandiTerm(e.crop) : e.crop;
    const winnerSuffix = isTe ? " 🏆 (ఉత్తమ ఎంపిక)" : " 🏆 (Best choice)";
    const cropLabel = `${e.icon} ${cropNameTranslated}${idx === 0 ? winnerSuffix : ""}`;
    
    const costText = `₹${e.financials.totalCost.toLocaleString()}`;
    const yieldText = `${e.yieldRange.expectedYieldMin}–${e.yieldRange.expectedYieldMax} ${isTe ? "క్వింటాళ్ళు" : "Quintals"}`;
    const revenueText = `₹${e.financials.revenueMin.toLocaleString()}–₹${e.financials.revenueMax.toLocaleString()}`;
    const profitText = `₹${e.financials.profitMin.toLocaleString()}–₹${e.financials.profitMax.toLocaleString()}`;
    const rangeText = `₹${e.financials.profitRangeMin.toLocaleString()} – ₹${e.financials.profitRangeMax.toLocaleString()}`;
    const marginText = `${e.financials.profitMarginMin}%–${e.financials.profitMarginMax}%`;

    tr.innerHTML = `
      <td><strong>${cropLabel}</strong></td>
      <td>${costText}</td>
      <td>${yieldText}</td>
      <td>${revenueText}</td>
      <td class="net-profit-val" style="font-weight:600;">${profitText}</td>
      <td style="font-weight:600; color: var(--primary);">${rangeText}</td>
      <td>${marginText}</td>
    `;
    body.appendChild(tr);
  });

  // Populate "How was this estimate calculated?" details dynamically for the best crop choice
  const breakdownLand = document.getElementById("breakdown-land");
  const breakdownSeason = document.getElementById("breakdown-season");
  const breakdownCrop = document.getElementById("breakdown-crop");
  const breakdownYield = document.getElementById("breakdown-yield");
  const breakdownPrice = document.getElementById("breakdown-price");
  const breakdownCost = document.getElementById("breakdown-cost");
  const breakdownRevenue = document.getElementById("breakdown-revenue");
  const breakdownProfit = document.getElementById("breakdown-profit");
  const breakdownRange = document.getElementById("breakdown-range");
  const breakdownSource = document.getElementById("breakdown-source");

  if (breakdownLand) breakdownLand.textContent = `${acres} ${isTe ? "ఎకరాలు" : "acres"}`;
  if (breakdownSeason) breakdownSeason.textContent = activeSeasonNorm;
  if (breakdownCrop) breakdownCrop.textContent = isTe ? translateMandiTerm(winnerCrop.crop) : winnerCrop.crop;
  if (breakdownYield) breakdownYield.textContent = `${winnerCrop.yieldRange.yieldPerAcreMin}–${winnerCrop.yieldRange.yieldPerAcreMax} Qtl/acre`;
  if (breakdownPrice) breakdownPrice.textContent = `₹${winnerCrop.mandiPrice.toLocaleString()} / Qtl`;
  if (breakdownCost) breakdownCost.textContent = `₹${winnerCrop.financials.costPerAcre.toLocaleString()} / acre (Total: ₹${winnerCrop.financials.totalCost.toLocaleString()})`;
  if (breakdownRevenue) breakdownRevenue.textContent = `₹${winnerCrop.financials.revenueMin.toLocaleString()} – ₹${winnerCrop.financials.revenueMax.toLocaleString()}`;
  if (breakdownProfit) breakdownProfit.textContent = `₹${winnerCrop.financials.profitMin.toLocaleString()} – ₹${winnerCrop.financials.profitMax.toLocaleString()}`;
  if (breakdownRange) breakdownRange.textContent = `₹${winnerCrop.financials.profitRangeMin.toLocaleString()} – ₹${winnerCrop.financials.profitRangeMax.toLocaleString()}`;
  
  if (breakdownSource) {
    if (activeMandiData && !activeMandiData.isDemo) {
      breakdownSource.textContent = "AGMARKNET / Gov India Daily Mandi Prices";
    } else {
      breakdownSource.textContent = "Reference Agricultural Data (Historical/Demo)";
    }
  }
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

function getFarmAnalyticsRecord(crop, season, year, location) {
  const rand = getSeededRandom(`${crop}_${season}_${year}_${location}`);
  const area = registeredFarmer && registeredFarmer.crop_type === crop ? parseFloat(registeredFarmer.land_size_acres || 5) : 5.0;
  
  // Try to use profile irrigation if active and crop matches
  let irrigation = null;
  if (registeredFarmer && registeredFarmer.crop_type === crop && registeredFarmer.irrigation_method) {
    irrigation = registeredFarmer.irrigation_method;
  }

  // Base yields, prices, and costs per acre
  let baseYield = 20; 
  let defaultPrice = 2200; 
  let seedCostBase = 3000;
  let fertilizerCostBase = 5000;
  let pesticideCostBase = 4000;
  let labourCostBase = 8000;
  let irrigationCostBase = 3000;
  let otherCostBase = 2000;

  const cLower = crop.toLowerCase();
  if (cLower.includes("rice") || cLower.includes("paddy")) {
    baseYield = 22; 
    defaultPrice = 2300;
    seedCostBase = 2500;
    fertilizerCostBase = 5000;
    pesticideCostBase = 4500;
    labourCostBase = 9000;
    irrigationCostBase = 3500;
    otherCostBase = 1500;
  } else if (cLower.includes("wheat")) {
    baseYield = 18; 
    defaultPrice = 2400;
    seedCostBase = 3000;
    fertilizerCostBase = 4500;
    pesticideCostBase = 3500;
    labourCostBase = 8000;
    irrigationCostBase = 3000;
    otherCostBase = 1500;
  } else if (cLower.includes("maize") || cLower.includes("corn")) {
    baseYield = 25; 
    defaultPrice = 2100;
    seedCostBase = 2800;
    fertilizerCostBase = 6000;
    pesticideCostBase = 4000;
    labourCostBase = 7500;
    irrigationCostBase = 2500;
    otherCostBase = 1200;
  } else if (cLower.includes("groundnut")) {
    baseYield = 11; 
    defaultPrice = 6500;
    seedCostBase = 5000;
    fertilizerCostBase = 4000;
    pesticideCostBase = 3500;
    labourCostBase = 8500;
    irrigationCostBase = 2500;
    otherCostBase = 1500;
  } else if (cLower.includes("cotton")) {
    baseYield = 9; 
    defaultPrice = 7000;
    seedCostBase = 4000;
    fertilizerCostBase = 7000;
    pesticideCostBase = 6000;
    labourCostBase = 9500;
    irrigationCostBase = 2000;
    otherCostBase = 2000;
  } else if (cLower.includes("chickpea")) {
    baseYield = 8; 
    defaultPrice = 5300;
    seedCostBase = 3500;
    fertilizerCostBase = 3000;
    pesticideCostBase = 2500;
    labourCostBase = 7000;
    irrigationCostBase = 1500;
    otherCostBase = 1000;
  } else if (cLower.includes("mustard")) {
    baseYield = 6; 
    defaultPrice = 5450;
    seedCostBase = 1500;
    fertilizerCostBase = 3500;
    pesticideCostBase = 2000;
    labourCostBase = 6500;
    irrigationCostBase = 1500;
    otherCostBase = 1000;
  } else if (cLower.includes("potato")) {
    baseYield = 100; 
    defaultPrice = 1200;
    seedCostBase = 15000;
    fertilizerCostBase = 8000;
    pesticideCostBase = 5000;
    labourCostBase = 12000;
    irrigationCostBase = 4000;
    otherCostBase = 3000;
  } else if (cLower.includes("tomato")) {
    baseYield = 150; 
    defaultPrice = 1000;
    seedCostBase = 8000;
    fertilizerCostBase = 12000;
    pesticideCostBase = 9500;
    labourCostBase = 14000;
    irrigationCostBase = 4500;
    otherCostBase = 4000;
  } else if (cLower.includes("chilli")) {
    baseYield = 18; 
    defaultPrice = 15000;
    seedCostBase = 12000;
    fertilizerCostBase = 10000;
    pesticideCostBase = 14000;
    labourCostBase = 18000;
    irrigationCostBase = 6000;
    otherCostBase = 5000;
  }

  // Location parameters
  let locationYieldMult = 1.0;
  let locationCostMult = 1.0;
  let locationPriceMult = 1.0;
  let normalRainfall = 950;
  
  const locLower = location.toLowerCase();
  if (locLower.includes("visakhapatnam")) {
    normalRainfall = season === "Kharif" ? 1200 : 450;
    locationYieldMult = 1.05;
    locationPriceMult = 0.98;
  } else if (locLower.includes("nellore")) {
    normalRainfall = season === "Kharif" ? 1050 : 380;
    locationYieldMult = 1.12;
    locationPriceMult = 1.05;
  } else if (locLower.includes("guntur")) {
    normalRainfall = season === "Kharif" ? 900 : 250;
    locationYieldMult = 1.08;
    locationCostMult = 1.05;
  } else if (locLower.includes("vijayawada")) {
    normalRainfall = season === "Kharif" ? 950 : 280;
    locationYieldMult = 1.02;
    locationPriceMult = 1.02;
  } else if (locLower.includes("kavali")) {
    normalRainfall = season === "Kharif" ? 850 : 220;
    locationYieldMult = 0.90;
    locationCostMult = 0.95;
  }

  // Variations based on year and season
  const yearMult = year === 2026 ? 1.15 : year === 2025 ? 1.08 : 0.95;
  const seasonMult = season === "Kharif" ? 1.0 : 0.8;
  
  const livePrice = getMandiPriceForCrop(crop);
  const finalPrice = Math.round((livePrice || defaultPrice) * locationPriceMult);

  let irrigationMult = 1.0;
  if (irrigation) {
    const irrLower = irrigation.toLowerCase();
    if (irrLower.includes("drip")) {
      irrigationMult = 0.85; 
    } else if (irrLower.includes("sprinkler")) {
      irrigationMult = 0.92;
    }
  }

  const yieldPerAcre = parseFloat((baseYield * locationYieldMult * yearMult * seasonMult * (0.96 + rand() * 0.08)).toFixed(1));
  
  const seedCost = Math.round(seedCostBase * locationCostMult * yearMult * seasonMult);
  const fertilizerCost = Math.round(fertilizerCostBase * locationCostMult * yearMult * seasonMult);
  const pesticideCost = Math.round(pesticideCostBase * locationCostMult * yearMult * seasonMult);
  const labourCost = Math.round(labourCostBase * locationCostMult * yearMult * seasonMult);
  const irrigationCost = irrigation ? Math.round(irrigationCostBase * locationCostMult * yearMult * seasonMult * irrigationMult) : 0;
  const otherCost = Math.round(otherCostBase * locationCostMult * yearMult * seasonMult);
  
  const totalCostPerAcre = seedCost + fertilizerCost + pesticideCost + labourCost + irrigationCost + otherCost;
  
  const revenue = calculateRevenue(yieldPerAcre, area, finalPrice);
  const totalCost = Math.round(totalCostPerAcre * area);
  const netProfit = calculateNetProfit(revenue, totalCost);
  
  const rainObj = getMonthlyRainfallData(crop, season, year, location);
  const rainfall = rainObj.actualRain.reduce((a, b) => a + b, 0);
  const normalRainfallVal = rainObj.normalRain.reduce((a, b) => a + b, 0);
  const waterUsageVal = irrigation ? calculateWaterUsage(irrigation) : null;
  
  return {
    crop,
    season,
    year,
    location,
    areaAcres: area,
    yieldQuintalsPerAcre: yieldPerAcre,
    marketPricePerQuintal: finalPrice,
    seedCost,
    fertilizerCost,
    pesticideCost,
    labourCost,
    irrigationCost,
    otherCost,
    revenue,
    totalCost,
    netProfit,
    actualRainfallMm: rainfall,
    normalRainfallMm: normalRainfallVal,
    irrigationType: irrigation || undefined,
    waterUsage: waterUsageVal ? waterUsageVal * area : null,
    isLivePrice: Boolean(livePrice)
  };
}

function getPreviousSeason(crop, season, year) {
  const validSeasons = getCompatibleSeasons(crop);
  if (validSeasons.length === 1) {
    // Single season crop, compare with the previous year's same season
    return { season: season, year: year - 1 };
  } else {
    // Multi season crop, sequential comparison
    if (season === "Rabi") {
      return { season: "Kharif", year: year };
    } else {
      return { season: "Rabi", year: year - 1 };
    }
  }
}

function getMonthlyRainfallData(crop, season, year, location) {
  const rand = getSeededRandom(`${crop}_${season}_${year}_${location}_rain`);
  let baseRainVal = season === "Kharif" ? [110, 190, 240, 150, 80, 20] : [15, 10, 20, 15, 30, 45];
  
  // Scale base rainfall based on the location's total seasonal normal rainfall
  const locLower = location.toLowerCase();
  let scale = 1.0;
  if (locLower.includes("visakhapatnam")) {
    scale = season === "Kharif" ? 1.2 : 1.3;
  } else if (locLower.includes("nellore")) {
    scale = season === "Kharif" ? 1.05 : 1.1;
  } else if (locLower.includes("guntur")) {
    scale = season === "Kharif" ? 0.9 : 0.7;
  } else if (locLower.includes("vijayawada")) {
    scale = season === "Kharif" ? 0.95 : 0.8;
  } else if (locLower.includes("kavali")) {
    scale = season === "Kharif" ? 0.85 : 0.6;
  }
  
  const normalRain = [];
  const actualRain = [];
  
  for (let i = 0; i < 6; i++) {
    const factor = (0.85 + rand() * 0.3) * scale;
    normalRain.push(Math.round(baseRainVal[i] * factor));
    const rainYearMult = year === 2026 ? 1.02 : year === 2025 ? 0.88 : 1.06;
    actualRain.push(Math.round(baseRainVal[i] * factor * rainYearMult * (0.9 + rand() * 0.2)));
  }
  return { normalRain, actualRain };
}

let analyticsFiltersInitialized = false;

const CROP_SEASON_COMPATIBILITY = {
  "rice": ["Kharif", "Rabi"],
  "maize": ["Kharif", "Rabi"],
  "groundnut": ["Kharif", "Rabi"],
  "cotton": ["Kharif"],
  "tomato": ["Kharif", "Rabi"],
  "wheat": ["Rabi"],
  "chickpea": ["Rabi"],
  "mustard": ["Rabi"],
  "potato": ["Rabi"],
  "chilli": ["Kharif", "Rabi"]
};

function getCompatibleSeasons(crop) {
  const norm = String(crop || "").toLowerCase();
  for (const [key, seasons] of Object.entries(CROP_SEASON_COMPATIBILITY)) {
    if (norm.includes(key)) {
      return seasons;
    }
  }
  return ["Kharif", "Rabi"]; // default fallback
}

function updateSeasonFilterForCrop(cropVal, seasonSelect) {
  const validSeasons = getCompatibleSeasons(cropVal);
  const currentSelection = seasonSelect.value;
  
  seasonSelect.innerHTML = "";
  validSeasons.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = currentLang === "te"
      ? (s === "Kharif" ? "ఖరీఫ్ (Kharif)" : "రబీ (Rabi)")
      : s;
    seasonSelect.appendChild(opt);
  });
  
  if (currentSelection && validSeasons.includes(currentSelection)) {
    seasonSelect.value = currentSelection;
  } else if (validSeasons.length > 0) {
    seasonSelect.value = validSeasons[0];
  }
}

function initAnalyticsFilters() {
  const yearSelect = document.getElementById("filter-year");
  const seasonSelect = document.getElementById("filter-season");
  const cropSelect = document.getElementById("filter-crop");
  const locationSelect = document.getElementById("filter-location");

  if (!yearSelect || !seasonSelect || !cropSelect || !locationSelect) return;

  // Preserve selections
  const currentYear = yearSelect.value;
  const currentSeason = seasonSelect.value;
  const currentCrop = cropSelect.value;
  const currentLocation = locationSelect.value;

  yearSelect.innerHTML = "";
  seasonSelect.innerHTML = "";
  cropSelect.innerHTML = "";
  locationSelect.innerHTML = "";

  // 1. Years
  const years = [2026, 2025, 2024];
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });
  if (currentYear && Array.from(yearSelect.options).some(o => o.value === currentYear)) {
    yearSelect.value = currentYear;
  } else {
    yearSelect.value = "2026";
  }

  // 2. Crops (10 standard crops)
  const crops = [
    { value: "Rice", label: currentLang === "te" ? "వరి (Rice)" : "Rice" },
    { value: "Wheat", label: currentLang === "te" ? "గోధుమ (Wheat)" : "Wheat" },
    { value: "Maize", label: currentLang === "te" ? "మొక్కజొన్న (Maize)" : "Maize" },
    { value: "Groundnut", label: currentLang === "te" ? "వేరుశనగ (Groundnut)" : "Groundnut" },
    { value: "Cotton", label: currentLang === "te" ? "పత్తి (Cotton)" : "Cotton" },
    { value: "Chickpea", label: currentLang === "te" ? "శనగలు (Chickpea)" : "Chickpea" },
    { value: "Mustard", label: currentLang === "te" ? "ఆవాలు (Mustard)" : "Mustard" },
    { value: "Potato", label: currentLang === "te" ? "బంగాళాదుంప (Potato)" : "Potato" },
    { value: "Tomato", label: currentLang === "te" ? "టమోటా (Tomato)" : "Tomato" },
    { value: "Chilli", label: currentLang === "te" ? "మిరపకాయ (Chilli)" : "Chilli" }
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

  if (currentCrop && Array.from(cropSelect.options).some(o => o.value === currentCrop)) {
    cropSelect.value = currentCrop;
  } else if (farmerCrop) {
    const found = Array.from(cropSelect.options).find(opt => opt.value.toLowerCase() === farmerCrop.toLowerCase());
    if (found) cropSelect.value = found.value;
  }

  // 3. Seasons (rebuild dynamically based on current crop selection)
  updateSeasonFilterForCrop(cropSelect.value, seasonSelect);
  if (currentSeason && getCompatibleSeasons(cropSelect.value).includes(currentSeason)) {
    seasonSelect.value = currentSeason;
  }

  // 4. Locations (Autodetected + Profile + Fallbacks)
  const locations = ["Visakhapatnam", "Nellore", "Guntur", "Vijayawada", "Kavali"];
  const farmerLoc = registeredFarmer ? registeredFarmer.location : null;
  
  function getShortLocName(locStr) {
    if (!locStr) return null;
    return locStr.split(",")[0].trim();
  }

  const shortFarmerLoc = getShortLocName(farmerLoc);
  const shortDetectedLoc = getShortLocName(detectedLocationName);

  if (shortFarmerLoc && !locations.some(l => l.toLowerCase() === shortFarmerLoc.toLowerCase())) {
    locations.unshift(shortFarmerLoc);
  }
  if (shortDetectedLoc && !locations.some(l => l.toLowerCase() === shortDetectedLoc.toLowerCase())) {
    locations.unshift(shortDetectedLoc);
  }

  locations.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    locationSelect.appendChild(opt);
  });

  if (currentLocation && Array.from(locationSelect.options).some(o => o.value === currentLocation)) {
    locationSelect.value = currentLocation;
  } else if (shortFarmerLoc) {
    const found = Array.from(locationSelect.options).find(opt => opt.value.toLowerCase() === shortFarmerLoc.toLowerCase());
    if (found) locationSelect.value = found.value;
  } else if (shortDetectedLoc) {
    const found = Array.from(locationSelect.options).find(opt => opt.value.toLowerCase() === shortDetectedLoc.toLowerCase());
    if (found) locationSelect.value = found.value;
  }

  if (!analyticsFiltersInitialized) {
    cropSelect.addEventListener("change", () => {
      updateSeasonFilterForCrop(cropSelect.value, seasonSelect);
      renderDynamicDashboard();
    });
    
    [yearSelect, seasonSelect, locationSelect].forEach(selectEl => {
      selectEl.addEventListener("change", () => {
        renderDynamicDashboard();
      });
    });
    
    analyticsFiltersInitialized = true;
  }
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
  const prevSeasonObj = getPreviousSeason(crop, season, year);
  
  let prev = null;
  if (prevSeasonObj.year >= 2024) {
    prev = getFarmAnalyticsRecord(crop, prevSeasonObj.season, prevSeasonObj.year, location);
  }

  // Update Farm Area Badge
  const areaBadge = document.getElementById("analytics-farm-area");
  if (areaBadge) {
    areaBadge.textContent = currentLang === "te" 
      ? `వ్యవసాయ క్షేత్రం: ${current.areaAcres.toFixed(1)} ఎకరాలు`
      : `Farm Area: ${current.areaAcres.toFixed(1)} acres`;
  }

  // Update Data Source Badge
  const badge = document.getElementById("data-source-badge");
  if (badge) {
    if (current.isLivePrice) {
      badge.textContent = currentLang === "te" ? "ప్రత్యక్ష మండి డేటా" : "Live Mandi Data";
      badge.style.background = "#dcfce7";
      badge.style.color = "#166534";
      badge.title = "";
      badge.style.cursor = "default";
      badge.style.borderBottom = "none";
    } else {
      badge.textContent = currentLang === "te" ? "నమూనా చారిత్రక డేటా ℹ" : "Demo historical data ℹ";
      badge.style.background = "rgba(100, 116, 139, 0.1)";
      badge.style.color = "#64748b";
      badge.title = "These values are from a demonstration historical dataset and are not live farm records.";
      badge.style.cursor = "help";
      badge.style.borderBottom = "1px dashed #64748b";
    }
  }

  // 1. Net Profit Card
  const profitValEl = document.getElementById("stat-net-profit");
  if (profitValEl) {
    const totalProfitText = currentLang === "te" 
      ? `మొత్తం: ₹${(current.netProfit / 100000).toFixed(2)} లక్షలు`
      : `Total: ₹${(current.netProfit / 100000).toFixed(2)} L`;
    profitValEl.textContent = totalProfitText;
  }
  const profitPerAcreEl = document.getElementById("stat-net-profit-per-acre");
  if (profitPerAcreEl) {
    const profitPerAcre = Math.round(current.netProfit / current.areaAcres);
    profitPerAcreEl.textContent = currentLang === "te"
      ? `లాభం: ₹${profitPerAcre.toLocaleString("en-IN")} / ఎకరం`
      : `Profit: ₹${profitPerAcre.toLocaleString("en-IN")} / acre`;
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
    yieldValEl.textContent = `${current.yieldQuintalsPerAcre} ${currentLang === "te" ? "క్వింటాళ్ళు/ఎకరం" : "quintals/acre"}`;
  }
  const yieldChangeEl = document.getElementById("stat-yield-change");
  if (yieldChangeEl) {
    if (prev) {
      const yieldChange = ((current.yieldQuintalsPerAcre - prev.yieldQuintalsPerAcre) / prev.yieldQuintalsPerAcre) * 100;
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
    rainValEl.textContent = `${current.actualRainfallMm.toLocaleString("en-IN")} mm`;
  }
  const rainCompareEl = document.getElementById("stat-rainfall-compare");
  if (rainCompareEl) {
    const diffPercent = Math.round(((current.actualRainfallMm - current.normalRainfallMm) / current.normalRainfallMm) * 100);
    if (diffPercent >= 0) {
      rainCompareEl.textContent = `${diffPercent}% ${currentLang === "te" ? "సగటు కంటే ఎక్కువ" : "above average"}`;
      rainCompareEl.style.color = "#10b981";
    } else {
      rainCompareEl.textContent = `${Math.abs(diffPercent)}% ${currentLang === "te" ? "సగటు కంటే తక్కువ" : "below average"}`;
      rainCompareEl.style.color = Math.abs(diffPercent) > 7 ? "#ef4444" : "#eab308";
    }
  }

  // 4. Water Efficiency Card
  const waterEfficiencyValEl = document.getElementById("stat-water-efficiency");
  const waterSavingsEl = document.getElementById("stat-water-savings");
  if (current.waterUsage) {
    if (waterEfficiencyValEl) {
      waterEfficiencyValEl.textContent = `${currentLang === "te" ? "నీటి వినియోగం" : "Water Used"}: ${(current.waterUsage / current.areaAcres).toLocaleString("en-IN")} L/acre`;
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

  const validSeasons = getCompatibleSeasons(crop);
  const seasonsList = [];
  const seasonLabels = [];
  const yearsList = [2024, 2025, 2026];
  yearsList.forEach(y => {
    validSeasons.forEach(s => {
      seasonsList.push({ season: s, year: y });
      if (s === "Kharif") {
        seasonLabels.push(currentLang === "te" ? `ఖరీఫ్ ${y}` : `Kharif ${y}`);
      } else {
        seasonLabels.push(currentLang === "te" ? `రబీ ${y}` : `Rabi ${y}`);
      }
    });
  });

  const chartRecords = seasonsList.map(s => getFarmAnalyticsRecord(crop, s.season, s.year, location));

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

  const yields = chartRecords.map(r => r.yieldQuintalsPerAcre);
  const yieldChanges = chartRecords.map((r, i) => {
    if (i === 0) return 0;
    const prevVal = chartRecords[i - 1].yieldQuintalsPerAcre;
    return ((r.yieldQuintalsPerAcre - prevVal) / prevVal) * 100;
  });

  yieldTrendChartInstance = new Chart(ctxYield, {
    type: 'bar',
    data: {
      labels: seasonLabels,
      datasets: [{
        label: currentLang === "te" ? 'दिगुबडी (क्विंटाళ్ళు/ఎకరం)' : 'Yield (quintals/acre)',
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
    
    // Insights lists
    const bullets = [];

    // Profit changes & factors calculations
    let biggestPositive = null;
    let yieldEffect = 0;
    let priceEffect = 0;
    let costDiff = 0;
    
    if (prev) {
      const netDiff = current.netProfit - prev.netProfit;
      yieldEffect = Math.round((current.yieldQuintalsPerAcre - prev.yieldQuintalsPerAcre) * current.areaAcres * current.marketPricePerQuintal);
      priceEffect = Math.round((current.marketPricePerQuintal - prev.marketPricePerQuintal) * prev.yieldQuintalsPerAcre * current.areaAcres);
      costDiff = current.totalCost - prev.totalCost;
      
      const contributors = [
        { name: "yield", val: yieldEffect },
        { name: "price", val: priceEffect }
      ];
      const positiveContribs = contributors.filter(c => c.val > 0).sort((a, b) => b.val - a.val);
      biggestPositive = positiveContribs.length > 0 ? positiveContribs[0].name : null;

      let profitInsightText = "";
      const pDiff = ((current.netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 100;
      if (netDiff >= 0) {
        if (biggestPositive === "yield") {
          profitInsightText = costDiff > 0
            ? (currentLang === "te" ? `💰 నికర లాభం పెరిగింది ప్రధానంగా మెరుగైన దిగుబడి వల్ల, పెరిగిన ఖర్చులు ఉన్నప్పటికీ.` : `💰 Net profit increased mainly due to higher yield, while higher input and labour costs reduced the improvement.`)
            : (currentLang === "te" ? `💰 నికర లాభం పెరిగింది ప్రధానంగా మెరుగైన దిగుబడి మరియు తక్కువ ఖర్చుల వల్ల.` : `💰 Net profit increased mainly due to higher yield and optimized expenses.`);
        } else if (biggestPositive === "price") {
          profitInsightText = currentLang === "te"
            ? `💰 నికర లాభం పెరిగింది ప్రధానంగా మండి ధరలు పెరగడం వల్ల.`
            : `💰 Net profit increased mainly due to higher mandi prices.`;
        } else {
          profitInsightText = currentLang === "te"
            ? `💰 నికర లాభం పెరిగింది స్థిరమైన సీజన్ అనుకూలత కారణంగా.`
            : `💰 Net profit increased by ${pDiff.toFixed(0)}% due to seasonal optimization.`;
        }
      } else {
        profitInsightText = currentLang === "te"
          ? `💰 పెరిగిన ఉత్పత్తి ఖర్చులు లేదా తగ్గిన దిగుబడి కారణంగా నికర లాభం ${Math.abs(pDiff).toFixed(0)}% తగ్గింది.`
          : `💰 Net profit decreased by ${Math.abs(pDiff).toFixed(0)}%, mainly due to lower yields or increased cultivation expenses.`;
      }
      bullets.push(profitInsightText);
    } else {
      bullets.push(currentLang === "te" 
        ? `💰 ఈ కాలంలో ఆశించిన నికర లాభం సుమారు ₹${(current.netProfit / 100000).toFixed(2)} లక్షలు.`
        : `💰 Estimated net profit for this period is ₹${(current.netProfit / 100000).toFixed(2)} L.`);
    }

    // Yield compare
    let yieldInsightText = "";
    if (prev) {
      const yDiff = ((current.yieldQuintalsPerAcre - prev.yieldQuintalsPerAcre) / prev.yieldQuintalsPerAcre) * 100;
      yieldInsightText = yDiff >= 0
        ? (currentLang === "te" ? `📈 గత కాలంతో పోలిస్తే దిగుబడి ${yDiff.toFixed(0)}% పెరిగింది.` : `📈 Yield increased by ${yDiff.toFixed(0)}% compared with the previous season.`)
        : (currentLang === "te" ? `📉 గత కాలంతో పోలిస్తే దిగుబడి ${Math.abs(yDiff).toFixed(0)}% తగ్గింది.` : `📉 Yield decreased by ${Math.abs(yDiff).toFixed(0)}% compared with the previous season.`);
    } else {
      yieldInsightText = currentLang === "te" 
        ? `🌾 ప్రస్తుత అంచనా వేసిన దిగుబడి: ఎకరానికి ${current.yieldQuintalsPerAcre} క్వింటాళ్ళు.`
        : `🌾 Current estimated yield is ${current.yieldQuintalsPerAcre} quintals per acre.`;
    }
    bullets.push(yieldInsightText);

    // Rainfall warning/info
    const rainDiffPercent = Math.round(((current.actualRainfallMm - current.normalRainfallMm) / current.normalRainfallMm) * 100);
    if (rainDiffPercent <= -8) {
      bullets.push(currentLang === "te"
        ? `⚠ వర్షపాతం కాలానుగుణ సగటు కంటే ${Math.abs(rainDiffPercent)}% తక్కువగా ఉంది.`
        : `⚠ Rainfall is ${Math.abs(rainDiffPercent)}% below the seasonal average.`);
    } else if (rainDiffPercent >= 8) {
      bullets.push(currentLang === "te"
        ? `🌧 వర్షపాతం కాలానుగుణ సగటు కంటే ${rainDiffPercent}% ఎక్కువగా ఉంది.`
        : `🌧 Rainfall is ${rainDiffPercent}% above the seasonal average.`);
    }

    // Irrigation insight (do NOT fabricate current irrigation method if unavailable)
    if (current.irrigationType) {
      const irr = current.irrigationType.toLowerCase();
      if (irr.includes("drip")) {
        bullets.push(currentLang === "te"
          ? `💧 డ్రిప్ నీటి పారుదల అందుబాటులో ఉంది, ఇది ఎకరానికి సుమారు 35% నీటిని ఆదా చేస్తోంది.`
          : `💧 Drip irrigation is active, saving approximately 35% water per acre compared to regional flood methods.`);
      } else {
        bullets.push(currentLang === "te"
          ? `💧 వరద పద్ధతి నుండి డ్రిప్ నీటి పారుదలకు మారడం ద్వారా నీటి వినియోగాన్ని 40% వరకు తగ్గించవచ్చు.`
          : `💧 Switching from flood irrigation to drip could potentially reduce water usage by 40% and increase profit by 25%.`);
      }
    } else {
      bullets.push(currentLang === "te"
        ? `💧 డ్రిప్ నీటి పారుదల వరద పారుదలతో పోలిస్తే నీటి వాడకాన్ని తగ్గించగలదు.`
        : `💧 Drip irrigation can reduce water use compared with flood irrigation, depending on crop and field conditions.`);
    }

    // Crop Doctor disease history
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
          ? `🐛 పంట వైద్యుడు ఈ సీజన్‌లో ${cropIncidents.length} తెగులు సంఘటనలను రికార్డ్ చేసారు. సాధారణంగా కనుగొన్నది: ${mostCommon}.`
          : `🌱 ${cropIncidents.length} disease incident(s) were recorded this season, with ${mostCommon} being the most common.`;
      } else {
        diseaseInsight = currentLang === "te"
          ? `🌱 ఈ కాలంలో తెగుళ్ల రికార్డు అందుబాటులో లేదు.`
          : `🌱 No crop disease history is available for this period.`;
      }
    } catch (e) {
      diseaseInsight = currentLang === "te" 
        ? `🌱 ఈ కాలంలో తెగుళ్ల రికార్డు అందుబాటులో లేదు.`
        : `🌱 No crop disease history is available for this period.`;
    }
    bullets.push(diseaseInsight);

    // Render bullets list
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
      
      const yieldEffect = Math.round((current.yieldQuintalsPerAcre - prev.yieldQuintalsPerAcre) * current.areaAcres * current.marketPricePerQuintal);
      const priceEffect = Math.round((current.marketPricePerQuintal - prev.marketPricePerQuintal) * prev.yieldQuintalsPerAcre * current.areaAcres);
      const irrLabourEffect = Math.round(-( (current.irrigationCost + current.labourCost) - (prev.irrigationCost + prev.labourCost) ) * current.areaAcres);
      
      // Fertilizer & inputs gets the exact mathematical remainder to ensure final sum reconciles with profit change exactly!
      const fertInputsEffect = netDiff - (yieldEffect + priceEffect + irrLabourEffect); 

      const factors = [
        { label: currentLang === "te" ? "దిగుబడి మార్పు" : "Yield improvement", value: yieldEffect },
        { label: currentLang === "te" ? "మండి ధర వ్యత్యాసం" : "Market price change", value: priceEffect },
        { label: currentLang === "te" ? "ఎరువులు/విత్తనాల వ్యయం" : "Fertilizer & inputs cost", value: fertInputsEffect },
        { label: currentLang === "te" ? "నీరు/కార్మికుల వ్యయం" : "Irrigation & labour cost", value: irrLabourEffect }
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
      detectAnalyticsLocation();
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

async function detectAnalyticsLocation() {
  if (analyticsLocationDetected) return;

  const displayEl = document.getElementById("analytics-location-display");
  if (!displayEl) return;

  const isTe = currentLang === "te";
  displayEl.textContent = isTe ? "📍 స్థానం: స్థానాన్ని గుర్తిస్తోంది..." : "📍 Location: Detecting location...";
  displayEl.style.color = "#3b82f6";
  displayEl.style.background = "rgba(59, 130, 246, 0.1)";

  if (!navigator.geolocation) {
    const fallbackText = isTe ? "📍 స్థానం: మద్దతు లేదు (నెల్లూరు, ఆంధ్రప్రదేశ్)" : "📍 Location: Geolocation Not Supported (Fallback: Nellore, Andhra Pradesh)";
    displayEl.textContent = fallbackText;
    displayEl.style.color = "#ef4444";
    displayEl.style.background = "rgba(239, 68, 68, 0.1)";
    applyAnalyticsLocationFallback();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      analyticsLocationDetected = true;
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const geoResult = await reverseGeocode(lat, lon);
      
      let locName = "Nellore, Andhra Pradesh";
      if (geoResult) {
        const place = geoResult.village || geoResult.district || "Nellore";
        locName = `${place}, ${geoResult.state}`;
      }
      
      displayEl.textContent = `📍 ${isTe ? "స్థానం" : "Location"}: ${locName}`;
      displayEl.style.color = "#10b981";
      displayEl.style.background = "rgba(16, 185, 129, 0.1)";
      
      updateAnalyticsLocationValue(locName);
    },
    (error) => {
      console.log("Analytics location access denied/failed:", error);
      analyticsLocationDetected = true;
      let errorMsg = isTe ? "అనుమతి నిరాకరించబడింది" : "Permission Denied";
      if (error.code === error.TIMEOUT) errorMsg = isTe ? "సమయం ముగిసింది" : "Timeout";
      else if (error.code === error.POSITION_UNAVAILABLE) errorMsg = isTe ? "స్థానం అందుబాటులో లేదు" : "Position Unavailable";
      
      let fallbackLoc = "Nellore, Andhra Pradesh";
      if (registeredFarmer && registeredFarmer.location) {
        fallbackLoc = registeredFarmer.location;
      }
      
      displayEl.textContent = `📍 ${isTe ? "స్థానం" : "Location"}: ${fallbackLoc} (${errorMsg})`;
      displayEl.style.color = "#ef4444";
      displayEl.style.background = "rgba(239, 68, 68, 0.1)";
      
      updateAnalyticsLocationValue(fallbackLoc);
    },
    { timeout: 8000 }
  );
}

function updateAnalyticsLocationValue(locName) {
  let shortLoc = locName.split(",")[0].trim();
  const locationSelect = document.getElementById("filter-location");
  if (locationSelect) {
    let found = Array.from(locationSelect.options).find(opt => opt.value.toLowerCase() === shortLoc.toLowerCase());
    if (!found) {
      const opt = document.createElement("option");
      opt.value = shortLoc;
      opt.textContent = shortLoc;
      locationSelect.appendChild(opt);
      locationSelect.value = shortLoc;
    } else {
      locationSelect.value = found.value;
    }
    renderDynamicDashboard();
  }
}

function applyAnalyticsLocationFallback() {
  let fallbackLoc = "Nellore, Andhra Pradesh";
  if (registeredFarmer && registeredFarmer.location) {
    fallbackLoc = registeredFarmer.location;
  }
  updateAnalyticsLocationValue(fallbackLoc);
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
        detectedLocationName = geoResult.village || geoResult.district || geoResult.state;
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
      registeredFarmer = JSON.parse(savedProfile);
      document.getElementById("auth-portal-box").style.display = "none";
      document.getElementById("farmerRegistrationForm").style.display = "none";
      updateDashboardWithProfile(registeredFarmer);
      switchTab("dashboard");
    }
  } catch (e) {
    console.log("Auto-login error on reload:", e);
  }

  // Bind Extension Services search inputs
  const schemeSearchInput = document.getElementById("scheme-search-input");
  const centerSearchInput = document.getElementById("center-search-input");
  if (schemeSearchInput) {
    schemeSearchInput.addEventListener("input", () => renderExtensionServices());
  }
  if (centerSearchInput) {
    centerSearchInput.addEventListener("input", () => renderExtensionServices());
  }
  // Immediate load of dynamic extension services
  renderExtensionServices();
});

const EXTENSION_SCHEMES = [
  {
    id: "pm_kisan",
    title: {
      en: "PM Kisan Samman Nidhi",
      te: "పీఎం కిసాన్ సమ్మాన్ నిధి"
    },
    benefits: {
      en: "₹6,000 per year in 3 equal installments.",
      te: "ఏడాదికి ₹6,000 చొప్పున 3 విడతలలో లభిస్తుంది."
    },
    eligibility: {
      en: "Small and marginal farmers with land up to 2 hectares (5 acres).",
      te: "2 హెక్టార్ల (5 ఎకరాలు) లోపు సాగుభూమి ఉన్న చిన్న, సన్నకారు రైతులు."
    },
    documents: {
      en: "Aadhaar Card, Land Registry (Pattadar Passbook), Bank Account details.",
      te: "ఆధార్ కార్డు, పట్టాదార్ పాస్ పుస్తకం, బ్యాంక్ ఖాతా వివరాలు."
    },
    last_date: {
      en: "31st August 2026",
      te: "31 ఆగస్టు 2026"
    },
    status: "active",
    source: {
      en: "Ministry of Agriculture & Farmers Welfare, Govt of India",
      te: "వ్యవసాయ & రైతు సంక్షేమ మంత్రిత్వ శాఖ, భారత ప్రభుత్వం"
    },
    verified_date: "2026-08-10",
    url: "https://pmkisan.gov.in/",
    btn_text: {
      en: "Apply on PM-Kisan Portal",
      te: "PM-Kisan పోర్టల్‌లో దరఖాస్తు చేయండి"
    }
  },
  {
    id: "ysr_rythu_bharosa",
    title: {
      en: "YSR Rythu Bharosa (AP)",
      te: "వైఎస్సార్ రైతు భరోసా (AP)"
    },
    benefits: {
      en: "₹13,500 financial assistance per year (includes ₹6,000 PM-Kisan).",
      te: "ఏడాదికి ₹13,500 ఆర్థిక సహాయం (ఇందులో ₹6,000 పీఎం-కిసాన్ భాగం)."
    },
    eligibility: {
      en: "All landowning farmer families residing in Andhra Pradesh.",
      te: "ఆంధ్రప్రదేశ్‌లో నివసిస్తున్న భూమి ఉన్న రైతు కుటుంబాలన్నీ."
    },
    documents: {
      en: "Aadhaar Card, Pattadar Passbook, IFSC Bank Account.",
      te: "ఆధార్ కార్డు, పట్టాదార్ పాస్ పుస్తకం, ఐఎఫ్ఎస్‌సీ బ్యాంక్ వివరాలు."
    },
    last_date: {
      en: "15th November 2026",
      te: "15 నవంబర్ 2026"
    },
    status: "active",
    source: {
      en: "Department of Agriculture, Govt of Andhra Pradesh",
      te: "వ్యవసాయ శాఖ, ఆంధ్రప్రదేశ్ ప్రభుత్వం"
    },
    verified_date: "2026-08-15",
    url: "https://ysrrythubharosa.ap.gov.in/",
    btn_text: {
      en: "Apply on Rythu Bharosa Portal",
      te: "రైతు భరోసా పోర్టల్‌లో దరఖాస్తు చేయండి"
    }
  },
  {
    id: "pmfby",
    title: {
      en: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      te: "ప్రధాన మంత్రి ఫసల్ బీమా యోజన (PMFBY)"
    },
    benefits: {
      en: "Financial support against crop loss due to natural calamities.",
      te: "ప్రకృతి వైపరీత్యాల వల్ల పంట నష్టపోతే ఆర్థిక సహాయం."
    },
    eligibility: {
      en: "All farmers growing notified crops (e.g. Rice, Chilli, Maize).",
      te: "నోటిఫై చేయబడిన పంటలు (వరి, మిర్చి, మొక్కజొన్న మొదలైనవి) సాగు చేసే రైతులు."
    },
    documents: {
      en: "Land sowing certificate, Land registry, Aadhaar, Bank Details.",
      te: "పంట సాగు ధృవీకరణ పత్రం, భూమి పత్రాలు, ఆధార్, బ్యాంక్ వివరాలు."
    },
    last_date: {
      en: "31st December 2026",
      te: "31 డిసెంబర్ 2026"
    },
    status: "active",
    source: {
      en: "Ministry of Agriculture & Farmers Welfare, Govt of India",
      te: "వ్యవసాయ & రైతు సంక్షేమ మంత్రిత్వ శాఖ, భారత ప్రభుత్వం"
    },
    verified_date: "2026-08-01",
    url: "https://pmfby.gov.in/",
    btn_text: {
      en: "Apply on PMFBY Portal",
      te: "PMFBY పోర్టల్‌లో దరఖాస్తు చేయండి"
    }
  },
  {
    id: "smam",
    title: {
      en: "Sub-Mission on Agricultural Mechanization (SMAM)",
      te: "వ్యవసాయ యాంత్రీకరణ సబ్-మిషన్ (SMAM)"
    },
    benefits: {
      en: "40% to 50% subsidy on tractors, rotavators, and farm equipment.",
      te: "ట్రాక్టర్లు, రోటవేటర్లు మరియు ఇతర పరికరాలపై 40% నుండి 50% సబ్సిడీ."
    },
    eligibility: {
      en: "SC/ST, Women, Small & Marginal farmers get higher preference.",
      te: "మహిళలు, ఎస్సీ/ఎస్టీ మరియు చిన్న/సన్నకారు రైతులకు ప్రాధాన్యత."
    },
    documents: {
      en: "Aadhaar Card, Land ownership docs, Bank details, Caste Certificate (if applicable).",
      te: "ఆధార్ కార్డు, భూమి యాజమాన్య పత్రాలు, బ్యాంక్ వివరాలు, కుల ధృవీకరణ పత్రం."
    },
    last_date: {
      en: "30th September 2026",
      te: "30 సెప్టెంబర్ 2026"
    },
    status: "closing_soon",
    source: {
      en: "Department of Agriculture & Farmers Welfare, Govt of India",
      te: "వ్యవసాయ & రైతు సంక్షేమ శాఖ, భారత ప్రభుత్వం"
    },
    verified_date: "2026-08-18",
    url: "https://agrimachinery.nic.in/",
    btn_text: {
      en: "Apply on Agrimachinery Portal",
      te: "యాంత్రీకరణ పోర్టల్‌లో దరఖాస్తు చేయండి"
    }
  }
];

const DISTRICT_CENTERS = {
  nellore: [
    {
      name: { en: "Rythu Seva Kendra (RSK) - Nellore East", te: "రైతు సేవ కేంద్రం (RSK) - నెల్లూరు ఈస్ట్" },
      distance: "2.4 km",
      phone: "+919848012345",
      hours: { en: "9:00 AM - 5:00 PM", te: "ఉ. 9:00 - సా. 5:00" },
      services: {
        en: "Subsidized Seeds & Fertilizers, Crop Insurance Helpdesk, Soil Sample Collection",
        te: "సబ్సిడీ విత్తనాలు & ఎరువులు, పంట బీమా సహాయ కేంద్రం, నేల నమూనా సేకరణ"
      },
      mapUrl: "https://maps.google.com/?q=Rythu+Seva+Kendra+Nellore"
    },
    {
      name: { en: "Nellore District Soil Testing Laboratory (Nellore R.C.)", te: "నెల్లూరు జిల్లా భూసార పరీక్షా కేంద్రం" },
      distance: "4.8 km",
      phone: "+918612345678",
      hours: { en: "10:00 AM - 5:00 PM", te: "ఉ. 10:00 - సా. 5:00" },
      services: {
        en: "NPK Soil Quality Testing, Soil Health Card Issuance, Salinity Analysis",
        te: "భూసార నాణ్యత పరీక్ష (NPK), సాయిల్ హెల్త్ కార్డ్ జారీ, లవణీయత విశ్లేషణ"
      },
      mapUrl: "https://maps.google.com/?q=Soil+Testing+Lab+Nellore"
    }
  ],
  visakhapatnam: [
    {
      name: { en: "Rythu Seva Kendra (RSK) - Visakhapatnam Rural", te: "రైతు సేవ కేంద్రం (RSK) - విశాఖపట్నం రూరల్" },
      distance: "1.8 km",
      phone: "+919866012345",
      hours: { en: "9:00 AM - 5:00 PM", te: "ఉ. 9:00 - సా. 5:00" },
      services: {
        en: "Paddy & Maize seeds distribution, Pest Control consultation, Organic manure supply",
        te: "వరి & మొక్కజొన్న విత్తనాల పంపిణీ, పురుగుల నివారణ సలహాలు, సేంద్రీయ ఎరువుల సరఫరా"
      },
      mapUrl: "https://maps.google.com/?q=Rythu+Seva+Kendra+Visakhapatnam"
    },
    {
      name: { en: "Visakhapatnam Soil Testing Lab (Anakapalle)", te: "విశాఖపట్నం భూసార పరీక్షా కేంద్రం (అనకాపల్లి)" },
      distance: "8.5 km",
      phone: "+918912345678",
      hours: { en: "10:00 AM - 5:00 PM", te: "ఉ. 10:00 - సా. 5:00" },
      services: {
        en: "Advanced Soil Profile Chemical Analysis, Soil Health Card, Water suitability test",
        te: "నేల రసాయన విశ్లేషణ, సాయిల్ హెల్త్ కార్డ్, నీటి నాణ్యత పరీక్ష"
      },
      mapUrl: "https://maps.google.com/?q=Soil+Testing+Lab+Anakapalle"
    }
  ],
  guntur: [
    {
      name: { en: "Rythu Seva Kendra (RSK) - Guntur Urban", te: "రైతు సేవ కేంద్రం (RSK) - గుంటూరు అర్బన్" },
      distance: "2.1 km",
      phone: "+919440012345",
      hours: { en: "9:00 AM - 5:00 PM", te: "ఉ. 9:00 - సా. 5:00" },
      services: {
        en: "Chilli Seed Distribution, Mechanization Subsidy Application Desk, Pesticide Advisory",
        te: "మిర్చి విత్తనాల పంపిణీ, యాంత్రీకరణ సబ్సిడీ డెస్క్, పురుగుల మందుల సలహాలు"
      },
      mapUrl: "https://maps.google.com/?q=Rythu+Seva+Kendra+Guntur"
    },
    {
      name: { en: "Guntur Regional Soil Testing Laboratory (Amaravati Road)", te: "గుంటూరు ప్రాంతీయ భూసార పరీక్షా కేంద్రం" },
      distance: "3.9 km",
      phone: "+918632345678",
      hours: { en: "10:00 AM - 5:00 PM", te: "ఉ. 10:00 - సా. 5:00" },
      services: {
        en: "Advanced Soil NPK Testing, Micro-nutrient deficiency diagnosis, Crop suitability advice",
        te: "భూసార NPK పరీక్ష, సూక్ష్మపోషకాల లోప నిర్ధారణ, పంట అనుకూలత సలహాలు"
      },
      mapUrl: "https://maps.google.com/?q=Soil+Testing+Lab+Guntur"
    }
  ],
  vijayawada: [
    {
      name: { en: "Rythu Seva Kendra (RSK) - Vijayawada Rural", te: "రైతు సేవ కేంద్రం (RSK) - విజయవాడ రూరల్" },
      distance: "2.5 km",
      phone: "+919490012345",
      hours: { en: "9:00 AM - 5:00 PM", te: "ఉ. 9:00 - సా. 5:00" },
      services: {
        en: "Horticulture Subsidies, Micro-irrigation equipment helpdesk, Crop advisory",
        te: "ఉద్యానవన సబ్సిడీలు, సూక్ష్మ నీటిపారుదల సహాయ కేంద్రం, పంట సలహాలు"
      },
      mapUrl: "https://maps.google.com/?q=Rythu+Seva+Kendra+Vijayawada"
    },
    {
      name: { en: "Vijayawada Fertilizer Quality Control Laboratory", te: "విజయవాడ ఎరువుల నాణ్యత నియంత్రణ కేంద్రం" },
      distance: "5.1 km",
      phone: "+918662345678",
      hours: { en: "10:00 AM - 5:00 PM", te: "ఉ. 10:00 - సా. 5:00" },
      services: {
        en: "Fertilizer purity test, Soil health card issuance, Irrigation water analysis",
        te: "ఎరువుల నాణ్యత పరీక్ష, సాయిల్ హెల్త్ కార్డ్ జారీ, సాగు నీటి విశ్లేషణ"
      },
      mapUrl: "https://maps.google.com/?q=Fertilizer+Lab+Vijayawada"
    }
  ],
  kavali: [
    {
      name: { en: "Rythu Seva Kendra (RSK) - Kavali Center", te: "రైతు సేవ కేంద్రం (RSK) - కావలి సెంటర్" },
      distance: "1.5 km",
      phone: "+919848098765",
      hours: { en: "9:00 AM - 5:00 PM", te: "ఉ. 9:00 - సా. 5:00" },
      services: {
        en: "Groundnut Seed Distribution, Subsidized fertilizer sales, Crop damage verification",
        te: "వేరుశనగ విత్తనాల పంపిణీ, సబ్సిడీ ఎరువుల అమ్మకం, పంట నష్ట ధృవీకరణ"
      },
      mapUrl: "https://maps.google.com/?q=Rythu+Seva+Kendra+Kavali"
    },
    {
      name: { en: "Nellore North Mobile Soil Testing Laboratory (Kavali Desk)", te: "నెల్లూరు నార్త్ మొబైల్ భూసార పరీక్షా కేంద్రం (కావలి)" },
      distance: "3.2 km",
      phone: "+918626234567",
      hours: { en: "10:00 AM - 4:00 PM", te: "ఉ. 10:00 - సా. 4:00" },
      services: {
        en: "Soil nutrient analysis, Fertilizer dosage recommendations, Soil Health Card",
        te: "నేల పోషకాల విశ్లేషణ, ఎరువుల మోతాదు సిఫార్సులు, సాయిల్ హెల్త్ కార్డ్"
      },
      mapUrl: "https://maps.google.com/?q=Soil+Testing+Lab+Kavali"
    }
  ]
};

function renderExtensionServices() {
  const schemesList = document.getElementById("extension-schemes-list");
  const centersList = document.getElementById("extension-centers-list");
  if (!schemesList || !centersList) return;

  const isTe = currentLang === "te";
  const landSize = registeredFarmer ? Number(registeredFarmer.land_size_acres) : 3.0;
  const farmerLoc = (registeredFarmer ? registeredFarmer.location : "").toLowerCase();

  schemesList.innerHTML = `
    <span class="badge" style="background:rgba(100,116,139,0.1); color:#475569; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; display:inline-block; margin-bottom:12px;">ℹ ${isTe ? "ప్రదర్శన పథకాలు (Demo Data)" : "Demo Schemes Data"}</span>
  `;

  const schemeSearch = document.getElementById("scheme-search-input").value.toLowerCase();

  EXTENSION_SCHEMES.forEach(s => {
    const matchKeyword = !schemeSearch || 
      s.title.en.toLowerCase().includes(schemeSearch) ||
      s.title.te.includes(schemeSearch) ||
      s.benefits.en.toLowerCase().includes(schemeSearch) ||
      s.benefits.te.includes(schemeSearch) ||
      s.eligibility.en.toLowerCase().includes(schemeSearch) ||
      s.eligibility.te.includes(schemeSearch);

    if (!matchKeyword) return;

    let eligible = true;
    let eligMsgEn = "Eligible";
    let eligMsgTe = "అర్హులు";

    if (s.id === "pm_kisan" && landSize > 5.0) {
      eligible = false;
      eligMsgEn = "Not Eligible (Land > 5 acres)";
      eligMsgTe = "అనర్హులు (భూమి > 5 ఎకరాలు)";
    }
    if (s.id === "ysr_rythu_bharosa" && farmerLoc && !farmerLoc.includes("andhra prado") && !farmerLoc.includes("andhra pradesh") && !farmerLoc.includes("ap") && !farmerLoc.includes("nellore") && !farmerLoc.includes("guntur") && !farmerLoc.includes("kavali") && !farmerLoc.includes("visakhapatnam") && !farmerLoc.includes("vijayawada")) {
      eligible = false;
      eligMsgEn = "Not Eligible (Only for AP residents)";
      eligMsgTe = "అనర్హులు (కేవలం AP నివాసితులకు)";
    }

    const badgeBg = eligible ? "#10b981" : "#ef4444";
    const badgeText = isTe ? eligMsgTe : eligMsgEn;

    const schemeDiv = document.createElement("div");
    schemeDiv.className = "scheme-item";
    schemeDiv.style.cssText = "border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 12px; background: var(--bg-card); position: relative;";
    
    let statusText = s.status === "closing_soon" ? (isTe ? "త్వరలో ముగుస్తుంది" : "Closing Soon") : (isTe ? "యాక్టివ్" : "Active");
    let statusColor = s.status === "closing_soon" ? "#eab308" : "#10b981";

    schemeDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
        <span class="scheme-badge" style="background:${statusColor}; font-size:11px; padding:3px 8px; border-radius:4px; color:#fff; font-weight:600;">${statusText}</span>
        <span style="background:${badgeBg}; color:#fff; font-size:11px; padding:3px 8px; border-radius:4px; font-weight:600;">${badgeText}</span>
      </div>
      <h4 style="margin: 8px 0; font-weight: 700; color: var(--text-main); font-size: 15px;">${isTe ? s.title.te : s.title.en}</h4>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main); line-height:1.4;"><strong>${isTe ? "ప్రయోజనాలు:" : "Benefits:"}</strong> ${isTe ? s.benefits.te : s.benefits.en}</p>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main); line-height:1.4;"><strong>${isTe ? "అర్హత:" : "Eligibility:"}</strong> ${isTe ? s.eligibility.te : s.eligibility.en}</p>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main); line-height:1.4;"><strong>${isTe ? "పత్రాలు:" : "Documents:"}</strong> ${isTe ? s.documents.te : s.documents.en}</p>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main); line-height:1.4;"><strong>${isTe ? "చివరి తేదీ:" : "Last Date:"}</strong> ${isTe ? s.last_date.te : s.last_date.en}</p>
      <p style="font-size:12px; margin: 8px 0 2px; color: var(--text-muted);"><strong>${isTe ? "మూలం:" : "Source:"}</strong> ${isTe ? s.source.te : s.source.en}</p>
      <p style="font-size:11px; margin: 2px 0 10px; color: var(--text-muted); font-style:italic;">${isTe ? "చివరిగా ధృవీకరించబడింది:" : "Last verified:"} ${s.verified_date}</p>
      <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="btn primary-btn" style="display:inline-block; font-size:12px; padding: 6px 12px; text-decoration:none; text-align:center; box-sizing:border-box;">${isTe ? s.btn_text.te : s.btn_text.en} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
    `;
    schemesList.appendChild(schemeDiv);
  });

  centersList.innerHTML = `
    <span class="badge" style="background:rgba(100,116,139,0.1); color:#475569; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; display:inline-block; margin-bottom:12px;">ℹ ${isTe ? "ప్రదర్శన సేవా కేంద్రాలు (Demo Data)" : "Demo Centers Data"}</span>
  `;

  let activeDistrict = "nellore";
  if (farmerLoc) {
    if (farmerLoc.includes("visakhapatnam") || farmerLoc.includes("vizag")) activeDistrict = "visakhapatnam";
    else if (farmerLoc.includes("guntur")) activeDistrict = "guntur";
    else if (farmerLoc.includes("vijayawada") || farmerLoc.includes("krishna")) activeDistrict = "vijayawada";
    else if (farmerLoc.includes("kavali")) activeDistrict = "kavali";
  }

  const centers = DISTRICT_CENTERS[activeDistrict] || DISTRICT_CENTERS.nellore;
  const centerSearch = document.getElementById("center-search-input").value.toLowerCase();

  centers.forEach(c => {
    const matchKeyword = !centerSearch || 
      c.name.en.toLowerCase().includes(centerSearch) ||
      c.name.te.includes(centerSearch) ||
      c.services.en.toLowerCase().includes(centerSearch) ||
      c.services.te.includes(centerSearch);

    if (!matchKeyword) return;

    const centerDiv = document.createElement("div");
    centerDiv.className = "center-item";
    centerDiv.style.cssText = "border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 12px; background: var(--bg-card);";

    centerDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; font-weight: 700; color: var(--text-main); font-size: 15px;">${isTe ? c.name.te : c.name.en}</h4>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main);">📍 <strong>${isTe ? "దూరం:" : "Distance:"}</strong> ${c.distance} ${isTe ? "దూరంలో" : "away"}</p>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main);">🕒 <strong>${isTe ? "వేళలు:" : "Hours:"}</strong> ${isTe ? c.hours.te : c.hours.en}</p>
      <p style="font-size:13px; margin: 4px 0; color: var(--text-main); line-height:1.4;">💼 <strong>${isTe ? "సేవలు:" : "Services:"}</strong> ${isTe ? c.services.te : c.services.en}</p>
      <p style="font-size:13px; margin: 4px 0 10px; color: var(--text-main);">📞 <strong>${isTe ? "ఫోన్:" : "Phone:"}</strong> ${c.phone}</p>
      
      <div style="display:flex; gap: 8px; margin-top: 10px;">
        <a href="tel:${c.phone}" class="btn secondary-btn" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:12px; padding: 6px 12px; text-decoration:none; font-weight:600;"><i class="fa-solid fa-phone"></i> ${isTe ? "కాల్ చేయండి" : "Call Center"}</a>
        <a href="${c.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn secondary-btn" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:12px; padding: 6px 12px; text-decoration:none; font-weight:600;"><i class="fa-solid fa-location-arrow"></i> ${isTe ? "దారి చూపించు" : "Get Directions"}</a>
      </div>
    `;
    centersList.appendChild(centerDiv);
  });
}
