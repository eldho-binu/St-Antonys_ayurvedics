import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  Activity, 
  User, 
  LogOut, 
  Menu,
  X,
  Home,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  Leaf,
  Sprout,
  BookOpen,
  Heart,
  Sparkles,
  Clock,
  Compass,
  Coffee,
  Sun,
  Moon,
  FileText,
  ChevronRight,
  Check
} from 'lucide-react';
import clinicLogo from './assets/logo.png';

// API Configuration
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

// Token management functions
const getStoredToken = () => localStorage.getItem('auth_token');
const setStoredToken = (token) => localStorage.setItem('auth_token', token);
const removeStoredToken = () => localStorage.removeItem('auth_token');

const api = {
  // Helper function to make authenticated requests with auto-refresh
  makeAuthenticatedRequest: async (url, options = {}) => {
    const token = getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers
    });

    // If unauthorized, try to refresh token
    if (response.status === 401 && token) {
      console.log('Token expired, attempting refresh...');
      
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.token) {
            setStoredToken(refreshData.token);
            console.log('Token refreshed successfully');
            
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${refreshData.token}`;
            response = await fetch(url, {
              credentials: 'include',
              ...options,
              headers
            });
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    // If still unauthorized after refresh attempt, clear token
    if (response.status === 401) {
      removeStoredToken();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  },

  // Add token refresh method
  refreshToken: async () => {
    try {
      const token = getStoredToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          setStoredToken(data.token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  // Improved auth check with retry logic
  checkAuth: async () => {
    try {
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/auth/check`);
      
      if (!response.ok) {
        if (response.status === 401) {
          removeStoredToken();
          return { success: false, authenticated: false };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Auth check error:', error);
      
      // If it's an auth error, clear token
      if (error.message?.includes('Authentication expired')) {
        removeStoredToken();
      }
      
      return { success: false, authenticated: false };
    }
  },

  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const result = await response.json();
      
      // Store JWT token if provided
      if (result.token) {
        setStoredToken(result.token);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.makeAuthenticatedRequest(`${API_BASE}/auth/logout`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeStoredToken();
    }
  },

  // Patient APIs
  getPatients: async (page = 1, limit = 50, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/patients?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Load patients error:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/dashboard/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Load stats error:', error);
      throw error;
    }
  },

  // Other APIs follow the same pattern...
  createPatient: async (patientData) => {
    try {
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/patients`, {
        method: 'POST',
        body: JSON.stringify(patientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create patient');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updatePatient: async (regno, patientData) => {
    try {
      // Double URL encode to handle special characters properly
      const encodedRegno = encodeURIComponent(encodeURIComponent(regno));
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/patients/${encodedRegno}`, {
        method: 'PUT',
        body: JSON.stringify(patientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update patient');
      }

      return await response.json();
    } catch (error) {
      console.error('Update patient error:', error);
      throw error;
    }
  },

  deletePatient: async (regno) => {
    try {
      // Double URL encode to handle special characters properly
      const encodedRegno = encodeURIComponent(encodeURIComponent(regno));
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/patients/${encodedRegno}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete patient');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete patient error:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Add CSV export method
  exportPatients: async () => {
    try {
      // Get all patients with a high limit for CSV export
      const response = await api.makeAuthenticatedRequest(`${API_BASE}/patients?limit=10000`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to export patients');
      }
    } catch (error) {
      console.error('Export patients error:', error);
      throw error;
    }
  }
};

// Ayurvedic wisdom tips
const AYURVEDIC_TIPS = [
  "Dinacharya (Daily Routine): Start your day with warm water to stimulate your digestive fire (Agni) and promote natural detoxification.",
  "Triphala (Haritaki, Bibhitaki, and Amalaki) is the ultimate formulation in Ayurveda for balancing all three doshas: Vata, Pitta, and Kapha.",
  "According to Ayurveda, food should be consumed fresh, warm, and in a peaceful environment to optimize digestion and nutrient assimilation.",
  "Ashwagandha (Withania somnifera) is a powerful adaptogen that reduces stress, supports nervous system health, and boosts vitality.",
  "Pranayama (breathing exercises) helps balance Prana (life force), calms the nervous system, and strengthens overall immunity.",
  "Ginger, cinnamon, and cardamom boost digestion (Agni), improve circulation, and help reduce accumulation of Ama (toxins).",
  "A balanced state of Vata (air/ether), Pitta (fire/water), and Kapha (earth/water) is the foundation of complete physical and mental well-being."
];

const getDailyTip = () => {
  const day = new Date().getDay(); // 0 to 6
  return AYURVEDIC_TIPS[day % AYURVEDIC_TIPS.length];
};

const PRAKRITI_QUESTIONS = [
  {
    id: 1,
    question: "How would you describe your physical body frame?",
    options: [
      { text: "Lean, thin, tall/short, difficult to gain weight", type: "vata" },
      { text: "Medium build, athletic, easily gain/lose weight", type: "pitta" },
      { text: "Large build, thick-set, easily gain weight, difficult to lose", type: "kapha" }
    ]
  },
  {
    id: 2,
    question: "What is your skin type and tendency?",
    options: [
      { text: "Dry, rough, cold to touch, cracks easily", type: "vata" },
      { text: "Warm, reddish/fair, sensitive, prone to acne/freckles", type: "pitta" },
      { text: "Thick, oily, soft, cool, smooth, clear skin", type: "kapha" }
    ]
  },
  {
    id: 3,
    question: "Describe your hair texture and appearance.",
    options: [
      { text: "Dry, brittle, frizzy, curly, dark or thin", type: "vata" },
      { text: "Fine, soft, straight, early graying or thinning, blonde/reddish", type: "pitta" },
      { text: "Thick, abundant, oily, wavy, dark, shiny and strong", type: "kapha" }
    ]
  },
  {
    id: 4,
    question: "How is your appetite and digestion?",
    options: [
      { text: "Variable (sometimes hungry, sometimes not), prone to gas/bloating", type: "vata" },
      { text: "Strong, sharp hunger, gets irritable if meals are delayed, quick digestion", type: "pitta" },
      { text: "Slow but steady appetite, can easily skip meals, slow digestion", type: "kapha" }
    ]
  },
  {
    id: 5,
    question: "What are your sleep patterns?",
    options: [
      { text: "Light, interrupted, tends to have insomnia, needs 6-7 hours", type: "vata" },
      { text: "Moderate, sound sleep, wakes up refreshed, needs 7-8 hours", type: "pitta" },
      { text: "Deep, heavy sleep, difficult to wake up, needs 8+ hours", type: "kapha" }
    ]
  },
  {
    id: 6,
    question: "Which weather/temperature do you prefer least?",
    options: [
      { text: "Dislikes cold, wind, and dry weather", type: "vata" },
      { text: "Dislikes heat, direct sun, and humid weather", type: "pitta" },
      { text: "Dislikes cold, damp, and rainy weather", type: "kapha" }
    ]
  },
  {
    id: 7,
    question: "How would you describe your mental temperament and memory?",
    options: [
      { text: "Quick to learn but quick to forget, creative, hyperactive", type: "vata" },
      { text: "Sharp, intelligent, focused, good comprehension, organized", type: "pitta" },
      { text: "Learns slowly but retains information forever, calm, stable", type: "kapha" }
    ]
  },
  {
    id: 8,
    question: "How do you react under stress or pressure?",
    options: [
      { text: "Anxious, fearful, worried, overthinks", type: "vata" },
      { text: "Angry, irritable, impatient, aggressive", type: "pitta" },
      { text: "Calm, slow to react, peaceful, sometimes defensive/stubborn", type: "kapha" }
    ]
  },
  {
    id: 9,
    question: "What is your typical speech and walking pace?",
    options: [
      { text: "Fast talker, walks quickly, speaks with many hand gestures", type: "vata" },
      { text: "Precise, sharp, arguments/debates easily, steady walking pace", type: "pitta" },
      { text: "Slow, soft speech, walks gracefully and slowly", type: "kapha" }
    ]
  },
  {
    id: 10,
    question: "How do you handle money/spending?",
    options: [
      { text: "Spends impulsively on small things, struggles to save", type: "vata" },
      { text: "Spends methodically on high-quality/luxury items", type: "pitta" },
      { text: "Saves money, hates spending, accumulates wealth easily", type: "kapha" }
    ]
  }
];

const DOSHA_DETAILS = {
  Vata: {
    elements: "Air & Ether (Akasha & Vayu)",
    description: "Vata is characterized by qualities of cold, light, dry, rough, flowing, and spacious. It governs bodily movement, circulation, respiration, and nervous system activity.",
    diet: [
      "Favor warm, cooked, nourishing foods with sweet, sour, and salty tastes.",
      "Incorporate healthy fats like Ghee, sesame oil, and olive oil.",
      "Enjoy warm spiced herbal teas (ginger, cinnamon, cardamom).",
      "Avoid raw vegetables, cold drinks, dry snacks, and bitter/astringent tastes."
    ],
    lifestyle: [
      "Maintain a regular daily routine (Dinacharya) for sleeping and eating.",
      "Practice grounding exercises like gentle yoga, walking, and meditation.",
      "Perform daily self-massage (Abhyanga) with warm sesame oil.",
      "Ensure adequate rest, sleep, and keep warm during cold, windy days."
    ],
    herbs: "Ashwagandha, Shatavari, Triphala, Haritaki"
  },
  Pitta: {
    elements: "Fire & Water (Agni & Jala)",
    description: "Pitta is characterized by qualities of hot, sharp, light, liquid, oily, and mobile. It governs metabolism, digestion, body temperature, and intellectual understanding.",
    diet: [
      "Favor cool, refreshing foods with sweet, bitter, and astringent tastes.",
      "Eat plenty of fresh fruits (sweet apples, melons, grapes) and leafy greens.",
      "Use cooling spices like coriander, fennel, cardamom, and fresh cilantro.",
      "Avoid spicy, oily, fried, sour, salty, and fermented foods. Minimize alcohol/caffeine."
    ],
    lifestyle: [
      "Maintain moderation in work, exercise, and activities to avoid burning out.",
      "Spend time in nature, especially near water or under the moonlight.",
      "Practice calming, non-competitive forms of yoga and pranayama (e.g. Shitali).",
      "Keep body and mind cool; avoid hot showers and direct sun exposure at midday."
    ],
    herbs: "Amalaki (Amla), Shatavari, Brahmi, Guduchi"
  },
  Kapha: {
    elements: "Earth & Water (Prithvi & Jala)",
    description: "Kapha is characterized by qualities of heavy, slow, steady, cool, oily, smooth, dense, and soft. It governs physical structure, hydration, joints, and immunity.",
    diet: [
      "Favor warm, light, dry, and easily digestible foods with pungent, bitter, and astringent tastes.",
      "Incorporate heating spices like ginger, black pepper, turmeric, and garlic.",
      "Eat plenty of vegetables, beans, and light grains (quinoa, millet).",
      "Avoid heavy, sweet, oily, cold, dairy, wheat, and highly salty foods."
    ],
    lifestyle: [
      "Incorporate stimulating, vigorous exercise into your daily routine.",
      "Avoid sleeping during the day or oversleeping (waking up before 6 AM is ideal).",
      "Seek new experiences, change, and stay active/motivated.",
      "Perform dry massage (Udvarthanam) or massage with warm mustard oil."
    ],
    herbs: "Triphala, Bibhitaki, Guggulu, Ginger, Pippali"
  },
  "Vata-Pitta": {
    elements: "Air, Ether, Fire, & Water",
    description: "Vata-Pitta combination represents dual qualities of movement and heat. You possess both creative, active energy (Vata) and focused, intense intelligence (Pitta).",
    diet: [
      "Focus on warm, cooked foods that are moderate in spices (avoid extreme heat).",
      "Prioritize sweet, grounding grains, healthy fats, and cooling vegetables.",
      "Stay well hydrated with warm or room-temperature water."
    ],
    lifestyle: [
      "Avoid over-exertion. Rest when tired to prevent Vata spikes, but stay cool to prevent Pitta flares.",
      "Follow a structured but flexible routine.",
      "Practice grounding and cooling meditation."
    ],
    herbs: "Shatavari, Brahmi, Ashwagandha"
  },
  "Pitta-Kapha": {
    elements: "Fire, Water, & Earth",
    description: "Pitta-Kapha combination balances the intensity and heat of Fire with the structural stability and coolness of Earth/Water.",
    diet: [
      "Favor light, warm, dry, and bitter/astringent foods.",
      "Avoid oily, deep-fried, and highly acidic or salty foods.",
      "Use moderate warming spices (fennel, turmeric, cumin)."
    ],
    lifestyle: [
      "Keep physically active to stimulate Kapha, but stay calm to pacify Pitta.",
      "Engage in moderately active exercises in a cool environment.",
      "Develop a clear daily structure."
    ],
    herbs: "Guduchi, Triphala, Neem"
  },
  "Vata-Kapha": {
    elements: "Air, Ether, Earth, & Water",
    description: "Vata-Kapha combination represents the dry/cold movement of Vata along with the heavy/cold stability of Kapha. Both doshas share the quality of coldness, so warmth is essential.",
    diet: [
      "Prioritize warm, cooked, lightly spiced, and dry foods.",
      "Avoid cold, raw, frozen, and highly damp/heavy foods.",
      "Use warming spices like ginger, cinnamon, and black pepper."
    ],
    lifestyle: [
      "Keep warm and active. Seek dry warmth and sunny spaces.",
      "Stay active with moderate, regular aerobic exercises.",
      "Perform warm oil massages followed by warm baths."
    ],
    herbs: "Ashwagandha, Guggulu, Pippali"
  },
  "Tridoshic": {
    elements: "Vata, Pitta, & Kapha (All 5 Elements)",
    description: "Tridoshic constitution represents a balanced state where Vata, Pitta, and Kapha are present in equal, harmonious proportions. Keeping this balance is the primary goal.",
    diet: [
      "Follow a varied, seasonal diet containing all six tastes in moderation.",
      "Adapt diet based on seasonal changes (e.g., pacify Pitta in summer, Vata in autumn, Kapha in spring)."
    ],
    lifestyle: [
      "Practice moderation in all aspects of life.",
      "Adjust lifestyle routines to fit the seasons and current age.",
      "Keep a steady daily rhythm of work, rest, and sleep."
    ],
    herbs: "Triphala (naturally balances all three doshas)"
  }
};

const HERBS_DATA = [
  {
    name: "Ashwagandha",
    sanskritName: "Aswagandha",
    botanicalName: "Withania somnifera",
    dosha: "Balances Vata & Kapha",
    benefits: "Reduces stress & anxiety, supports nervous system health, boosts muscle strength, enhances vitality, and strengthens overall immunity.",
    usage: "1/2 tsp of powder with warm milk or water at bedtime."
  },
  {
    name: "Tulsi",
    sanskritName: "Tulasi",
    botanicalName: "Ocimum sanctum",
    dosha: "Balances Kapha & Vata (May increase Pitta in excess)",
    benefits: "Excellent for respiratory health, supports immune defense against coughs & colds, acts as an adaptogen, and is rich in antioxidants.",
    usage: "Fresh leaf infusion as tea, or 1-2 capsules daily."
  },
  {
    name: "Shatavari",
    sanskritName: "Satavari",
    botanicalName: "Asparagus racemosus",
    dosha: "Balances Pitta & Vata",
    benefits: "Nourishes the reproductive organs, cools the body, supports female hormone balance, and acts as a powerful nutritive tonic.",
    usage: "1/2 tsp with warm milk, ghee, or honey."
  },
  {
    name: "Neem",
    sanskritName: "Nimba",
    botanicalName: "Azadirachta indica",
    dosha: "Balances Pitta & Kapha (Increases Vata)",
    benefits: "Powerful blood purifier and detoxifier. Supports skin health, treats inflammatory skin disorders, and has antibacterial properties.",
    usage: "Neem paste topically, or bitter decoction in small doses."
  },
  {
    name: "Triphala",
    sanskritName: "Triphala",
    botanicalName: "Three Myrobalans formulation",
    dosha: "Balances Vata, Pitta, and Kapha (Tridoshic)",
    benefits: "Promotes gentle colon detoxification, regulates bowel movements, tones the digestive tract, and is high in natural antioxidants/Vitamin C.",
    usage: "1/2 to 1 tsp in warm water before bed."
  },
  {
    name: "Turmeric",
    sanskritName: "Haridra",
    botanicalName: "Curcuma longa",
    dosha: "Balances Kapha & Vata (Balances Pitta in moderation)",
    benefits: "Natural anti-inflammatory, promotes joint health, supports liver detoxification, purifies blood, and aids wound healing.",
    usage: "1/2 tsp in cooking, or warm golden milk."
  },
  {
    name: "Brahmi",
    sanskritName: "Brahmi",
    botanicalName: "Bacopa monnieri",
    dosha: "Balances Vata, Pitta, and Kapha",
    benefits: "Excellent brain tonic. Enhances cognitive function, concentration, and memory retention, while calming the nervous system and reducing stress.",
    usage: "Infused in ghee (Brahmi Ghritham) or as a warm tea."
  },
  {
    name: "Giloy",
    sanskritName: "Guduchi",
    botanicalName: "Tinospora cordifolia",
    dosha: "Balances all three doshas (Tridoshic)",
    benefits: "Highly effective immunomodulator. Helps manage chronic fevers, supports liver function, detoxifies the body, and combats allergies.",
    usage: "Stem juice or decoction, 15-30ml daily."
  }
];

const TREATMENTS_DATA = [
  {
    name: "Shirodhara",
    sanskritName: "Sirodhara",
    duration: "45-60 mins",
    dosha: "Pacifies Vata & Pitta",
    description: "A soothing procedure where warm medicated herbal oil, milk, or buttermilk is poured in a continuous, gentle stream on the forehead (the 'third eye').",
    benefits: "Relieves mental stress, anxiety, insomnia, headaches, and tension. Stabilizes the nervous system and enhances sensory clarity."
  },
  {
    name: "Abhyanga",
    sanskritName: "Abhyanga",
    duration: "50-60 mins",
    dosha: "Pacifies Vata & Kapha",
    description: "A synchronized full-body massage using warm, herb-infused oils selected according to the patient's dominant constitution and health condition.",
    benefits: "Improves blood circulation, drains lymphatic toxins, softens skin, lubricates joints, reduces muscle stiffness, and promotes deep sleep."
  },
  {
    name: "Elakizhi (Patra Pinda Sweda)",
    sanskritName: "Patra Pinda Sweda",
    duration: "45 mins",
    dosha: "Pacifies Vata & Kapha",
    description: "Therapeutic sweating therapy where the body is massaged using boluses containing fresh herbal leaves (like neem, castor, tamarind) fried in herbal oils.",
    benefits: "Highly effective for arthritis, joint pains, muscle cramps, neurological disorders, sports injuries, and backaches."
  },
  {
    name: "Basti (Medicated Enema)",
    sanskritName: "Basti",
    duration: "30-45 mins",
    dosha: "Pacifies Vata (The primary therapy for Vata)",
    description: "Introduction of herbal decoctions or oils into the rectum. In Ayurveda, the colon is the primary seat of Vata dosha, making Basti a core Panchakarma therapy.",
    benefits: "Removes accumulated toxins from the colon, relieves chronic constipation, treats lower back pain, sciatica, and degenerative joint diseases."
  },
  {
    name: "Nasya (Nasal Therapy)",
    sanskritName: "Nasya",
    duration: "20-30 mins",
    dosha: "Pacifies Kapha & Vata",
    description: "Administration of medicated herbal oils, juices, or powders through the nasal passages. It is preceded by a light head-neck massage and steam.",
    benefits: "Clears sinuses, relieves chronic headaches, mitigates neck stiffness, improves memory, and treats sleep apnea and respiratory issues."
  },
  {
    name: "Udvarthanam (Herbal Powder Massage)",
    sanskritName: "Udvartanam",
    duration: "45 mins",
    dosha: "Pacifies Kapha",
    description: "A dry massage performed using dry herbal powders rubbed over the body in an upward direction (opposite to hair follicles).",
    benefits: "Breaks down fat deposits (excellent for weight management), tones skin, improves blood circulation, and removes dead skin cells."
  }
];

const DINACHARYA_DATA = [
  { time: "05:00 - 06:00", title: "Brahma Muhurta (Wake Up)", icon: "Sun", desc: "Rise during the auspicious hours before sunrise to capture quiet morning energy." },
  { time: "06:00 - 06:30", title: "Cleansing Rituals", icon: "Check", desc: "Brush teeth, scrape your tongue with a copper/steel scraper, wash eyes, and drink warm water to stimulate bowel movements." },
  { time: "06:30 - 07:00", title: "Abhyanga & Bath", icon: "Activity", desc: "Massage the scalp and body with warm sesame oil, then take a warm shower to wash away toxins and relax muscles." },
  { time: "07:00 - 07:45", title: "Yoga & Pranayama", icon: "Sprout", desc: "Practice breathing exercises (Pranayama) and gentle stretches to channel life force (Prana) and calm the nervous system." },
  { time: "08:00 - 08:30", title: "Breakfast", icon: "Coffee", desc: "Eat a warm, freshly prepared breakfast (cooked oatmeal, stewed apples, etc.) suitable for your dominant Dosha." },
  { time: "12:00 - 13:30", title: "Lunch (Main Meal)", icon: "Sun", desc: "Consume your largest meal when the sun is highest, as your digestive fire (Agni) is strongest. Sit in peace while eating." },
  { time: "13:30 - 14:00", title: "Short Walk", icon: "Compass", desc: "Walk 100 paces after eating to assist digestion. Avoid sleeping immediately after lunch." },
  { time: "17:30 - 18:30", title: "Meditation & Sunset Reflection", icon: "Moon", desc: "Practice evening breathing or meditation to release work stress and transition into a peaceful evening state." },
  { time: "18:30 - 19:30", title: "Dinner", icon: "Coffee", desc: "Eat a light, warm dinner (soups, steamed vegetables). Dinner should be smaller than lunch and eaten at least 2 hours before bed." },
  { time: "21:30 - 22:00", title: "Restful Sleep", icon: "Moon", desc: "Switch off electronic devices, drink warm spiced nutmeg/cardamom milk, and sleep by 10:00 PM to facilitate cellular repair." }
];

// Login Component
function LoginForm({ onLogin, loading, error }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative botanical watermarks */}
      <div className="absolute top-10 left-10 text-green-200 opacity-30 transform -rotate-45 pointer-events-none hidden sm:block">
        <Leaf className="w-32 h-32 animate-pulse" style={{ animationDuration: '4s' }} />
      </div>
      <div className="absolute bottom-10 right-10 text-green-200 opacity-30 transform rotate-12 pointer-events-none hidden sm:block">
        <Sprout className="w-36 h-36 animate-pulse" style={{ animationDuration: '6s' }} />
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
            <img 
              src={clinicLogo}
              alt="St Antonys Ayurvedic Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Leaf className="w-8 h-8 text-white hidden" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">St Antony's Ayurvedics</h1>
          <p className="text-gray-600 mt-2">Admin Panel Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Change Password Modal
function ChangePasswordModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({ current_password: '', new_password: '' });
      setShowPasswords({ current: false, new: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                minLength="6"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Prakriti Quiz Modal Component
function PrakritiQuizModal({ isOpen, onClose, onApplyDosha }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: 'vata' | 'pitta' | 'kapha' }
  const [results, setResults] = useState(null); // { vata: %, pitta: %, kapha: %, dominant: '' }

  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestionIdx(0);
      setAnswers({});
      setResults(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectOption = (type) => {
    const questionId = PRAKRITI_QUESTIONS[currentQuestionIdx].id;
    const newAnswers = { ...answers, [questionId]: type };
    setAnswers(newAnswers);

    if (currentQuestionIdx < PRAKRITI_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate results
      const counts = { vata: 0, pitta: 0, kapha: 0 };
      Object.values(newAnswers).forEach(t => {
        counts[t]++;
      });
      const total = PRAKRITI_QUESTIONS.length;
      const vataPct = Math.round((counts.vata / total) * 100);
      const pittaPct = Math.round((counts.pitta / total) * 100);
      const kaphaPct = Math.round((counts.kapha / total) * 100);

      // Determine dominant dosha
      let dominant = '';
      const maxVal = Math.max(vataPct, pittaPct, kaphaPct);
      
      // Handle dual-doshas if two values are close (within 10% of each other)
      const diffVP = Math.abs(vataPct - pittaPct);
      const diffPK = Math.abs(pittaPct - kaphaPct);
      const diffVK = Math.abs(vataPct - kaphaPct);

      if (vataPct >= 30 && pittaPct >= 30 && kaphaPct >= 30) {
        dominant = 'Tridoshic';
      } else if (diffVP <= 10 && vataPct + pittaPct > 60) {
        dominant = 'Vata-Pitta';
      } else if (diffPK <= 10 && pittaPct + kaphaPct > 60) {
        dominant = 'Pitta-Kapha';
      } else if (diffVK <= 10 && vataPct + kaphaPct > 60) {
        dominant = 'Vata-Kapha';
      } else {
        if (maxVal === vataPct) dominant = 'Vata';
        else if (maxVal === pittaPct) dominant = 'Pitta';
        else dominant = 'Kapha';
      }

      setResults({
        vata: vataPct,
        pitta: pittaPct,
        kapha: kaphaPct,
        dominant
      });
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  const currentQuestion = PRAKRITI_QUESTIONS[currentQuestionIdx];
  const progressPercent = Math.round(((currentQuestionIdx) / PRAKRITI_QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-200 animate-pulse" />
            Prakriti (Dosha) Quiz Analyzer
          </h3>
          <button onClick={onClose} className="text-green-100 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!results ? (
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 font-semibold mb-2">
                  <span>Question {currentQuestionIdx + 1} of {PRAKRITI_QUESTIONS.length}</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              {/* Question */}
              <h4 className="text-lg font-bold text-gray-900 mb-6">{currentQuestion.question}</h4>

              {/* Options */}
              <div className="space-y-4">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt.type)}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 hover:bg-opacity-50 transition-all active:scale-[0.99] flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-gray-800">{opt.text}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </button>
                ))}
              </div>

              {/* Back Button */}
              {currentQuestionIdx > 0 && (
                <button
                  onClick={handlePrev}
                  className="mt-6 px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Previous Question
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-10 h-10 text-green-600 animate-bounce" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Prakriti Analysis Complete!</h4>
              <p className="text-gray-600 mb-6 text-sm">Based on the physical and psychological characteristics, the constitution is dominant in:</p>

              {/* Dynamic Badge */}
              <div className="inline-block px-6 py-2.5 rounded-full border text-lg font-bold mb-8" style={{
                backgroundColor: results.dominant === 'Vata' ? '#ecfeff' : results.dominant === 'Pitta' ? '#fff7ed' : results.dominant === 'Kapha' ? '#f0fdf4' : '#faf5ff',
                color: results.dominant === 'Vata' ? '#0891b2' : results.dominant === 'Pitta' ? '#ea580c' : results.dominant === 'Kapha' ? '#16a34a' : '#9333ea',
                borderColor: results.dominant === 'Vata' ? '#c5f2f7' : results.dominant === 'Pitta' ? '#ffedd5' : results.dominant === 'Kapha' ? '#dcfce7' : '#f3e8ff',
              }}>
                {results.dominant} Dosha
              </div>

              {/* Percentages Chart */}
              <div className="max-w-md mx-auto space-y-4 mb-8">
                {/* Vata */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-cyan-700">Vata (Air & Ether)</span>
                    <span className="text-cyan-800">{results.vata}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${results.vata}%` }}></div>
                  </div>
                </div>

                {/* Pitta */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-orange-700">Pitta (Fire & Water)</span>
                    <span className="text-orange-800">{results.pitta}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${results.pitta}%` }}></div>
                  </div>
                </div>

                {/* Kapha */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-green-700">Kapha (Earth & Water)</span>
                    <span className="text-green-800">{results.kapha}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${results.kapha}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Discard
                </button>
                <button
                  onClick={() => onApplyDosha(results.dominant)}
                  className="px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Apply to Patient File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Patient Case File Detail Modal Component
function PatientCaseFileModal({ patient, isOpen, onClose }) {
  if (!isOpen || !patient) return null;

  const dosha = patient.primary_dosha;
  const doshaInfo = DOSHA_DETAILS[dosha] || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-200" />
            Patient Case File Details
          </h3>
          <button onClick={onClose} className="text-green-100 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Patient Card Grid */}
          <div className="bg-green-50 bg-opacity-50 p-5 border border-green-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block">Registration No</span>
              <span className="text-sm font-bold text-gray-900">{patient.regno}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block">Patient Name</span>
              <span className="text-sm font-bold text-gray-900">{patient.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block">Age / Phone</span>
              <span className="text-sm font-bold text-gray-900">{patient.age} Yrs / {patient.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block">Registration Date</span>
              <span className="text-sm font-bold text-gray-900">
                {patient.created_at || patient.date
                  ? new Date(patient.created_at || patient.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Address */}
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase block mb-1">Address</span>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 border border-gray-100 italic">
              {patient.address || "No address provided."}
            </p>
          </div>

          {/* Ayurvedic Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block mb-2">Dominant Dosha (Prakriti)</span>
              {dosha ? (
                <div className="space-y-3">
                  <div className="inline-block px-3 py-1 text-xs font-bold rounded-full border" style={{
                    backgroundColor: dosha === 'Vata' ? '#ecfeff' : dosha === 'Pitta' ? '#fff7ed' : dosha === 'Kapha' ? '#f0fdf4' : '#faf5ff',
                    color: dosha === 'Vata' ? '#0891b2' : dosha === 'Pitta' ? '#ea580c' : dosha === 'Kapha' ? '#16a34a' : '#9333ea',
                    borderColor: dosha === 'Vata' ? '#c5f2f7' : dosha === 'Pitta' ? '#ffedd5' : dosha === 'Kapha' ? '#dcfce7' : '#f3e8ff',
                  }}>
                    {dosha} Constitution
                  </div>
                  {doshaInfo && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-bold">Element representation: {doshaInfo.elements}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{doshaInfo.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 border border-dashed rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <span>No primary Dosha constitution has been analyzed for this patient.</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase block mb-2">Clinical Diagnostics</span>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-400 font-bold block mb-1">Chief Complaint:</span>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 border rounded-lg min-h-[4rem]">
                    {patient.chief_complaint || "No chief complaints recorded."}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold block mb-1">Prescribed Treatments & Herbs:</span>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 border rounded-lg min-h-[4rem]">
                    {patient.treatments || "No prescribed treatments or herbs."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dosha-Specific Diet & Lifestyle Guidance */}
          {doshaInfo && (
            <div className="pt-6 border-t border-gray-100 bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
              <h4 className="text-base font-bold text-green-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-700 animate-pulse" />
                Personalized {dosha} Diet & Lifestyle Guide
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-xs text-green-900 font-bold uppercase tracking-wider mb-2 border-b border-green-200 pb-1">Recommended Diet</h5>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                    {doshaInfo.diet.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs text-green-900 font-bold uppercase tracking-wider mb-2 border-b border-green-200 pb-1">Recommended Lifestyle</h5>
                  <ul className="space-y-1.5 text-xs text-gray-700 list-disc pl-4">
                    {doshaInfo.lifestyle.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-green-200 text-xs text-green-800 flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                <span><strong>Recommended Classic Herbs:</strong> {doshaInfo.herbs}</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
}

// Ayurvedic Wisdom Directory View Component
function WisdomDirectory() {
  const [activeTab, setActiveTab] = useState('herbs'); // 'herbs' | 'treatments' | 'dinacharya'
  const [herbSearch, setHerbSearch] = useState('');
  const [doshaFilter, setDoshaFilter] = useState('all'); // 'all' | 'vata' | 'pitta' | 'kapha'

  const filteredHerbs = HERBS_DATA.filter(herb => {
    const matchesSearch = 
      herb.name.toLowerCase().includes(herbSearch.toLowerCase()) ||
      herb.sanskritName.toLowerCase().includes(herbSearch.toLowerCase()) ||
      herb.botanicalName.toLowerCase().includes(herbSearch.toLowerCase()) ||
      herb.benefits.toLowerCase().includes(herbSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (doshaFilter === 'all') return true;
    return herb.dosha.toLowerCase().includes(doshaFilter);
  });

  const renderTimelineIcon = (iconName) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-5 h-5 text-yellow-600" />;
      case 'Moon': return <Moon className="w-5 h-5 text-indigo-600" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-amber-700" />;
      case 'Sprout': return <Sprout className="w-5 h-5 text-green-600" />;
      case 'Activity': return <Activity className="w-5 h-5 text-cyan-600" />;
      case 'Compass': return <Compass className="w-5 h-5 text-blue-600" />;
      default: return <Check className="w-5 h-5 text-green-600" />;
    }
  };

  const getDoshaBadgeColor = (dosha) => {
    const d = dosha.toLowerCase();
    if (d.includes('vata') && d.includes('pitta')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('pitta') && d.includes('kapha')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('vata') && d.includes('kapha')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('vata, pitta, and kapha')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (d.includes('vata')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (d.includes('pitta')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (d.includes('kapha')) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Ayurvedic Wisdom Directory</h2>
          <p className="text-gray-500 text-sm mt-1">Explore classic herbs, standard Panchakarma treatments, and daily healthy routines.</p>
        </div>
        <div className="flex bg-gray-100 p-1 border rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveTab('herbs')}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'herbs'
                ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Herb Encyclopedia
          </button>
          <button
            onClick={() => setActiveTab('treatments')}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'treatments'
                ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Treatments & Therapies
          </button>
          <button
            onClick={() => setActiveTab('dinacharya')}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'dinacharya'
                ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Daily Routine (Dinacharya)
          </button>
        </div>
      </div>

      {/* Encyclopedia Tab */}
      {activeTab === 'herbs' && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-5 border border-gray-100 justify-between items-start md:items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={herbSearch}
                onChange={(e) => setHerbSearch(e.target.value)}
                placeholder="Search herbs by name, benefits..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent w-full bg-white text-sm"
              />
              {herbSearch && (
                <button
                  onClick={() => setHerbSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dosha Filter Chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filter by:</span>
              <button
                onClick={() => setDoshaFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  doshaFilter === 'all'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
              >
                All Doshas
              </button>
              <button
                onClick={() => setDoshaFilter('vata')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  doshaFilter === 'vata'
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-cyan-600 hover:bg-cyan-50 border-cyan-200'
                }`}
              >
                Vata Pacifying
              </button>
              <button
                onClick={() => setDoshaFilter('pitta')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  doshaFilter === 'pitta'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-orange-600 hover:bg-orange-50 border-orange-200'
                }`}
              >
                Pitta Pacifying
              </button>
              <button
                onClick={() => setDoshaFilter('kapha')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  doshaFilter === 'kapha'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-600 hover:bg-green-50 border-green-200'
                }`}
              >
                Kapha Pacifying
              </button>
            </div>
          </div>

          {/* Herb Grid */}
          {filteredHerbs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredHerbs.map((herb, idx) => (
                <div key={idx} className="bg-white border border-gray-100 p-6 flex flex-col justify-between wisdom-card shadow-sm group">
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{herb.name}</h3>
                        <span className="text-xs text-gray-500 italic block mt-0.5">Bot: {herb.botanicalName}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-green-600 group-hover:rotate-12 transition-transform" />
                      </div>
                    </div>

                    {/* Dosha Badge */}
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${getDoshaBadgeColor(herb.dosha)}`}>
                      {herb.dosha}
                    </span>

                    {/* Benefits */}
                    <p className="text-xs text-gray-600 leading-relaxed min-h-[4rem]">{herb.benefits}</p>
                  </div>

                  {/* Usage */}
                  <div className="border-t border-gray-100 pt-4 mt-4 text-xs text-gray-500 bg-gray-50 p-2.5 rounded italic font-medium">
                    <strong className="text-green-700">Usage: </strong>{herb.usage}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white text-center py-12 border">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-1">No Herbs Found</h4>
              <p className="text-gray-500 text-sm">No herbs match your search query "{herbSearch}".</p>
            </div>
          )}
        </div>
      )}

      {/* Treatments Tab */}
      {activeTab === 'treatments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {TREATMENTS_DATA.map((treatment, idx) => (
            <div key={idx} className="bg-white border border-gray-100 p-6 flex flex-col justify-between wisdom-card shadow-sm group">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{treatment.name}</h3>
                    <span className="text-xs text-gray-500 italic block mt-0.5">Sanskrit: {treatment.sanskritName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold bg-gray-100 px-2 py-1 border">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{treatment.duration}</span>
                  </div>
                </div>

                {/* Dosha Target */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border ${getDoshaBadgeColor(treatment.dosha)}`}>
                    {treatment.dosha}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">{treatment.description}</p>
              </div>

              {/* Benefits */}
              <div className="border-t border-gray-100 pt-4 mt-6">
                <span className="text-xs font-bold text-green-800 uppercase block mb-1">Clinical Benefits:</span>
                <p className="text-xs text-gray-600 leading-relaxed">{treatment.benefits}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dinacharya Tab */}
      {activeTab === 'dinacharya' && (
        <div className="bg-white p-6 md:p-8 border border-gray-100 animate-fade-in max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600 animate-spin" style={{ animationDuration: '6s' }} />
            The Classical Dinacharya (Daily Routine Planner)
          </h3>
          
          <div className="space-y-6 relative before:absolute before:left-[1.65rem] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {DINACHARYA_DATA.map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start relative group">
                {/* Timeline Marker Dot */}
                <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center relative z-10 shrink-0 group-hover:scale-110 transition-transform shadow-sm group-hover:border-green-500">
                  {renderTimelineIcon(item.icon)}
                </div>
                {/* Info */}
                <div className="space-y-1 bg-gray-50 p-4 border rounded-lg flex-1 group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-green-800 transition-colors">{item.title}</h4>
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200 select-none self-start sm:self-auto">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // UI state
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Custom Ayurvedic UI states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);
  const [quizTargetForm, setQuizTargetForm] = useState('new'); // 'new' or 'edit'

  // Data state
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    regno: '',
    name: '',
    address: '',
    phone: '',
    age: '',
    primary_dosha: '',
    chief_complaint: '',
    treatments: ''
  });

  // Auth check on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const result = await api.checkAuth();

        if (result.success && result.authenticated) {
          setIsAuthenticated(true);
          setCurrentUser(result.admin);
        } else {
          // Try one more time with token refresh
          const refreshed = await api.refreshToken();
          if (refreshed) {
            const retryResult = await api.checkAuth();
            if (retryResult.success && retryResult.authenticated) {
              setIsAuthenticated(true);
              setCurrentUser(retryResult.admin);
            } else {
              setIsAuthenticated(false);
              setCurrentUser(null);
            }
          } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Load data when authenticated  
  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
      loadDashboardStats();
    }
  }, [isAuthenticated]);

  // Add this useEffect for periodic token refresh
  useEffect(() => {
    let refreshInterval;
    
    if (isAuthenticated) {
      // Refresh token every 6 hours (before 7-day expiration)
      refreshInterval = setInterval(async () => {
        const refreshed = await api.refreshToken();
        if (!refreshed) {
          console.log('Token refresh failed, logging out...');
          handleLogout();
        }
      }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated]);

  // ADD THE HANDLEEXPORTCSV FUNCTION HERE
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      setError(null);

      const patientsData = await api.exportPatients();

      if (patientsData.length === 0) {
        setError('No patients to export');
        return;
      }

      // Create CSV content
      const headers = ['Registration No', 'Name', 'Address', 'Phone', 'Age', 'Date', 'Primary Dosha', 'Chief Complaint', 'Treatments'];
      const csvContent = [
        headers.join(','),
        ...patientsData.map(patient => {
          const formatCSVField = (field) => {
            if (!field) return '""';
            const stringField = String(field);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
              return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
          };

          return [
            formatCSVField(patient.regno),
            formatCSVField(patient.name),
            formatCSVField(patient.address || ''),
            formatCSVField(patient.phone || ''),
            formatCSVField(patient.age),
            formatCSVField(formatDate(patient.created_at || patient.date)),
            formatCSVField(patient.primary_dosha || ''),
            formatCSVField(patient.chief_complaint || ''),
            formatCSVField(patient.treatments || '')
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Stantonys_patients_${currentDate}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess(`Patient data exported successfully! (${patientsData.length} records)`);

    } catch (err) {
      console.error('Export error:', err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const result = await api.getPatients(page, 50, search);
      
      if (result && result.data) {
        setPatients(result.data);
        setCurrentPage(result.pagination?.page || 1);
        setTotalPages(result.pagination?.total_pages || 1);
        setTotalCount(result.pagination?.total_count || 0);
        setSearchQuery(search);
      } else {
        setPatients([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalCount(0);
      }
      
    } catch (err) {
      console.error('Load patients error:', err);
      setPatients([]);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response || {});
    } catch (err) {
      console.error('Load stats error:', err);
      handleApiError(err);
    }
  };

  // Search handler
  const handleGlobalSearch = async (query) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setSearchMode(false);
      setSearchQuery('');
      loadPatients(1, '');
      return;
    }

    setSearchMode(true);
    setSearchQuery(trimmedQuery);

    try {
      const result = await api.getPatients(1, 100, trimmedQuery);
      setPatients(result.data || []);
      setCurrentPage(1);
      setTotalPages(result.pagination?.total_pages || 1);
      setTotalCount(result.pagination?.total_count || 0);
    } catch (error) {
      console.error('Search error:', error);
      setPatients([]);
      setError('Search failed. Please try again.');
    }
  };

  // Handle search input with debouncing
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleGlobalSearch(query);
    }, 500);
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      
      if (searchMode && searchQuery) {
        loadSearchPage(newPage);
      } else {
        loadPatients(newPage, '');
      }
    }
  };

  const loadSearchPage = async (page) => {
    try {
      const result = await api.getPatients(page, 50, searchQuery);
      setPatients(result.data || []);
      setCurrentPage(result.pagination?.page || page);
      setTotalPages(result.pagination?.total_pages || 1);
      setTotalCount(result.pagination?.total_count || 0);
    } catch (error) {
      console.error('Load search page error:', error);
      setError('Failed to load search results');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchMode(false);
    setSearchQuery('');
    loadPatients(1, '');
  };

  // Form handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreatePatient = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.createPatient(formData);

      if (result.success) {
        showSuccess('Patient registered successfully!');
        setFormData({ regno: '', name: '', address: '', phone: '', age: '', primary_dosha: '', chief_complaint: '', treatments: '' });
        await loadPatients();
        await loadDashboardStats();
      } else {
        setError(result.error || 'Failed to create patient');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      regno: patient.regno,
      name: patient.name,
      address: patient.address || '',
      phone: patient.phone || '',
      age: patient.age,
      primary_dosha: patient.primary_dosha || '',
      chief_complaint: patient.chief_complaint || '',
      treatments: patient.treatments || ''
    });
    setCurrentView('edit');
  };

  const handleUpdatePatient = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.updatePatient(selectedPatient.regno, formData);

      if (result.success) {
        showSuccess('Patient updated successfully!');
        await loadPatients();
        setSelectedPatient(null);
        setCurrentView('current');
      } else {
        setError(result.error || 'Failed to update patient');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const result = await api.deletePatient(patientToDelete.regno);

      if (result.success) {
        showSuccess('Patient deleted successfully!');
        await loadPatients();
        await loadDashboardStats();
      } else {
        setError(result.error || 'Failed to delete patient');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setPatientToDelete(null);
    }
  };

  const handleChangePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.changePassword(passwordData);

      if (result.success) {
        showSuccess('Password changed successfully!');
        setShowChangePassword(false);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView('dashboard');
      setPatients([]);
      setStats({});
    } catch (err) {
      console.error('Logout error:', err);
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.login(credentials);

      if (result.success) {
        setIsAuthenticated(true);
        setCurrentUser(result.admin);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error) => {
    if (error.message?.includes('Authentication expired')) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setError('Your session has expired. Please login again.');
    } else {
      setError(error.message || 'An error occurred');
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Get latest registration number
  const getLatestRegno = () => {
    if (patients.length === 0) return 'No registrations yet';
    const sortedByDate = [...patients].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at);
      const dateB = new Date(b.date || b.created_at);
      return dateB - dateA;
    });
    return sortedByDate[0]?.regno || 'No registrations yet';
  };

  const getLatestPatient = () => {
    if (patients.length === 0) return null;
    const sortedByDate = [...patients].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at);
      const dateB = new Date(b.date || b.created_at);
      return dateB - dateA;
    });
    return sortedByDate[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getDoshaBadgeClass = (dosha) => {
    if (!dosha) return 'badge-dosha-none';
    const d = dosha.toLowerCase();
    if (d.includes('vata') && d.includes('pitta')) return 'badge-dosha-mixed';
    if (d.includes('pitta') && d.includes('kapha')) return 'badge-dosha-mixed';
    if (d.includes('vata') && d.includes('kapha')) return 'badge-dosha-mixed';
    if (d.includes('tridoshic')) return 'badge-dosha-mixed';
    if (d.includes('vata')) return 'badge-dosha-vata';
    if (d.includes('pitta')) return 'badge-dosha-pitta';
    if (d.includes('kapha')) return 'badge-dosha-kapha';
    return 'badge-dosha-none';
  };

  // Show loading screen
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} loading={loading} error={error} />;
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-green-600">
          <div className="w-8 h-8 mr-3 flex items-center justify-center">
            <img 
              src={clinicLogo} 
              alt="St Antony's Ayurvedic Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Leaf className="w-8 h-8 text-white hidden" />
          </div>
          <h1 className="text-white text-lg font-bold">St Antony's Ayurvedics</h1>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${currentView === 'dashboard'
                ? 'bg-green-50 text-green-600 border-r-2 border-green-600'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Home className="w-5 h-5 mr-3" />
              Dashboard
            </button>

            <button
              onClick={() => {
                setCurrentView('new');
                setFormData({ regno: '', name: '', address: '', phone: '', age: '', primary_dosha: '', chief_complaint: '', treatments: '' });
                setError(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${currentView === 'new'
                ? 'bg-green-50 text-green-600 border-r-2 border-green-600'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Plus className="w-5 h-5 mr-3" />
              New Registration
            </button>

            <button
              onClick={() => {
                setCurrentView('current');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${currentView === 'current'
                ? 'bg-green-50 text-green-600 border-r-2 border-green-600'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Patient Records
            </button>

            <button
              onClick={() => {
                setCurrentView('wisdom');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${currentView === 'wisdom'
                ? 'bg-green-50 text-green-600 border-r-2 border-green-600'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Ayurvedic Wisdom
            </button>

            {/* Add Export CSV button */}
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-3" />
              {loading ? 'Exporting...' : 'Export as CSV'}
            </button>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-green-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{currentUser?.username}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Mobile layout - show clinic name only when sidebar is closed */}
            {!sidebarOpen && (
              <div className="lg:hidden flex flex-col">
                <h1 className="text-lg font-bold text-green-600">St Antony's Ayurvedics</h1>
                <span className="text-gray-600 text-xs font-bold">
                  Welcome, {currentUser?.username}
                </span>
              </div>
            )}
            
            {/* Tablet/Desktop - only welcome message */}
            <div className="hidden lg:block">
              <span className="text-gray-600 text-sm font-bold">
                Welcome back, {currentUser?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="px-4 pt-4">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center mb-4">
              <span className="flex-1">{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 px-4 py-4">
          
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

              {/* Ayurvedic Welcome Banner */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-green-500">
                {/* Decorative SVG Leaves background */}
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
                  <Leaf className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="w-5 h-5 text-green-200 animate-bounce" />
                    <span className="text-xs font-semibold tracking-wider uppercase text-green-100">Ayurvedic Wisdom of the Day</span>
                  </div>
                  <p className="text-base sm:text-lg italic font-medium">
                    "{getDailyTip()}"
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2 bg-white bg-opacity-10 px-4 py-2 text-sm border border-white border-opacity-20 backdrop-blur-sm self-start md:self-center">
                  <Leaf className="w-4 h-4 text-green-200 animate-pulse" />
                  <span className="font-medium">Nurturing Health Naturally</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Patients</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_patients || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Registrations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today_registrations || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.month_registrations || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                      <Sprout className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Latest Registration</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{getLatestRegno()}</p>
                      {getLatestPatient() && (
                        <p className="text-xs text-gray-500 mt-1">
                          {getLatestPatient().name} - {formatDate(getLatestPatient().date || getLatestPatient().created_at)}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-orange-100 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">Recent Patients</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-50 sticky top-0 z-10 border-b border-green-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Reg No</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {(stats.latest_patients && stats.latest_patients.length > 0) ? (
                        stats.latest_patients.map((patient) => (
                          <tr key={patient.regno} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.regno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.age}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                              {formatDate(patient.created_at || patient.date)}
                            </td>
                          </tr>
                        ))
                      ) : patients.length > 0 ? (
                        patients.slice(0, 5).map((patient) => (
                          <tr key={patient.regno} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.regno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">{patient.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">{patient.age}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                              {formatDate(patient.created_at || patient.date)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No patients registered yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* New Registration Form */}
          {currentView === 'new' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">New Patient Registration</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                      <input
                        type="text"
                        name="regno"
                        value={formData.regno}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="e.g., REG001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="Patient name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="Age"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="10 digit phone number (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      placeholder="Full address (optional)"
                    />
                  </div>

                  {/* Ayurvedic Diagnostics Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600 animate-pulse" />
                      Ayurvedic Diagnostics (Optional)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Dosha</label>
                        <div className="flex gap-2">
                          <select
                            name="primary_dosha"
                            value={formData.primary_dosha}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select Dosha (Unknown / Untested)</option>
                            <option value="Vata">Vata (Air & Ether)</option>
                            <option value="Pitta">Pitta (Fire & Water)</option>
                            <option value="Kapha">Kapha (Earth & Water)</option>
                            <option value="Vata-Pitta">Vata-Pitta (Dual)</option>
                            <option value="Pitta-Kapha">Pitta-Kapha (Dual)</option>
                            <option value="Vata-Kapha">Vata-Kapha (Dual)</option>
                            <option value="Tridoshic">Tridoshic (Balanced Vata-Pitta-Kapha)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setQuizTargetForm('new');
                              setShowQuizModal(true);
                            }}
                            className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors font-medium flex items-center gap-1 whitespace-nowrap"
                          >
                            <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
                            Analyze Dosha
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
                        <input
                          type="text"
                          name="chief_complaint"
                          value={formData.chief_complaint}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          placeholder="e.g., Joint pain, insomnia, hyperacidity"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prescribed Treatments & Herbs</label>
                      <textarea
                        name="treatments"
                        value={formData.treatments}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="e.g., Shirodhara with Ashwagandha oil, Triphala churnam before bed"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePatient}
                      disabled={!formData.name || !formData.age || !formData.regno || loading}
                      className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Register Patient
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patient Records View */}
          {currentView === 'current' && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Patient Records</h2>
                  {searchMode && (
                    <p className="text-sm text-green-600 mt-1">
                      Search results for "{searchQuery}" ({totalCount} found)
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchInput}
                    placeholder="Search: name, phone, or reg no..."
                    className="pl-10 pr-12 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-96 bg-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table container with sharp corners */}
              <div className="flex-1 bg-white shadow-sm border border-gray-100 flex flex-col max-h-[calc(100vh-200px)]">
                <div className="flex-1 overflow-auto min-h-[500px]">
                  <table className="w-full">
                    <thead className="bg-green-50 sticky top-0 z-10 border-b border-green-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Reg No</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Dosha</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-green-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {patients.length > 0 ? (
                        patients.map((patient) => (
                          <tr key={patient.regno} className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-900">{patient.regno}</td>
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-900">{patient.name}</td>
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs">
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getDoshaBadgeClass(patient.primary_dosha)}`}>
                                {patient.primary_dosha || 'Not Set'}
                              </span>
                            </td>
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.address || 'N/A'}</td>
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.phone || 'N/A'}</td>
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{patient.age}</td>
                            <td onClick={() => setViewingPatient(patient)} className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{formatDate(patient.date || patient.created_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setViewingPatient(patient)}
                                  className="inline-flex items-center px-3 py-2 text-green-600 hover:bg-green-50 transition-colors"
                                  title="View Case File"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(patient)}
                                  className="inline-flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit Patient"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setPatientToDelete(patient);
                                    setShowDeleteModal(true);
                                  }}
                                  className="inline-flex items-center px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Patient"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <Users className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-lg font-medium text-gray-900">
                                {searchMode ? 'No search results found' : 'No patients found'}
                              </p>
                              <p className="text-gray-500">
                                {searchMode 
                                  ? `No patients match "${searchQuery}"`
                                  : 'No patients registered yet'
                                }
                              </p>
                              {searchMode && (
                                <button
                                  onClick={clearSearch}
                                  className="mt-3 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                  Clear Search
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination with sharp corners */}
                {totalPages > 1 && (
                  <div className="border-t bg-white px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} patients
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          First
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {(() => {
                            const pages = [];
                            const start = Math.max(1, currentPage - 2);
                            const end = Math.min(totalPages, currentPage + 2);
                            
                            for (let i = start; i <= end; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => handlePageChange(i)}
                                  className={`px-3 py-2 text-sm transition-colors ${
                                    i === currentPage
                                      ? 'bg-green-600 text-white'
                                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            return pages;
                          })()}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Patient Form */}
          {currentView === 'edit' && selectedPatient && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Patient - {selectedPatient.regno}</h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={formData.regno}
                        className="w-full px-4 py-3 border border-gray-300 bg-gray-50 cursor-not-allowed"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Registration number cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    />
                  </div>

                  {/* Ayurvedic Diagnostics Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600 animate-pulse" />
                      Ayurvedic Diagnostics (Optional)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Dosha</label>
                        <div className="flex gap-2">
                          <select
                            name="primary_dosha"
                            value={formData.primary_dosha}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select Dosha (Unknown / Untested)</option>
                            <option value="Vata">Vata (Air & Ether)</option>
                            <option value="Pitta">Pitta (Fire & Water)</option>
                            <option value="Kapha">Kapha (Earth & Water)</option>
                            <option value="Vata-Pitta">Vata-Pitta (Dual)</option>
                            <option value="Pitta-Kapha">Pitta-Kapha (Dual)</option>
                            <option value="Vata-Kapha">Vata-Kapha (Dual)</option>
                            <option value="Tridoshic">Tridoshic (Balanced Vata-Pitta-Kapha)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setQuizTargetForm('edit');
                              setShowQuizModal(true);
                            }}
                            className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors font-medium flex items-center gap-1 whitespace-nowrap"
                          >
                            <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
                            Analyze Dosha
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
                        <input
                          type="text"
                          name="chief_complaint"
                          value={formData.chief_complaint}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          placeholder="e.g., Joint pain, insomnia, hyperacidity"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prescribed Treatments & Herbs</label>
                      <textarea
                        name="treatments"
                        value={formData.treatments}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="e.g., Shirodhara with Ashwagandha oil, Triphala churnam before bed"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setCurrentView('current');
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdatePatient}
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wisdom Directory View */}
          {currentView === 'wisdom' && (
            <WisdomDirectory />
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && patientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Patient</h3>
                <p className="text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{patientToDelete.name}</strong> ({patientToDelete.regno})?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPatientToDelete(null);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
        loading={loading}
      />

      {/* Prakriti Quiz Modal */}
      <PrakritiQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onApplyDosha={(dominantDosha) => {
          setFormData({ ...formData, primary_dosha: dominantDosha });
          setShowQuizModal(false);
          showSuccess(`Applied ${dominantDosha} Dosha to patient form!`);
        }}
      />

      {/* Patient Case File Modal */}
      <PatientCaseFileModal
        patient={viewingPatient}
        isOpen={viewingPatient !== null}
        onClose={() => setViewingPatient(null)}
      />
    </div>
  );
}

export default App;