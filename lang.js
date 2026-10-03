// ============================================================
// lang.js — Let For Dead — Tarjimalar
// Tillar: eng, rus, uzb
// ============================================================
window.Lang = (function(){
  'use strict';

  var TRANSLATIONS = {
    // ============================================================
    // MENU
    // ============================================================
    campaign:       { eng: 'Campaign',       rus: 'Кампания',          uzb: 'Kompaniya' },
    network_game:   { eng: 'Network Game',   rus: 'Сетевая игра',      uzb: 'Tarmoq o\'yini' },
    single_game:    { eng: 'Single Game',    rus: 'Одиночная игра',    uzb: 'Yakka o\'yin' },
    achievements:   { eng: 'Achievements',   rus: 'Достижения',        uzb: 'Yutuqlar' },
    settings:       { eng: 'Settings',       rus: 'Настройки',         uzb: 'Sozlamalar' },
    addons:         { eng: 'Add-ons',        rus: 'Дополнения',        uzb: 'Qo\'shimchalar' },
    exit:           { eng: 'Exit',           rus: 'Выход',             uzb: 'Chiqish' },
    back:           { eng: 'Back',           rus: 'Назад',             uzb: 'Orqaga' },

    // ============================================================
    // SETTINGS — SECTIONS
    // ============================================================
    settings_title: { eng: 'SETTINGS',       rus: 'НАСТРОЙКИ',         uzb: 'SOZLAMALAR' },
    sound_section:  { eng: 'Sound',          rus: 'Звук',              uzb: 'Ovoz' },
    video_section:  { eng: 'Video',          rus: 'Видео',             uzb: 'Video' },
    hud_section:    { eng: 'Interface (HUD)', rus: 'Интерфейс (HUD)',  uzb: 'Interfeys (HUD)' },
    gameplay_section: { eng: 'Gameplay',     rus: 'Геймплей',          uzb: 'O\'yin jarayoni' },

    // ============================================================
    // SETTINGS — AUDIO
    // ============================================================
    volume_master:  { eng: 'Master Volume',  rus: 'Общая громкость',   uzb: 'Umumiy ovoz' },
    volume_music:   { eng: 'Music Volume',   rus: 'Громкость музыки',  uzb: 'Musiqa ovozi' },
    volume_sfx:     { eng: 'SFX Volume',     rus: 'Звуковые эффекты',  uzb: 'Ovoz effektlari' },

    // ============================================================
    // SETTINGS — VIDEO
    // ============================================================
    brightness:     { eng: 'Brightness',     rus: 'Яркость',           uzb: 'Yorqinlik' },
    gamma:          { eng: 'Gamma',          rus: 'Гамма',              uzb: 'Gamma' },
    scanlines:      { eng: 'Scanlines Effect', rus: 'Эффект сканлайнов', uzb: 'Skanlayn effekti' },
    vignette:       { eng: 'Vignette',       rus: 'Виньетка',           uzb: 'Vinyetka' },
    blood_overlay:  { eng: 'Blood Overlay',  rus: 'Кровавые пятна',    uzb: 'Qon effekti' },

    // ============================================================
    // SETTINGS — HUD
    // ============================================================
    hud_health:     { eng: 'Health Bar',     rus: 'Полоса здоровья',    uzb: 'Jon ko\'rsatkichi' },
    hud_ammo:       { eng: 'Ammo Counter',   rus: 'Боеприпасы',         uzb: 'O\'q-dorilar' },
    hud_slots:      { eng: 'Weapon Slots',   rus: 'Панель слотов',      uzb: 'Qurol slotlari' },
    hud_kills:      { eng: 'Kill Counter',   rus: 'Счётчик убийств',    uzb: 'O\'ldirilganlar' },
    hud_timer:      { eng: 'Helicopter Timer', rus: 'Таймер вертолёта', uzb: 'Vertolyot taymeri' },
    hud_names:      { eng: 'Survivor Names', rus: 'Имена выживших',     uzb: 'Omon qolganlar ismi' },

    // ============================================================
    // SETTINGS — GAMEPLAY
    // ============================================================
    auto_aim:       { eng: 'Auto Aim (Mobile)', rus: 'Автоприцел (мобильные)', uzb: 'Avtomatik nishon' },
    show_fps:       { eng: 'Show FPS',       rus: 'Показать FPS',       uzb: 'FPS ko\'rsatish' },
    difficulty:     { eng: 'Difficulty',     rus: 'Сложность',          uzb: 'Qiyinlik' },

    // ============================================================
    // SETTINGS — LANGUAGE + MUSIC
    // ============================================================
    language:       { eng: 'Language',       rus: 'Язык',               uzb: 'Til' },
    lobby_music:    { eng: 'Lobby Music',    rus: 'Музыка лобби',       uzb: 'Lobbi musiqasi' },
    music_standard: { eng: 'Standard',       rus: 'Стандарт',           uzb: 'Standart' },
    music_horizon:  { eng: 'Horizon',        rus: 'Горизонт',           uzb: 'Horizon' },

    // ============================================================
    // DIFFICULTY LEVELS
    // ============================================================
    diff_easy:      { eng: 'Easy',           rus: 'Легко',              uzb: 'Oson' },
    diff_medium:    { eng: 'Medium',         rus: 'Средний',            uzb: 'O\'rta' },
    diff_hard:      { eng: 'Hard',           rus: 'Тяжело',             uzb: 'Qiyin' },

    // ============================================================
    // RESET
    // ============================================================
    reset_settings: { eng: 'Reset Settings', rus: 'Сбросить настройки', uzb: 'Sozlamalarni tiklash' },

    // ============================================================
    // ADDONS
    // ============================================================
    addons_title:    { eng: 'ADD-ONS',       rus: 'ДОПОЛНЕНИЯ',          uzb: 'QO\'SHIMCHALAR' },
    addon_load_file: { eng: 'Load File',     rus: 'Загрузить файл',      uzb: 'Fayl yuklash' },
    addon_paste_json:{ eng: 'Paste JSON',    rus: 'Вставить JSON',       uzb: 'JSON joylashtirish' },
    addon_clear_all: { eng: 'Clear All',     rus: 'Очистить всё',        uzb: 'Hammasini tozalash' },
    addon_installed: { eng: 'Installed Maps', rus: 'Установленные карты', uzb: 'O\'rnatilgan xaritalar' },
    addon_empty:     { eng: 'No maps installed yet', rus: 'Пока нет установленных карт', uzb: 'Hozircha xarita yo\'q' },
    addon_hint:      { eng: 'Upload a .json file from Map Maker', rus: 'Загрузите .json файл из Map Maker', uzb: 'Map Maker\'dan .json fayl yuklang' },
    addon_play:      { eng: 'Play',          rus: 'Играть',             uzb: 'O\'ynash' },
    addon_delete:    { eng: 'Delete',        rus: 'Удалить',            uzb: 'O\'chirish' },
    addon_added:     { eng: 'Map added',     rus: 'Карта добавлена',    uzb: 'Xarita qo\'shildi' },
    addon_deleted:   { eng: 'Map deleted',   rus: 'Карта удалена',      uzb: 'Xarita o\'chirildi' },
    addon_all_clear: { eng: 'All maps deleted', rus: 'Все карты удалены', uzb: 'Barcha xaritalar o\'chirildi' },
    addon_invalid:   { eng: 'Invalid JSON file', rus: 'Неверный JSON файл', uzb: 'Noto\'g\'ri JSON fayl' },
    addon_insert:    { eng: 'Insert Map JSON', rus: 'Вставить JSON карты', uzb: 'Xarita JSON joylashtiring' },

    // ============================================================
    // ACHIEVEMENTS
    // ============================================================
    ach_title:       { eng: 'ACHIEVEMENTS',  rus: 'ДОСТИЖЕНИЯ',           uzb: 'YUTUQLAR' },
    ach_first_blood: { eng: 'First Blood',   rus: 'Первая кровь',         uzb: 'Birinchi qon' },
    ach_first_blood_d: { eng: 'Kill first zombie', rus: 'Убить первого зомби', uzb: 'Birinchi zombie o\'ldirish' },
    ach_horde:       { eng: 'Survivor',      rus: 'Выживший',             uzb: 'Omon qolgan' },
    ach_horde_d:     { eng: 'Survive first horde', rus: 'Пережить первую орду', uzb: 'Birinchi ordadan omon qolish' },
    ach_heli_call:   { eng: 'SOS Signal',    rus: 'Сигнал SOS',           uzb: 'SOS signali' },
    ach_heli_call_d: { eng: 'Call the helicopter', rus: 'Вызвать вертолёт', uzb: 'Vertolyotni chaqirish' },
    ach_tank:        { eng: 'Tank Killer',   rus: 'Танк убит',            uzb: 'Tank o\'ldirilgan' },
    ach_tank_d:      { eng: 'Kill the Tank', rus: 'Убить Танка',          uzb: 'Tankni o\'ldirish' },
    ach_rescued:     { eng: 'Rescued',       rus: 'Спасение',             uzb: 'Qutqarilgan' },
    ach_rescued_d:   { eng: 'Escape on helicopter', rus: 'Сбежать на вертолёте', uzb: 'Vertolyotda qochish' },
    ach_all_surv:    { eng: 'All Survived',  rus: 'Все выжили',           uzb: 'Hammasi omon' },
    ach_all_surv_d:  { eng: 'Save all 3 survivors', rus: 'Спасти всех 3-х выживших', uzb: 'Barcha 3 sherikni qutqarish' },
    ach_laser:       { eng: 'Sniper',        rus: 'Снайпер',              uzb: 'Snayper' },
    ach_laser_d:     { eng: 'Find the laser sight', rus: 'Найти лазерный прицел', uzb: 'Lazerni topish' },
    ach_aid:         { eng: 'Medic',         rus: 'Медик',                uzb: 'Shifokor' },
    ach_aid_d:       { eng: 'Use an AID Kit', rus: 'Использовать AID Kit', uzb: 'AID Kitdan foydalanish' },

    // ============================================================
    // CAMPAIGN PAGE
    // ============================================================
    cmp_title:      { eng: 'CAMPAIGN',       rus: 'КАМПАНИЯ',           uzb: 'KOMPANIYA' },
    cmp_dead_center:{ eng: 'Dead Center',    rus: 'Dead Center',         uzb: 'Dead Center' },
    cmp_dark_carn:  { eng: 'Dark Carnival',  rus: 'Dark Carnival',       uzb: 'Dark Carnival' },
    cmp_swamp:      { eng: 'Swamp Fever',    rus: 'Swamp Fever',         uzb: 'Swamp Fever' },
    cmp_hard_rain:  { eng: 'Hard Rain',      rus: 'Hard Rain',           uzb: 'Hard Rain' },
    cmp_parish:     { eng: 'The Parish',     rus: 'The Parish',          uzb: 'The Parish' },
    cmp_dead_center_d: { eng: 'Hotel, mall — outbreak begins', rus: 'Отель, ТЦ — начало эпидемии', uzb: 'Mehmonxona, savdo markazi — epidemiya boshlanishi' },
    cmp_dark_carn_d: { eng: 'Amusement park Whispering Oaks', rus: 'Парк аттракционов Whispering Oaks', uzb: 'Whispering Oaks ko\'ngilochar bog\'i' },
    cmp_swamp_d:    { eng: 'Swamp, plantation, fog', rus: 'Болото, плантация, туман', uzb: 'Botqoq, plantatsiya, tuman' },
    cmp_hard_rain_d:{ eng: 'Downpour, sugar mill, witches', rus: 'Ливень, сахарный завод, ведьмы', uzb: 'Yomg\'ir, shakar zavodi, jodugarlar' },
    cmp_parish_d:   { eng: 'New Orleans, bridge, finale', rus: 'Новый Орлеан, мост, финал', uzb: 'Yangi Orlean, ko\'prik, final' },

    // ============================================================
    // MODALS
    // ============================================================
    confirm_title:   { eng: 'Confirmation',  rus: 'Подтверждение',        uzb: 'Tasdiqlash' },
    confirm_yes:     { eng: 'Yes',           rus: 'Да',                   uzb: 'Ha' },
    confirm_no:      { eng: 'No',            rus: 'Нет',                  uzb: 'Yo\'q' },
    cancel:          { eng: 'Cancel',        rus: 'Отмена',               uzb: 'Bekor qilish' },
    add:             { eng: 'Add',           rus: 'Добавить',             uzb: 'Qo\'shish' },
    exit_title:      { eng: 'Exit',          rus: 'Выход',                uzb: 'Chiqish' },
    exit_confirm:    { eng: 'Are you sure you want to exit?', rus: 'Вы уверены, что хотите выйти?', uzb: 'Rostdan ham chiqmoqchimisiz?' },
    clear_all_title: { eng: 'Clear All',     rus: 'Очистка',              uzb: 'Tozalash' },
    clear_all_confirm: { eng: 'Delete ALL installed maps?', rus: 'Удалить ВСЕ установленные карты?', uzb: 'Barcha o\'rnatilgan xaritalarni o\'chirasizmi?' },
    delete_title:    { eng: 'Delete',        rus: 'Удаление',             uzb: 'O\'chirish' },
    delete_confirm:  { eng: 'Delete this map?', rus: 'Удалить эту карту?', uzb: 'Bu xaritani o\'chirasizmi?' },
    settings_reset:  { eng: 'Settings reset', rus: 'Настройки сброшены',  uzb: 'Sozlamalar tiklandi' },
    network_soon:    { eng: 'Network game coming soon', rus: 'Сетевая игра скоро', uzb: 'Tarmoq o\'yini tez orada' },
    error:           { eng: 'Error',         rus: 'Ошибка',               uzb: 'Xatolik' },
    load_error:      { eng: 'Error loading map', rus: 'Ошибка загрузки карты', uzb: 'Xarita yuklashda xato' }
  };

  var currentLang = 'eng';

  function setLanguage(lang){
    if(lang === 'eng' || lang === 'rus' || lang === 'uzb'){
      currentLang = lang;
      try { localStorage.setItem('letfordead_language', lang); } catch(e){}
      return true;
    }
    return false;
  }

  function getLanguage(){
    return currentLang;
  }

  function loadLanguage(){
    try {
      var saved = localStorage.getItem('letfordead_language');
      if(saved && TRANSLATIONS[Object.keys(TRANSLATIONS)[0]][saved]){
        currentLang = saved;
      }
    } catch(e){}
    return currentLang;
  }

  function t(key){
    var entry = TRANSLATIONS[key];
    if(!entry) return key;
    return entry[currentLang] || entry.eng || key;
  }

  // Auto-load
  loadLanguage();

  return {
    t: t,
    setLanguage: setLanguage,
    getLanguage: getLanguage,
    loadLanguage: loadLanguage,
    TRANSLATIONS: TRANSLATIONS
  };
})();