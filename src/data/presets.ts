export interface ScriptPreset {
  id: string;
  titleBn: string;
  titleEn: string;
  category: 'spiritual' | 'remembrance' | 'contemplation';
  text: string;
  suggestedVoice: string;
  suggestedStyle: string;
}

export interface VoiceOption {
  id: string;
  voiceName: string;
  nameBn: string;
  nameEn: string;
  toneBn: string;
  toneEn: string;
  gender: 'male' | 'female';
  recommendedFor: string;
}

export const SCRIPT_PRESETS: ScriptPreset[] = [
  {
    id: 'gaze_protection_main',
    titleBn: 'দৃষ্টির হেফাজত ও স্ক্রিন লক (অনুরোধকৃত স্ক্রিপ্ট)',
    titleEn: 'Lowering the Gaze & Screen Lock (Requested Script)',
    category: 'spiritual',
    text: 'স্মার্টফোনের স্ক্রিনে কেবল একটি আঙুলের ছোঁয়ায়—আমরা এমন কিছু দেখে ফেলি, যা দেখার অনুমতি ইসলাম দেয়নি। রাসূলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম বলেছেন, হারাম দৃষ্টি হলো শয়তানের বিষাক্ত তীরগুলোর একটি। চোখের সামনে খারাপ কিছু এলেই সাথে সাথে দৃষ্টি নামিয়ে নিন, স্ক্রিন লক করুন। আল্লাহর ভয়ে যে চোখ নিচু হয়—আল্লাহ তার অন্তরে ঈমানের মিষ্টি স্বাদ ঢেলে দেন।',
    suggestedVoice: 'Fenrir',
    suggestedStyle:
      'Deep, emotional, clear, and cinematic Bangladeshi Bengali accent. Solemn baritone, dignified, solemn, contemplative, with natural pauses and spiritual reverence. Pronounce every Bengali word naturally without English.',
  },
  {
    id: 'tahajjud_whispers',
    titleBn: 'তাহাজ্জুদের নীরবতা ও নির্জন মোনাজাত',
    titleEn: 'Silence of Tahajjud & Solitary Dua',
    category: 'contemplation',
    text: 'গভীর রাতে যখন পুরো পৃথিবী ঘুমে আচ্ছন্ন, তখন একাকী জায়নামাজে দাঁড়িয়ে চোখের দু ফোঁটা জল ফেলে রবকে ডাকুন। তিনি তো ডাকছেন—কে আছো ক্ষমা চাইবে, আমি ক্ষমা করে দেব? সেই নিস্তব্ধ রাতের মোনাজাত কখনো বিফলে যায় না।',
    suggestedVoice: 'Charon',
    suggestedStyle:
      'Very soft, deeply emotional, whispering warmth, contemplative Bangladeshi Bengali, solemn pauses, spiritual intimacy.',
  },
  {
    id: 'sweetness_of_sabr',
    titleBn: 'সবরের তিক্ততা ও জান্নাতের সুসংবাদ',
    titleEn: 'Patience in Hardship & Glad Tidings',
    category: 'spiritual',
    text: 'দুঃখ ও বিপদ আপনাকে ভেঙে ফেলতে আসেনি, বরং আল্লাহর আরও কাছে টেনে নিতে এসেছে। কষ্ট যতই কঠিন হোক, ধৈর্য ধরুন। নিশ্চয়ই প্রতিটি অন্ধকারের পরেই রয়েছে নূরের উজ্জ্বল ভোর। আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
    suggestedVoice: 'Zephyr',
    suggestedStyle:
      'Gentle, hopeful, deeply empathetic, compassionate Bangladeshi Bengali accent, warm cadence.',
  },
  {
    id: 'dhikr_peace',
    titleBn: 'আল্লাহর স্মরণে হৃদয়ের প্রশান্তি',
    titleEn: 'Remembrance of Allah & Inner Peace',
    category: 'remembrance',
    text: 'অস্থির মন যখন কোনো কিছুতেই শান্তি পায় না, তখন স্মরণ করুন আপনার রবকে। কারণ জেনে রাখুন—কেবল আল্লাহর জিকিরেই রয়েছে অন্তরসমূহের পরম প্রশান্তি। জীবনের প্রতিটি পদক্ষেপে তাঁর শুকরিয়া আদায় করুন।',
    suggestedVoice: 'Kore',
    suggestedStyle:
      'Gentle, melodic, moving and heartfelt feminine Bangladeshi Bengali voice, serene tempo, tranquil resonance.',
  },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'fenrir',
    voiceName: 'Fenrir',
    nameBn: 'ফেনরির (গম্ভীর সিনোমেটিক ব্যারিটোন)',
    nameEn: 'Fenrir (Deep Cinematic Baritone)',
    toneBn: 'গভীর, ভারী, বলিষ্ঠ ও প্রভাব বিস্তারকারী কণ্ঠ',
    toneEn: 'Deep, resonant, powerful & commanding baritone',
    gender: 'male',
    recommendedFor: 'সিনেম্যাটিক ও আবেগঘন বয়ান ও নসিহত',
  },
  {
    id: 'charon',
    voiceName: 'Charon',
    nameBn: 'শ্যারন (মরমি ও ভাবগম্ভীর কণ্ঠ)',
    nameEn: 'Charon (Mystic & Contemplative)',
    toneBn: 'গম্ভীর, ধীরস্থির, আধ্যাত্মিক ও অন্তর্দৃষ্টিমূলক',
    toneEn: 'Solemn, reflective, atmospheric & introspective',
    gender: 'male',
    recommendedFor: 'গভীর রাতের চিন্তা ও আধ্যাত্মিক আত্মশুদ্ধি',
  },
  {
    id: 'zephyr',
    voiceName: 'Zephyr',
    nameBn: 'জেফির (স্নিগ্ধ ও দরদি প্রজ্ঞাবান কণ্ঠ)',
    nameEn: 'Zephyr (Warm & Compassionate Mentor)',
    toneBn: 'শান্ত, আন্তরিক, হৃদয়গ্রাহী ও সান্ত্বনাদায়ক',
    toneEn: 'Warm, sincere, soothing & mentor-like',
    gender: 'male',
    recommendedFor: 'সবর, সান্ত্বনা ও অনুপ্রেরণামূলক কথা',
  },
  {
    id: 'kore',
    voiceName: 'Kore',
    nameBn: 'কোরি (কোমল ও সুরভিত নারী কণ্ঠ)',
    nameEn: 'Kore (Gentle Melodic Feminine)',
    toneBn: 'মৃদু, ভাবাবেগপূর্ণ, স্নিগ্ধ ও পবিত্র অনুভূতি',
    toneEn: 'Melodic, tender, soft & deeply emotive',
    gender: 'female',
    recommendedFor: 'দোয়া, জিকির ও শান্তির বাণী',
  },
  {
    id: 'puck',
    voiceName: 'Puck',
    nameBn: 'পাক (স্পষ্ট ও প্রানবন্ত কণ্ঠ)',
    nameEn: 'Puck (Vibrant & Expressive)',
    toneBn: 'স্পষ্ট উচ্চারণ, উদ্দীপক ও জীবন্ত উপস্থাপনা',
    toneEn: 'Crisp, articulate & energetic narrator',
    gender: 'male',
    recommendedFor: 'স্পষ্ট পাঠ ও প্রাঞ্জল উপস্থাপনা',
  },
];
