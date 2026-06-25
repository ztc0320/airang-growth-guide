var NotificationManager = (function(){
  function requestPermission(){
    if(!('Notification' in window)){ return Promise.resolve('unsupported'); }
    if(Notification.permission === 'granted'){ return Promise.resolve('granted'); }
    if(Notification.permission === 'denied'){ return Promise.resolve('denied'); }
    return Notification.requestPermission();
  }

  function showInAppMonthNotice(babyAge){
    $('#monthChangeNotice').removeClass('is-hidden').text('아이가 ' + babyAge.months + '개월이 되었어요. 이번 달 발달과 식사 체크를 확인해보세요.');
  }

  function checkMonthChanged(babyAge, enabled){
    var lastSeen = Storage.getLastSeenMonth();
    if(lastSeen === null){ Storage.setLastSeenMonth(babyAge.months); return; }
    if(lastSeen !== babyAge.months){
      if(enabled){ notifyMonthChanged(babyAge); }
      showInAppMonthNotice(babyAge);
      Storage.setLastSeenMonth(babyAge.months);
    }
  }

  function notifyMonthChanged(babyAge){
    if(!('Notification' in window)){ return; }
    if(Notification.permission === 'granted'){
      new Notification('아이랑 성장가이드', {body:'아이가 ' + babyAge.months + '개월이 되었어요. 이번 달 식사 변화와 발달 체크를 확인해보세요.', icon:'./assets/icons/icon-192.png'});
      return;
    }
    if(Notification.permission === 'default'){
      requestPermission().then(function(permission){ if(permission === 'granted'){ notifyMonthChanged(babyAge); } });
    }
  }

  return {requestPermission:requestPermission,checkMonthChanged:checkMonthChanged};
})();
