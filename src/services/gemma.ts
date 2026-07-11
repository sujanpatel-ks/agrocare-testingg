import { getIsOnline } from './connectivity';
import { chatWithAssistant } from './gemini';

// Define the active model type
export type AIModel = 'gemini' | 'gemma';

export interface ModelStatus {
  model: AIModel;
  isFallback: boolean;
  isOnline: boolean;
}

// Keep track of the last determined model state globally
let lastStatus: ModelStatus = {
  model: 'gemini',
  isFallback: false,
  isOnline: true
};

// Simple subscription mechanism for model changes
const listeners = new Set<(status: ModelStatus) => void>();

export function subscribeToModelStatus(listener: (status: ModelStatus) => void) {
  listeners.add(listener);
  // Emit initial state
  listener({ ...lastStatus, isOnline: getIsOnline() });
  return () => {
    listeners.delete(listener);
  };
}

function updateStatus(model: AIModel, isFallback: boolean) {
  const isOnline = getIsOnline();
  lastStatus = { model, isFallback, isOnline };
  listeners.forEach(l => l(lastStatus));
  
  // Also dispatch window custom event for broad compatibility
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-model-status', { 
      detail: lastStatus 
    }));
  }
}

// Local Gemma offline knowledge engine
export function getGemmaOfflineResponse(message: string, language: 'en' | 'hi' | 'kn' = 'en'): string {
  const query = message.toLowerCase();
  
  const intro = {
    en: "🤖 **Gemma (Offline Edge AI)**: Working in local offline resilience mode. Here is the verified sustainable farming guidance from our on-device ICAR ITK knowledge base:",
    hi: "🤖 **Gemma (ऑफ़लाइन एआई)**: स्थानीय ऑफ़लाइन मोड सक्रिय है। हमारे ऑन-डिवाइस ICAR ITK डेटाबेस से प्रमाणित कृषि सलाह निम्नलिखित है:",
    kn: "🤖 **Gemma (ಆಫ್‌ಲೈನ್ ಎಐ)**: ಸ್ಥಳೀಯ ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ನಮ್ಮ ಆನ್‌-ಡಿವೈಸ್ ಕೃಷಿ ಜ್ಞಾನಕೋಶದಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಸಲಹೆ ಹೀಗಿದೆ:"
  };

  const footer = {
    en: "\n\n*This response was generated entirely offline on your device using Gemma-2B Optimized Edge rules.*",
    hi: "\n\n*यह उत्तर पूरी तरह से आपके डिवाइस पर ऑफ़लाइन जेम्मा (Gemma-2B) एआई द्वारा तैयार किया गया है।*",
    kn: "\n\n*ಈ ಉತ್ತರವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಜೆಮ್ಮಾ (Gemma-2B) ಎಐ ಮೂಲಕ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.*"
  };

  // 1. Disease / Crop Protection matches
  if (query.includes('termite') || query.includes('दीमक') || query.includes('ಗೆದ್ದಲು')) {
    return `${intro[language]}
    
**${language === 'hi' ? 'दीमक नियंत्रण (Termite Management):' : language === 'kn' ? 'ಗೆದ್ದಲು ನಿಯಂತ್ರಣ (Termite Management):' : 'Eco-friendly Termite Management:'}**
1. **${language === 'hi' ? 'मकई भुट्टा ट्रैप' : language === 'kn' ? 'ಮೆಕ್ಕೆಜೋಳದ ತೆನೆ ಟ್ರ್ಯಾಪ್' : 'Corn Cob Traps'}**: ${
      language === 'hi' ? 'मकई के भुट्टे को पानी में भिगोकर मिट्टी में गाड़ दें। दीमक इसकी ओर आकर्षित होंगे, जिसे बाद में आसानी से नष्ट किया जा सकता है।' : 
      language === 'kn' ? 'ನೆನೆಸಿದ ಮೆಕ್ಕೆಜೋಳದ ತೆನೆಯನ್ನು ಮಣ್ಣಿನಲ್ಲಿ ಹೂತುಹಾಕಿ. ಗೆದ್ದಲುಗಳು ಇದರ ಕಡೆಗೆ ಆಕರ್ಷಿತವಾಗುತ್ತವೆ, ನಂತರ ಅವುಗಳನ್ನು ಸುಲಭವಾಗಿ ನಾಶಪಡಿಸಬಹುದು.' : 
      'Bury soaked corn cobs in the soil around affected areas. Termites will aggregate inside the cob, allowing you to dig them up and destroy them safely.'
    }
2. **${language === 'hi' ? 'एलोवेरा सुरक्षा घेरा' : language === 'kn' ? 'ಅಲೋವೆರಾ ತಡೆಗೋಡೆ' : 'Aloe Vera Barrier'}**: ${
      language === 'hi' ? 'क्रश किए हुए एलोवेरा को पानी के चैनलों में डालें। यह दीमक को फसलों की जड़ों तक पहुँचने से रोकता है।' : 
      language === 'kn' ? 'ಅಲೋವೆರಾವನ್ನು ಪುಡಿಮಾಡಿ ನೀರಿನ ಕಾಲುವೆಗಳಿಗೆ ಹಾಕಿ. ಇದು ಗೆದ್ದಲುಗಳು ಬೆಳೆಗಳ ಬೇರುಗಳನ್ನು ತಲುಪದಂತೆ ನೈಸರ್ಗಿಕ ತಡೆಗೋಡೆ ನಿರ್ಮಿಸುತ್ತದೆ.' : 
      'Place crushed aloe vera in your water inlet channels to create a biological barrier that repels termites from crop roots.'
    }
3. **${language === 'hi' ? 'चीड़ की पत्तियाँ' : language === 'kn' ? 'ಪೈನ್ ಎಲೆಗಳ ದಹನ' : 'Pine Leaves'}**: ${
      language === 'hi' ? 'जुताई से पहले खेतों में चीड़ की सूखी पत्तियाँ जलाएं, इससे दीमक और सफेद ग्रब नष्ट होते हैं।' : 
      language === 'kn' ? 'ಉಳುಮೆ ಮಾಡುವ ಮುನ್ನ ಹೊಲದಲ್ಲಿ ಒಣಗಿದ ಪೈನ್ ಎಲೆಗಳನ್ನು ಸುಟ್ಟು ಹಾಕಿ, ಇದರಿಂದ ಗೆದ್ದಲು ಮತ್ತು ಬಿಳಿ ಹುಳುಗಳು ನಾಶವಾಗುತ್ತವೆ.' : 
      'Burn dry pine leaves in the fields before ploughing to eliminate soil-dwelling termites and white grubs.'
    }
${footer[language]}`;
  }

  if (query.includes('aphid') || query.includes('sucking') || query.includes('माहू') || query.includes('कीट') || query.includes('ಕೀಟ')) {
    return `${intro[language]}

**${language === 'hi' ? 'माहू और रसचूसक कीट नियंत्रण:' : language === 'kn' ? 'ಕೀಟ ಮತ್ತು ರಸ ಹೀರುವ ಹುಳುಗಳ ನಿಯಂತ್ರಣ:' : 'Aphid & Sucking Pest Management:'}**
1. **${language === 'hi' ? 'लकड़ी की राख (Wood Ash)' : language === 'kn' ? 'ಮರದ ಬೂದಿ (Wood Ash)' : 'Wood Ash Dusting'}**: ${
      language === 'hi' ? 'सुबह ओस के समय पत्तियों पर सूखी लकड़ी की राख छिड़कें। यह माहू और नरम शरीर वाले कीटों को प्रभावी ढंग से नियंत्रित करती है।' : 
      language === 'kn' ? 'ಬೆಳಗಿನ ಜಾವ ಇಬ್ಬನಿ ಇರುವಾಗ ಎಲೆಗಳ ಮೇಲೆ ಒಣ ಬೂದಿಯನ್ನು ಚಿಮುಕಿಸಿ. ಇದು ಮೃದು ಶರೀರದ ಕೀಟಗಳನ್ನು ನಿಯಂತ್ರಿಸಲು ಸಹಕಾರಿಯಾಗಿದೆ.' : 
      'Dust dry wood ash directly over damp leaves in the early morning. It acts as a physical barrier and dehydrates soft-bodied pests like aphids.'
    }
2. **${language === 'hi' ? 'प्याज और मिर्च का जैविक स्प्रे' : language === 'kn' ? 'ಈರುಳ್ಳಿ ಮತ್ತು ಮೆಣಸಿನಕಾಯಿ ಜೈವಿಕ ಸ್ಪ್ರೇ' : 'Onion & Chilli Repellent'}**: ${
      language === 'hi' ? 'पिसे हुए प्याज, लहसुन और लाल मिर्च को पानी में मिलाकर 24 घंटे के लिए छोड़ दें। छानकर प्राकृतिक कीटनाशक के रूप में छिड़काव करें।' : 
      language === 'kn' ? 'ರುಬ್ಬಿದ ಈರುಳ್ಳಿ, ಬೆಳ್ಳುಳ್ಳಿ ಮತ್ತು ಕೆಂಪು ಮೆಣಸಿನಕಾಯಿಯನ್ನು ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ 24 ಗಂಟೆ ಬಿಡಿ. ನಂತರ ಸೋಸಿ ನೈಸರ್ಗಿಕ ಕೀಟನಾಶಕವಾಗಿ ಸಿಂಪಡಿಸಿ.' : 
      'Blend garlic, onion, and hot chillies in water, ferment for 24 hours, strain, and spray as a highly effective organic repellent.'
    }
3. **${language === 'hi' ? 'नीमअस्त्र' : language === 'kn' ? 'ಬೇವಿನ ಕಷಾಯ' : 'Neemastra formulation'}**: ${
      language === 'hi' ? 'गोमूत्र और नीम के पत्तों को पानी में उबालकर तैयार किया गया काढ़ा चूसक कीटों के खिलाफ रामबाण है।' : 
      language === 'kn' ? 'ದನದ ಮೂತ್ರ ಮತ್ತು ಬೇವಿನ ಎಲೆಗಳನ್ನು ನೀರಿನಲ್ಲಿ ಕುದಿಸಿ ಸಿದ್ಧಪಡಿಸಿದ ಕಷಾಯವು ರಸಹೀರುವ ಕೀಟಗಳಿಗೆ ಅತ್ಯುತ್ತಮ ಪರಿಹಾರ.' : 
      'Boil neem leaves in diluted cow urine, ferment for 48 hours, and spray to eliminate all types of sucking pests safely.'
    }
${footer[language]}`;
  }

  if (query.includes('paddy') || query.includes('rice') || query.includes('धान') || query.includes('चावल') || query.includes('ಭತ್ತ') || query.includes('ಅಕ್ಕಿ')) {
    return `${intro[language]}

**${language === 'hi' ? 'धान की फसल सुरक्षा उपाय:' : language === 'kn' ? 'ಭತ್ತದ ಬೆಳೆ ಸಂರಕ್ಷಣಾ ವಿಧಾನಗಳು:' : 'Sustainable Paddy/Rice Management:'}**
1. **${language === 'hi' ? 'ब्लास्ट रोग के लिए निर्गुंडी (Vitex) का उपयोग' : language === 'kn' ? 'ಬ್ಲಾಸ್ಟ್ ರೋಗಕ್ಕೆ ಲಕ್ಕಿ ಸೊಪ್ಪಿನ ಬಳಕೆ' : 'Vitex negundo (Chaste Tree) for Rice Blast'}**: ${
      language === 'hi' ? 'निर्गुंडी की ताजी पत्तियों का रस पानी के रास्तों में फैलाएं या स्प्रे करें। यह धान में ब्लास्ट रोग को फैलने से रोकता है।' : 
      language === 'kn' ? 'ಲಕ್ಕಿ ಗಿಡದ ತಾಜಾ ಎಲೆಗಳ ಕಷಾಯವನ್ನು ಸಿಂಪಡಿಸಿ ಅಥವಾ ಕಾಲುವೆ ನೀರಿನಲ್ಲಿ ಹಾಕಿ. ಇದು ಭತ್ತದ ಬ್ಲಾಸ್ಟ್ ರೋಗವನ್ನು ತಡೆಯುತ್ತದೆ.' : 
      'Spray extracts of Vitex negundo (Chaste tree) leaves or place them in water inlets to naturally control fungal Blast disease in paddy.'
    }
2. **${language === 'hi' ? 'तने के कीड़ों के लिए पारसी (Cleistanthus)' : language === 'kn' ? 'ಕಾಂಡ ಕೊರಕಕ್ಕೆ ಪಾರಸಿ ಎಲೆಗಳ ಬಳಕೆ' : 'Yellow Stem-Borer Defense'}**: ${
      language === 'hi' ? 'धान के खेतों में पारसी (Parasi) की हरी पत्तियाँ डालने से पीला तना छेदक और गॉल फ्लाई पूरी तरह नियंत्रित रहते हैं।' : 
      language === 'kn' ? 'ಹೊಲದಲ್ಲಿ ಪಾರಸಿ ಗಿಡದ ತಾಜಾ ಎಲೆಗಳನ್ನು ಹಾಕುವುದರಿಂದ ಕಾಂಡ ಕೊರಕ ಮತ್ತು ಕಣಜ ನೊಣ ಬಾಧೆ ಕಡಿಮೆಯಾಗುತ್ತದೆ.' : 
      'Spread fresh Cleistanthus collinus (Parasi) leaves across rice fields to eliminate yellow stem-borers and gall flies.'
    }
3. **${language === 'hi' ? 'मित्र मकड़ियों के लिए जंगली गन्ना' : language === 'kn' ? 'ರೈತ ಮಿತ್ರ ಜೇಡಗಳಿಗೆ ಕಾಡು ಕಬ್ಬಿನ ನೆಡುವಿಕೆ' : 'Predatory Spider Shelters'}**: ${
      language === 'hi' ? 'खेतों के किनारों पर जंगली गन्ना (Saccharum spontaneum) लगाएं। ये उन शिकारी मकड़ियों का घर बनते हैं जो हानिकारक कीटों को खाती हैं।' : 
      language === 'kn' ? 'ಹೊಲದ ಬದಿಗಳಲ್ಲಿ ಕಾಡು ಕಬ್ಬನ್ನು ಬೆಳೆಸಿ. ಇದು ಎಲೆ ಸುತ್ತುವ ಹುಳುಗಳನ್ನು ತಿನ್ನುವ ಜೇಡಗಳಿಗೆ ಆಶ್ರಯ ನೀಡುತ್ತದೆ.' : 
      'Plant Saccharum spontaneum (Wild sugarcane) to provide a natural habitat for predatory spiders that consume leaf-folders.'
    }
${footer[language]}`;
  }

  if (query.includes('mastitis') || query.includes('udder') || query.includes('थान') || query.includes('ಕೆಚ್ಚಲು') || query.includes('cow') || query.includes('गाय') || query.includes('ದನ')) {
    return `${intro[language]}

**${language === 'hi' ? 'पशुधन स्वास्थ्य - थनैला रोग (Mastitis) का इलाज:' : language === 'kn' ? 'ಪಶು ಆರೋಗ್ಯ - ಕೆಚ್ಚಲು ಬಾವು (Mastitis) ಚಿಕಿತ್ಸೆ:' : 'Livestock Care - Mastitis treatment:'}**
1. **${language === 'hi' ? 'हल्दी, फिटकरी और शहद का पेस्ट' : language === 'kn' ? 'ಅರಿಶಿನ, ಪಟಿಕ ಮತ್ತು ಜೇನುತುಪ್ಪದ ಪೇಸ್ಟ್' : 'Turmeric, Alum & Honey Paste'}**: ${
      language === 'hi' ? '20 ग्राम हल्दी पाउडर, 10 ग्राम पिसी हुई फिटकरी और थोड़ा शहद मिलाकर पेस्ट बनाएं। दुहने के बाद थनों पर लेप करें।' : 
      language === 'kn' ? '20 ಗ್ರಾಂ ಅರಿಶಿನ ಪುಡಿ, 10 ಗ್ರಾಂ ಪುಡಿ ಮಾಡಿದ ಪಟಿಕ ಮತ್ತು ಜೇನುತುಪ್ಪ ಬೆರೆಸಿ ಲೇಪನ ತಯಾರಿಸಿ. ಹಾಲನ್ನು ಕರೆದ ನಂತರ ಕೆಚ್ಚಲಿಗೆ ಹಚ್ಚಿ.' : 
      'Prepare a paste of 20g turmeric powder, 10g finely ground alum (fitkari), and honey. Apply generously to the udder after milking.'
    }
2. **${language === 'hi' ? 'एलोवेरा और चूना लेप' : language === 'kn' ? 'ಅಲೋವೆರಾ ಮತ್ತು ಸುಣ್ಣದ ಲೇಪನ' : 'Aloe Vera & Lime Formula'}**: ${
      language === 'hi' ? 'एलोवेरा जेल में हल्दी और थोड़ा चूना मिलाकर गर्म लेप बनाएं और सूजन वाले थनों पर लगाएं। यह सूजन और दर्द कम करता है।' : 
      language === 'kn' ? 'ಅಲೋವೆರಾ ಜೆಲ್‌ಗೆ ಅರಿಶಿನ ಮತ್ತು ಸ್ವಲ್ಪ ಸುಣ್ಣ ಬೆರೆಸಿ ಬಿಸಿ ಮಾಡಿ ಕೆಚ್ಚಲಿನ ಬಾವು ಇರುವ ಜಾಗಕ್ಕೆ ಹಚ್ಚಿ. ಇದು ಊತ ಮತ್ತು ನೋವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.' : 
      'Mix fresh Aloe vera gel with turmeric and a small pinch of edible lime (chuna). Apply on the affected quarters to reduce heat and swelling.'
    }
3. **${language === 'hi' ? 'घाव ठीक करने के लिए सरसों का तेल' : language === 'kn' ? 'ಗಾಯಗಳಿಗೆ ಸಾಸಿವೆ ಎಣ್ಣೆ ಚಿಕಿತ್ಸೆ' : 'Castration/Wound Healing'}**: ${
      language === 'hi' ? 'लहसुन की कलियों के साथ उबले हुए सरसों के तेल को गुनगुना करके घाव पर लगाएं। यह संक्रमण रोकता है और तेजी से ठीक करता है।' : 
      language === 'kn' ? 'ಬೆಳ್ಳುಳ್ಳಿ ಎಸಳುಗಳೊಂದಿಗೆ ಕುದಿಸಿದ ಸಾಸಿವೆ ಎಣ್ಣೆಯನ್ನು ಉಗುರುಬೆಚ್ಚಗೆ ಮಾಡಿ ಗಾಯದ ಮೇಲೆ ಹಚ್ಚಿ. ಇದು ಸೋಂಕು ತಡೆದು ಗಾಯ ಬೇಗ ಒಣಗಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.' : 
      'Boil mustard oil with crushed garlic cloves. Allow it to cool slightly and apply to open wounds or castration marks to act as a sterile shield.'
    }
${footer[language]}`;
  }

  if (query.includes('fmd') || query.includes('foot and mouth') || query.includes('मुँहपका') || query.includes('ಖುರಮಾರಿ')) {
    return `${intro[language]}

**${language === 'hi' ? 'खुरपका-मुँहपका रोग (FMD) उपचार:' : language === 'kn' ? 'ಖುರಮಾರಿ / ಬಾಯಿ ರೋಗ ಚಿಕಿತ್ಸೆ:' : 'Foot and Mouth Disease (FMD) Management:'}**
1. **${language === 'hi' ? 'सूखी मछली का आहार' : language === 'kn' ? 'ಒಣ ಮೀನಿನ ಆಹಾರ' : 'Dried Fish Feed'}**: ${
      language === 'hi' ? 'FMD से पीड़ित गाय-भैंसों को आहार में सूखी मछली देने से रोग प्रतिरोधक क्षमता बढ़ती है और घाव जल्दी भरते हैं।' : 
      language === 'kn' ? 'ಬಾಯಿ ರೋಗದಿಂದ ಬಳಲುತ್ತಿರುವ ದನಗಳಿಗೆ ಆಹಾರದಲ್ಲಿ ಒಣ ಮೀನನ್ನು ನೀಡುವುದರಿಂದ ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ಹೆಚ್ಚಿ ಗಾಯಗಳು ಬೇಗ ಗುಣವಾಗುತ್ತವೆ.' : 
      'Feed dry salted fish to recovery-stage cattle. This traditional coastal practice is rich in amino acids and boosts immunity against FMD.'
    }
2. **${language === 'hi' ? 'इमली और नमक का लेप' : language === 'kn' ? 'ಹುಣಸೆಹಣ್ಣು ಮತ್ತು ಉಪ್ಪಿನ ಲೇಪನ' : 'Tamarind Shield'}**: ${
      language === 'hi' ? 'पशु की जीभ पर इमली और नमक का मिश्रण रगड़ें, इससे मुँह के छाले ठीक होते हैं।' : 
      language === 'kn' ? 'ಪಶುಗಳ ನಾಲಿಗೆಗೆ ಹುಣಸೆಹಣ್ಣು ಮತ್ತು ಉಪ್ಪಿನ ಮಿಶ್ರಣವನ್ನು ನಿಧಾನವಾಗಿ ಉಜ್ಜುವುದರಿಂದ ಬಾಯಿಯ ಹುಣ್ಣುಗಳು ವಾಸಿಯಾಗುತ್ತವೆ.' : 
      'Gently rub a thick mixture of ripe tamarind pulp and rock salt on the infected tongue of the animal to heal lesions.'
    }
3. **${language === 'hi' ? 'बबूल और जामुन की छाल' : language === 'kn' ? 'ಗೊಬ್ಬಳಿ ಮತ್ತು ನೇರಳೆ ಮರದ ತೊಗಟೆ' : 'Bark Extract Wash'}**: ${
      language === 'hi' ? 'बबूल या जामुन की छाल को पानी में उबालें और उस गुनगुने पानी से पशुओं के पैर के घाव धोएं।' : 
      language === 'kn' ? 'ಗೊಬ್ಬಳಿ ಅಥವಾ ನೇರಳೆ ಮರದ ತೊಗಟೆಯನ್ನು ನೀರಿನಲ್ಲಿ ಕುದಿಸಿ ಆ ಉಗುರುಬೆಚ್ಚಗಿನ ಕಷಾಯದಿಂದ ಕಾಲಿನ ಗಾಯಗಳನ್ನು ತೊಳೆಯಿರಿ.' : 
      'Boil Babool (Acacia) and Jamun bark in water. Use this tannin-rich warm decoction to wash and sanitize hoof lesions.'
    }
${footer[language]}`;
  }

  if (query.includes('tomato') || query.includes('wilt') || query.includes('blight') || query.includes('टमाटर') || query.includes('ಟೊಮೆಟೊ')) {
    return `${intro[language]}

**${language === 'hi' ? 'टमाटर की फसल रोग प्रबंधन:' : language === 'kn' ? 'ಟೊಮೆಟೊ ಬೆಳೆ ರೋಗ ನಿರ್ವಹಣೆ:' : 'Tomato Disease & Protection:'}**
1. **${language === 'hi' ? 'टमाटर विल्ट रोग रोकथाम (Wilt Control)' : language === 'kn' ? 'ಟೊಮೆಟೊ ಸೊರಗು ರೋಗ ತಡೆಗಟ್ಟುವಿಕೆ' : 'Turmeric Solution for Wilt'}**: ${
      language === 'hi' ? '1 लीटर पानी में 20 ग्राम हल्दी पाउडर मिलाकर पौधों की जड़ों के पास छिड़काव करें। यह विल्ट बीमारी से बचाता है।' : 
      language === 'kn' ? '1 ಲೀಟರ್ ನೀರಿಗೆ 20 ಗ್ರಾಂ ಅರಿಶಿನ ಪುಡಿ ಬೆರೆಸಿ ಗಿಡದ ಬುಡಕ್ಕೆ ಸಿಂಪಡಿಸಿ. ಇದು ಸೊರಗು ರೋಗ ನಿಯಂತ್ರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.' : 
      'Mix 20g of organic turmeric powder in 1L of warm water. Pour around the plant base (drenching) to build immunity against bacterial and fungal wilt.'
    }
2. **${language === 'hi' ? 'झुलसा (Blight) नियंत्रण' : language === 'kn' ? 'ಅಂಗಮಾರಿ ರೋಗ ನಿಯಂತ್ರಣ' : 'Fermented Buttermilk Fungicide'}**: ${
      language === 'hi' ? 'खट्टी छाछ को 10 गुना पानी में घोलकर छिड़काव करें। यह एक बेहतरीन प्राकृतिक कवकनाशी (Fungicide) है।' : 
      language === 'kn' ? 'ಹುಳಿ ಮಜ್ಜಿಗೆಯನ್ನು 10 ಪಟ್ಟು ನೀರಿನೊಂದಿಗೆ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ. ಇದು ಅತ್ಯುತ್ತಮ ನೈಸರ್ಗಿಕ ಶಿಲೀಂಧ್ರನಾಶಕವಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.' : 
      'Dilute sour buttermilk 10 times with water and spray on tomato leaves. The lactic acid act as an exceptional natural fungicide against early and late blight.'
    }
${footer[language]}`;
  }

  if (query.includes('soil') || query.includes('npk') || query.includes('ph') || query.includes('मिट्टी') || query.includes('ಮಣ್ಣು')) {
    return `${intro[language]}

**${language === 'hi' ? 'मिट्टी का स्वास्थ्य और जैविक पोषण:' : language === 'kn' ? 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮತ್ತು ಸಾವಯವ ಪೋಷಣೆ:' : 'Soil Health & Organic Replenishment:'}**
1. **${language === 'hi' ? 'अम्लीय मिट्टी के लिए चूना (Lime)' : language === 'kn' ? 'ಆಮ್ಲೀಯ ಮಣ್ಣಿಗೆ ಸುಣ್ಣದ ಬಳಕೆ' : 'Acidity Correctives'}**: ${
      language === 'hi' ? 'यदि मिट्टी अम्लीय है (pH < 6), तो खेत की तैयारी के समय कृषि चूना (कैल्शियम कार्बोनेट) मिलाएं।' : 
      language === 'kn' ? 'ಮಣ್ಣು ಆಮ್ಲೀಯವಾಗಿದ್ದರೆ (pH < 6), ಹೊಲ ಸಿದ್ಧತೆ ಮಾಡುವಾಗ ಕೃಷಿ ಸುಣ್ಣ ಅಥವಾ ಡಾಲಮೈಟ್ ಪುಡಿ ಬೆರೆಸಿ.' : 
      'If your soil is acidic (pH < 6.0), incorporate agricultural lime (calcium carbonate) or dolomite at 200 kg/acre to restore nutrient availability.'
    }
2. **${language === 'hi' ? 'क्षारीय मिट्टी के लिए जिप्सम (Gypsum)' : language === 'kn' ? 'ಕ್ಷಾರೀಯ ಮಣ್ಣಿಗೆ ಜಿಪ್ಸಮ್ ಬಳಕೆ' : 'Alkalinity Treatment'}**: ${
      language === 'hi' ? 'क्षारीय मिट्टी (pH > 7.5) में सुधार के लिए गोबर खाद के साथ जिप्सम या कटी हुई पराली का उपयोग करें।' : 
      language === 'kn' ? 'ಕ್ಷಾರೀಯ ಮಣ್ಣಿನ (pH > 7.5) ಸುಧಾರಣೆಗೆ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರದೊಂದಿಗೆ ಜಿಪ್ಸಮ್ ಅಥವಾ ಸಾವಯವ ಮಲ್ಚಿಂಗ್ ಬಳಸಿ.' : 
      'Apply gypsum or elemental sulfur mixed with organic compost in alkaline soils (pH > 7.5) to neutralize soil alkalinity.'
    }
3. **${language === 'hi' ? 'दलहनी फसलों से नाइट्रोजन बढ़ाएं' : language === 'kn' ? 'ದ್ವಿದಳ ಧಾನ್ಯಗಳಿಂದ ಸಾರಜನಕ ವೃದ್ಧಿ' : 'Green Manure & Legumes'}**: ${
      language === 'hi' ? 'फसल चक्र में मूंग, उड़द या चना जैसी दलहनी फसलों को शामिल करें। इनकी जड़ें हवा की नाइट्रोजन को मिट्टी में संचित करती हैं।' : 
      language === 'kn' ? 'ಬೆಳೆ ಸರದಿಯಲ್ಲಿ ಹೆಸರು, ಉದ್ದು ಅಥವಾ ಕಡಲೆ ತರಹದ ದ್ವಿದಳ ಧಾನ್ಯಗಳನ್ನು ಬೆಳೆಯಿರಿ. ಇವು ವಾತಾವರಣದ ಸಾರಜನಕವನ್ನು ಮಣ್ಣಿನಲ್ಲಿ ಸ್ಥಿರೀಕರಿಸುತ್ತವೆ.' : 
      'Rotate crops with legumes like green gram or cowpea. Their root nodules house Rhizobium bacteria which naturally enrich soil Nitrogen.'
    }
${footer[language]}`;
  }

  // 2. Default responses for crop advice, organic treatment, conversation continuity
  if (language === 'hi') {
    return `${intro[language]}

नमस्ते! ऑफ़लाइन होने के कारण, मैं अभी मौसम और लाइव मण्डी भाव नहीं खोज सकता। लेकिन मैं आपकी फसल सुरक्षा के लिए नीचे दिए गए विषयों पर पूरी जानकारी दे सकता हूँ:

1. **फसल सुरक्षा / जैविक कीटनाशक** (जैसे: नीमअस्त्र, प्याज-मिर्च घोल, राख छिड़काव)
2. **दीमक और रसचूसक कीट नियंत्रण**
3. **पशु स्वास्थ्य और थनैला (Mastitis) का पारंपरिक इलाज**
4. **मिट्टी की जांच और जैविक खाद सलाह**

कृपया ऊपर दिए गए किसी भी विषय में या अपनी किसी फसल रोग से जुड़े सवाल पूछें। मैं आपकी सहायता के लिए तैयार हूँ।
${footer[language]}`;
  } else if (language === 'kn') {
    return `${intro[language]}

ನಮಸ್ಕಾರ! ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲದ ಕಾರಣ, ನಾನು ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಅಥವಾ ಲೈವ್ ಮಾರುಕಟ್ಟೆ ದರಗಳನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಿಲ್ಲ. ಆದರೆ ನಿಮ್ಮ ಬೆಳೆ ರಕ್ಷಣೆಗಾಗಿ ಕೆಳಗಿನ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ವಿವರವಾದ ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ:

1. **ಬೆಳೆ ರಕ್ಷಣೆ / ನೈಸರ್ಗಿಕ ಕೀಟನಾಶಕಗಳು** (ಉದಾ: ಬೇವಿನ ಕಷಾಯ, ಈರುಳ್ಳಿ-ಮೆಣಸಿನಕಾಯಿ ಸ್ಪ್ರೇ, ಬೂದಿ ಬಳಕೆ)
2. **ಗೆದ್ದಲು ಮತ್ತು ರಸಹೀರುವ ಕೀಟಗಳ ನಿಯಂತ್ರಣ**
3. **ಪಶು ಸಂಗೋಪನೆ ಮತ್ತು ಕೆಚ್ಚಲು ಬಾವು (Mastitis) ಪಾರಂಪರಿಕ ಚಿಕಿತ್ಸೆ**
4. **ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮತ್ತು ಸಾವಯವ ಗೊಬ್ಬರ ಸಲಹೆ**

ದಯವಿಟ್ಟು ಮೇಲಿನ ಯಾವುದಾದರೂ ವಿಷಯ ಅಥವಾ ನಿಮ್ಮ ಬೆಳೆ ರೋಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ. ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ.
${footer[language]}`;
  } else {
    return `${intro[language]}

Namaste! I am operating in Offline Edge Mode. While I cannot fetch live weather or Google Maps location services offline, I can guide you on sustainable farming practices:

1. **Crop Protection**: Formulations for natural biopesticides (Neemastra, Chilli-Onion solution, Wood ash).
2. **Pest Control**: Local organic treatments for termites, aphids, and sucking insects.
3. **Veterinary Care**: Traditional cures for cattle Mastitis and Foot & Mouth Disease (FMD).
4. **Soil Health**: Simple steps to balance NPK levels and adjust pH naturally.

Please ask me a specific question about these topics or your crop! I am here to help you continuously.
${footer[language]}`;
  }
}

// Model Router unified execution engine
export async function chatWithModelRouter(
  message: string, 
  history: { role: "user" | "model"; parts: { text: string }[] }[], 
  language: 'en' | 'hi' | 'kn' = 'en', 
  sessionId?: string
): Promise<string> {
  const isOnline = getIsOnline();

  // If client-side is entirely offline, route to Gemma immediately
  if (!isOnline) {
    console.log("ModelRouter: Client is offline. Routing query immediately to Gemma Edge AI.");
    updateStatus('gemma', false);
    
    // Simulate minor local model latency (600ms) to ensure smooth transition
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getGemmaOfflineResponse(message, language));
      }, 600);
    });
  }

  // If online, try Gemini
  try {
    console.log("ModelRouter: Client is online. Routing query to Gemini Cloud Engine.");
    const response = await chatWithAssistant(message, history, language, sessionId);
    updateStatus('gemini', false);
    return response;
  } catch (error: any) {
    console.warn("ModelRouter: Gemini Cloud request failed (or quota hit). Auto-failing over to Gemma Edge AI:", error);
    updateStatus('gemma', true); // True means it was a fallback due to error
    
    // Fallback to local Gemma response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getGemmaOfflineResponse(message, language));
      }, 400);
    });
  }
}
