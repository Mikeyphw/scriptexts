"use strict";

const isAndroid = /Android/i.test(navigator.userAgent || "");
document.documentElement.classList.toggle("nxq-android-ui", isAndroid);
document.documentElement.dataset.platform = isAndroid ? "android" : "desktop";
