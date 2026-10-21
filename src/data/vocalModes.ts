export interface VocalMode {
  id: string;
  idx: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  prompt: string;
  tags: string[];
  suggestedVoice: string;
}

export const VOCAL_MODES: VocalMode[] = [
  {
    id: 'cinematic_baritone',
    idx: '001',
    titleBn: 'গভীর ও সিনামেটিক',
    titleEn: 'Cinematic Baritone',
    descBn: 'গম্ভীর, ভারী, বলিষ্ঠ ও রাজকীয় ব্যারিটোন ভয়েস; ট্রেলার ও গভীর জীবনবোধের কথার জন্য।',
    descEn: 'Deep, heavy, powerful, and majestic baritone voice for trailers and profound narratives.',
    prompt:
      'Deep, emotional, clear, and cinematic Bangladeshi Bengali accent. Warm solemn baritone with authoritative presence, natural human breathing pauses at commas and punctuation marks (, ।). Pure Standard Bangladeshi phonetics. Strictly avoid robotic or foreign accents.',
    tags: ['ট্রেলার', 'ডকুমেন্টারি', 'গম্ভীর'],
    suggestedVoice: 'Fenrir',
  },
  {
    id: 'emotional_touching',
    idx: '002',
    titleBn: 'আবেগঘন ও হৃদয়স্পর্শী',
    titleEn: 'Emotional & Touching',
    descBn: 'অশ্রুসজল, নরম, ভেতরে নাড়া দেওয়া ব্যাকুল সুর; মোনাজাত ও ব্যথিত অনুভূতির জন্য।',
    descEn: 'Tearful, tender, heart-stirring solemn tone; ideal for intimate prayers and raw empathy.',
    prompt:
      'Deeply moving, emotional, heartfelt, gentle Bangladeshi Bengali voice acting. Soft solemn tone, trembling sincerity, tender breath pauses, intimate reflection and authentic emotional resonance at every comma and full stop.',
    tags: ['মোনাজাত', 'আবেগ', 'বেদনা'],
    suggestedVoice: 'Aoede',
  },
  {
    id: 'inspirational_bold',
    idx: '003',
    titleBn: 'অনুপ্রেরণাদায়ী ও তেজস্বী',
    titleEn: 'Inspirational & Bold',
    descBn: 'প্রত্যয়ী, শক্তিশালী, উদ্যমী ও নেতৃত্বসুলভ বলিষ্ঠ কণ্ঠ; উদ্দীপনামূলক বার্তার জন্য।',
    descEn: 'Confident, powerful, energetic, and leadership-driven voice for motivational calls.',
    prompt:
      'Inspiring, firm, articulate, powerful baritone Bangladeshi Bengali voiceover. Confident, charismatic, warm, persuasive, and dignified with crisp Bengali pronunciation and energetic human delivery.',
    tags: ['প্রেরণা', 'নেতৃত্ব', 'জাগরণ'],
    suggestedVoice: 'Fenrir',
  },
  {
    id: 'whispering_mysterious',
    idx: '004',
    titleBn: 'রহস্যময় ও ফিসফিসানি',
    titleEn: 'Whispering & Mysterious',
    descBn: 'নিস্তব্ধ রাতের মতো শান্ত, গভীর, ফিসফিসে ও থ্রিলার আবহ তৈরির ভয়েস।',
    descEn: 'Nocturnal, hushed, suspenseful whisper tailored for psychological thrillers.',
    prompt:
      'Mysterious, whispered, contemplative, low-pitched gentle Bangladeshi Bengali. Quiet, atmospheric, suspenseful delivery for solitary nocturnal reflection and thriller narration with subtle respiratory breath sounds.',
    tags: ['থ্রিলার', 'রহস্য', 'ফিসফিস'],
    suggestedVoice: 'Charon',
  },
  {
    id: 'gentle_peaceful',
    idx: '005',
    titleBn: 'স্নেহময় ও প্রশান্তিময়',
    titleEn: 'Gentle & Peaceful',
    descBn: 'শান্ত, দরদি, মমতাভরা, স্নিগ্ধ ও ঘুমপাড়ানি নরম সুর; ইতিবাচক ও শিশুদের গল্পের জন্য।',
    descEn: 'Calm, affectionate, tranquil, and comforting soft cadence for bedtime and soothing tales.',
    prompt:
      'Gentle, melodic, serene, tranquil Bangladeshi Bengali voice delivery. Soothing tempo, relaxed human breath pauses, peaceful, tender and reassuring resonance with clear, gentle conjuncts.',
    tags: ['স্নেহ', 'ঘুমপাড়ানি', 'শান্ত'],
    suggestedVoice: 'Kore',
  },
  {
    id: 'epic_storyteller',
    idx: '006',
    titleBn: 'ঐতিহাসিক আখ্যানমূলক',
    titleEn: 'Epic Storyteller',
    descBn: 'প্রাচীন দাস্তান ও লোকগাথার রূপরেখায় চমৎকার উত্থান-পতনের ক্লাসিক ন্যারেটিভ।',
    descEn: 'Epic classical narrator cadence with dynamic cadence shifts for ancient chronicles.',
    prompt:
      'Epic classical narrator voice in pure Bangladeshi Bengali. Varied pitch and pacing suitable for historical storytelling, timeless parables, folklore, and dramatic historic epics.',
    tags: ['ইতিহাস', 'লোকগাথা', 'দাস্তান'],
    suggestedVoice: 'Puck',
  },
  {
    id: 'conversational_podcast',
    idx: '007',
    titleBn: 'স্বাভাবিক আড্ডার কথপোকথন',
    titleEn: 'Conversational Podcast',
    descBn: 'ক্যাজুয়াল, প্রাণবন্ত, স্বাভাবিক কথা বলার মতো বন্ধুত্বপূর্ণ ও সাবলীল টোন।',
    descEn: 'Casual, vibrant, organic conversational tone perfect for podcast hosts and friendly chats.',
    prompt:
      'Natural, conversational, friendly Bangladeshi Bengali tone. Sounds like a close friend talking over coffee, with organic pauses, smile in the voice, authentic casual inflection, and natural standard Bengali phrasing.',
    tags: ['পডকাস্ট', 'আড্ডা', 'বন্ধুত্বপূর্ণ'],
    suggestedVoice: 'Aoede',
  },
  {
    id: 'authoritative_news',
    idx: '008',
    titleBn: 'সংবাদ উপস্থাপক ও প্রামাণ্য',
    titleEn: 'Authoritative News Anchor',
    descBn: 'স্পষ্ট, দ্রুত, অত্যন্ত প্রমিত ও আনুষ্ঠানিক টেলিভিশন বুলেটিন উপস্থাপনার ভঙ্গি।',
    descEn: 'Crisp, measured, highly formal television bulletin presentation with impeccable diction.',
    prompt:
      'Professional broadcast television news anchor voice in standard Bangladeshi Bengali (প্রমিত বাংলা). Perfectly enunciated phonetics, crisp consonants, authoritative journalistic cadence, confident and neutral pacing.',
    tags: ['সংবাদ', 'বুলেটিন', 'অফিসিয়াল'],
    suggestedVoice: 'Fenrir',
  },
  {
    id: 'sad_melancholic',
    idx: '009',
    titleBn: 'বিষাদগ্রস্ত ও শোকাবহ',
    titleEn: 'Sad & Melancholic',
    descBn: 'ভারী শ্বাস, হতাশা ও বিরহের গভীর বেদনার মৃদু ও বিষণ্ণ সুর।',
    descEn: 'Heavy breaths, sorrowful cadence, and poignant despair for tragic stories.',
    prompt:
      'Deeply sad, melancholic, sorrowful Bangladeshi Bengali voice acting. Soft weeping quality, heavy respiratory pauses, aching vulnerability, and mournful cadence conveying profound personal grief.',
    tags: ['বিষাদ', 'শোক', 'বিরহ'],
    suggestedVoice: 'Charon',
  },
  {
    id: 'sarcastic_witty',
    idx: '010',
    titleBn: 'ব্যঙ্গাত্মক ও কৌতুকপূর্ণ',
    titleEn: 'Sarcastic & Witty',
    descBn: 'তীক্ষ্ণ, চতুর, হালকা হাসিমাখা ও বুদ্ধিদীপ্ত হিউমারাস কণ্ঠ।',
    descEn: 'Sharp, clever, subtly smiling, and intellectually humorous theatrical voice.',
    prompt:
      'Witty, sarcastic, playful Bangladeshi Bengali tone. Light mocking undertone, clever pauses, raised intonation at punches, and expressive satirical theatrical flair.',
    tags: ['ব্যঙ্গ', 'কৌতুক', 'হিউমার'],
    suggestedVoice: 'Puck',
  },
  {
    id: 'aggressive_dramatic',
    idx: '011',
    titleBn: 'উত্তেজনাপূর্ণ ও আক্রমণাত্মক',
    titleEn: 'Aggressive & Dramatic',
    descBn: 'ক্ষিপ্র, উচ্চ-শক্তির নাটকীয় দ্বন্দ্ব ও যুদ্ধক্ষেত্রের তীব্র চিৎকার বা গর্জন।',
    descEn: 'Fierce, high-energy dramatic intensity, clash of wills, and battlefield commanding roar.',
    prompt:
      'Intense, dramatic, forceful, high-energy Bangladeshi Bengali vocal delivery. Sharp commanding tone, urgent tempo, thrilling emotional clash, and powerful resonant projection.',
    tags: ['যুদ্ধ', 'নাটকীয়', 'উত্তেজনা'],
    suggestedVoice: 'Fenrir',
  },
  {
    id: 'spiritual_reverent',
    idx: '012',
    titleBn: 'আধ্যাত্মিক ও মারফতি ভাবগাম্ভীর্য',
    titleEn: 'Spiritual & Reverent',
    descBn: 'বিনম্র, ভক্তিপূর্ণ, ধীরলয় ও আত্মিক নিবেদনের শান্ত পবিত্র সুর।',
    descEn: 'Humble, devotion-filled, slow-measured, and spiritually sacred tranquility.',
    prompt:
      'Deeply spiritual, reverent, humble Bangladeshi Bengali voice delivery. Slow measured cadence, sacred reverence, gentle soul-stirring warmth, and immaculate pronunciation of spiritual and Quranic/Hadith terms.',
    tags: ['আধ্যাত্মিক', 'মারফতি', 'ভক্তি'],
    suggestedVoice: 'Fenrir',
  },
];
