// ============================================================
// save.js — Player ma'lumotlarini localStorage'ga saqlash
// Let For Dead
// ============================================================
window.Save = (function(){
  'use strict';

  var SAVE_KEY = 'letfordead_save_v1';

  // ============================================================
  // DEFAULT SAVE
  // ============================================================
  function defaultSave(){
    return {
      version: 1,
      // O'yin statistikasi
      totalKills: 0,
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      bestScore: 0,
      totalPlayTime: 0,       // millisekundlarda

      // Achievements
      achievements: {},

      // Oxirgi o'yin
      lastGame: {
        score: 0,
        kills: 0,
        wave: 0,
        won: false,
        date: null
      }
    };
  }

  // ============================================================
  // YUKLASH
  // ============================================================
  function load(){
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return defaultSave();

      var data = JSON.parse(raw);
      var def = defaultSave();

      // Merge — yangi maydonlar bo'lsa qo'shamiz
      for(var k in def){
        if(data[k] === undefined) data[k] = def[k];
      }

      // lastGame merge
      if(!data.lastGame) data.lastGame = def.lastGame;
      else {
        for(var lk in def.lastGame){
          if(data.lastGame[lk] === undefined) data.lastGame[lk] = def.lastGame[lk];
        }
      }

      // achievements merge
      if(!data.achievements) data.achievements = {};

      return data;
    } catch(e){
      console.warn('[Save] Load xato:', e);
      return defaultSave();
    }
  }

  // ============================================================
  // SAQLASH
  // ============================================================
  function save(data){
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch(e){
      console.warn('[Save] Save xato:', e);
      return false;
    }
  }

  // ============================================================
  // O'YIN TUGADI
  // ============================================================
  function onGameEnd(stats){
    var data = load();

    data.totalGames++;
    data.totalKills += (stats.kills || 0);

    if(stats.won){
      data.totalWins++;
    } else {
      data.totalLosses++;
    }

    if((stats.score || 0) > data.bestScore){
      data.bestScore = stats.score;
    }

    if(stats.playTime){
      data.totalPlayTime += stats.playTime;
    }

    data.lastGame = {
      score: stats.score || 0,
      kills: stats.kills || 0,
      wave: stats.wave || 0,
      won: !!stats.won,
      date: Date.now()
    };

    save(data);
    console.log('[Save] Game ended. Total games:', data.totalGames, 'Wins:', data.totalWins);
    return data;
  }

  // ============================================================
  // ACHIEVEMENT
  // ============================================================
  function unlockAchievement(id){
    var data = load();
    if(data.achievements[id]) return false;   // allaqachon bor
    data.achievements[id] = {
      unlocked: true,
      date: Date.now()
    };
    save(data);
    console.log('[Save] Achievement unlocked:', id);
    return true;
  }

  function hasAchievement(id){
    var data = load();
    return !!data.achievements[id];
  }

  function getAchievements(){
    return load().achievements;
  }

  // ============================================================
  // STATISTIKA
  // ============================================================
  function getStats(){
    var data = load();
    return {
      totalKills: data.totalKills,
      totalGames: data.totalGames,
      totalWins: data.totalWins,
      totalLosses: data.totalLosses,
      bestScore: data.bestScore,
      totalPlayTime: data.totalPlayTime,
      winRate: data.totalGames > 0
        ? Math.round((data.totalWins / data.totalGames) * 100)
        : 0
    };
  }

  // ============================================================
  // O'CHIRISH
  // ============================================================
  function clear(){
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log('[Save] Cleared');
      return true;
    } catch(e){
      return false;
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    load: load,
    save: save,
    onGameEnd: onGameEnd,
    unlockAchievement: unlockAchievement,
    hasAchievement: hasAchievement,
    getAchievements: getAchievements,
    getStats: getStats,
    clear: clear
  };
})();