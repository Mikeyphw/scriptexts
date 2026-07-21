"use strict";

document.documentElement.classList.toggle("mrm-android-ui", /Android/i.test(navigator.userAgent || ""));
