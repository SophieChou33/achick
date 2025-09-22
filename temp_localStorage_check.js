console.log('=== localStorage 內容檢查 ==='); Object.keys(localStorage).filter(key => key.startsWith('achick_')).forEach(key => console.log(key + ':', localStorage.getItem(key)));
