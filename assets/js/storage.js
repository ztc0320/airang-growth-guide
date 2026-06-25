var Storage = (function(){
  var KEYS = {
    babyName: 'airang_baby_name',
    babyBirthDate: 'airang_baby_birth_date',
    notificationEnabled: 'airang_notification_enabled',
    lastSeenMonth: 'airang_last_seen_month'
  };

  function getBaby(){
    return {
      name: localStorage.getItem(KEYS.babyName) || '',
      birthDate: localStorage.getItem(KEYS.babyBirthDate) || '',
      notificationEnabled: localStorage.getItem(KEYS.notificationEnabled) === 'true'
    };
  }

  function setBaby(data){
    localStorage.setItem(KEYS.babyName, data.name || '우리 아이');
    localStorage.setItem(KEYS.babyBirthDate, data.birthDate || '');
    localStorage.setItem(KEYS.notificationEnabled, data.notificationEnabled ? 'true' : 'false');
  }

  function hasBaby(){
    return !!localStorage.getItem(KEYS.babyBirthDate);
  }

  function getChecklistKey(month, group, index){
    return 'airang_checklist_' + month + '_' + group + '_' + index;
  }

  function getChecklist(month, group, index){
    return localStorage.getItem(getChecklistKey(month, group, index)) === 'true';
  }

  function setChecklist(month, group, index, checked){
    localStorage.setItem(getChecklistKey(month, group, index), checked ? 'true' : 'false');
  }

  function getLastSeenMonth(){
    var value = localStorage.getItem(KEYS.lastSeenMonth);
    return value === null ? null : Number(value);
  }

  function setLastSeenMonth(month){
    localStorage.setItem(KEYS.lastSeenMonth, String(month));
  }

  function resetAll(){
    var keep = [];
    for(var i = localStorage.length - 1; i >= 0; i--){
      var key = localStorage.key(i);
      if(key && key.indexOf('airang_') === 0 && keep.indexOf(key) === -1){ localStorage.removeItem(key); }
    }
  }

  return {
    KEYS: KEYS,
    getBaby: getBaby,
    setBaby: setBaby,
    hasBaby: hasBaby,
    getChecklist: getChecklist,
    setChecklist: setChecklist,
    getLastSeenMonth: getLastSeenMonth,
    setLastSeenMonth: setLastSeenMonth,
    resetAll: resetAll
  };
})();
