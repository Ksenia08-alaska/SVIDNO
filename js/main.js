(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll progress + nav background + auto-hide + hero parallax ----------
     Everything scroll-driven lives in ONE rAF-throttled loop so nothing fights
     for the frame and the page never feels like it's jumping/stuttering. */
  var progressFill = document.getElementById("progressFill");
  var nav = document.getElementById("siteNav");
  var lastScrollY = window.scrollY;
  var navMenuOpen = false;
  var heroSection = document.getElementById("hero");
  var heroMediaEl = heroSection ? heroSection.querySelector(".hero-media") : null;
  var heroLimit = heroSection ? heroSection.offsetHeight : 0;
  window.addEventListener("resize", function(){
    if (heroSection) heroLimit = heroSection.offsetHeight;
  }, { passive: true });

  function onScroll(){
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + "%";
    if (nav) nav.classList.toggle("is-scrolled", scrollTop > 40);

    if (nav && !navMenuOpen){
      var goingDown = scrollTop > lastScrollY + 4;
      var goingUp = scrollTop < lastScrollY - 4;
      if (scrollTop < 80){
        nav.classList.remove("nav-hidden");
      } else if (goingDown){
        nav.classList.add("nav-hidden");
      } else if (goingUp){
        nav.classList.remove("nav-hidden");
      }
    }
    lastScrollY = scrollTop;

    if (heroMediaEl && !reduceMotion && scrollTop < heroLimit + 200){
      var shift = Math.min(scrollTop * 0.15, 60);
      heroMediaEl.style.transform = "translate3d(0," + shift + "px,0)";
    }
  }

  var scrollTicking = false;
  function requestScrollUpdate(){
    if (!scrollTicking){
      scrollTicking = true;
      requestAnimationFrame(function(){
        onScroll();
        scrollTicking = false;
      });
    }
  }
  document.addEventListener("scroll", requestScrollUpdate, { passive: true });
  onScroll();

  /* ---------- Hero: replay entrance animation every time it re-enters view ---------- */
  if (heroSection){
    if ("IntersectionObserver" in window){
      var heroObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          heroSection.classList.toggle("is-inview", entry.isIntersecting);
        });
      }, { threshold: 0.18 });
      heroObserver.observe(heroSection);
    } else {
      heroSection.classList.add("is-inview");
    }
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var navBackdrop = document.getElementById("navBackdrop");

  function staggerNavItems(){
    var items = navLinks.querySelectorAll("a, .nav-cta-mobile");
    items.forEach(function(el, i){
      el.style.transitionDelay = reduceMotion ? "0ms" : (60 + i * 55) + "ms";
    });
  }
  function openNav(){
    staggerNavItems();
    navLinks.classList.add("is-open");
    navToggle.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    if (navBackdrop) navBackdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
    navMenuOpen = true;
    if (nav) nav.classList.remove("nav-hidden");
  }
  function closeNav(){
    navLinks.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    if (navBackdrop) navBackdrop.classList.remove("is-open");
    document.body.style.overflow = "";
    navMenuOpen = false;
  }
  if (navToggle && navLinks){
    navToggle.addEventListener("click", function(){
      if (navLinks.classList.contains("is-open")) closeNav(); else openNav();
    });
    navLinks.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", closeNav);
    });
    if (navBackdrop) navBackdrop.addEventListener("click", closeNav);
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) closeNav();
    });
  }

  /* ---------- Desktop nav sliding pill ---------- */
  var navPill = document.getElementById("navPill");
  if (navPill && window.matchMedia("(min-width:901px)").matches){
    var pillLinks = navLinks.querySelectorAll("a");
    function movePillTo(el){
      if (!el) { navPill.style.opacity = 0; return; }
      var linkRect = el.getBoundingClientRect();
      var parentRect = navLinks.getBoundingClientRect();
      navPill.style.width = linkRect.width + "px";
      navPill.style.transform = "translateX(" + (linkRect.left - parentRect.left) + "px)";
      navPill.style.opacity = 1;
    }
    function currentActive(){ return navLinks.querySelector("a.is-active"); }
    pillLinks.forEach(function(a){
      a.addEventListener("mouseenter", function(){ movePillTo(a); });
    });
    navLinks.addEventListener("mouseleave", function(){ movePillTo(currentActive()); });
    window.addEventListener("resize", function(){ movePillTo(currentActive()); });
    setTimeout(function(){ movePillTo(currentActive()); }, 400);
    // expose for the section observer below
    window.__movePillToActive = function(){ movePillTo(currentActive()); };
  }

  /* ---------- Active nav link on scroll ---------- */
  var navAnchors = document.querySelectorAll("[data-nav]");
  var sections = Array.prototype.map.call(navAnchors, function(a){
    var id = a.getAttribute("href").replace("#", "");
    return document.getElementById(id);
  }).filter(Boolean);

  if ("IntersectionObserver" in window && sections.length){
    var navObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var link = document.querySelector('[data-nav][href="#' + entry.target.id + '"]');
        if (!link) return;
        if (entry.isIntersecting){
          navAnchors.forEach(function(a){ a.classList.remove("is-active"); });
          link.classList.add("is-active");
          if (window.__movePillToActive) window.__movePillToActive();
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    sections.forEach(function(s){ navObserver.observe(s); });
  }

  /* ---------- Generic reveal-on-scroll (replays every time, both directions) ---------- */
  var revealEls = document.querySelectorAll("[data-reveal], .kicker");
  if ("IntersectionObserver" in window && revealEls.length){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.18 });
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------- Stat counters (replay every time they re-enter view) ---------- */
  var stats = document.querySelectorAll(".stat[data-count]");
  function formatNum(n){
    return n.toLocaleString("ru-RU");
  }
  function animateCount(el){
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var numEl = el.querySelector(".stat-num");
    if (el.__counting) return;
    if (reduceMotion){ numEl.textContent = formatNum(target) + suffix; return; }
    el.__counting = true;
    var start = null;
    var duration = 1400;
    function step(ts){
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = Math.round(eased * target);
      numEl.textContent = formatNum(val) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.__counting = false;
      }
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && stats.length){
    var statObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var numEl = entry.target.querySelector(".stat-num");
        if (entry.isIntersecting){
          animateCount(entry.target);
        } else if (numEl && !reduceMotion){
          numEl.textContent = "0" + (entry.target.getAttribute("data-suffix") || "");
        }
      });
    }, { threshold: 0.4 });
    stats.forEach(function(s){ statObserver.observe(s); });
  }

  /* ---------- Product tabs ---------- */
  var tabButtons = document.querySelectorAll(".product-tab");
  var panels = document.querySelectorAll(".product-panel");
  var tabPill = document.getElementById("tabPill");
  var tabList = document.querySelector(".product-tab-list");

  function moveTabPill(btn){
    if (!tabPill || !tabList || !btn) return;
    if (window.matchMedia("(max-width:700px)").matches) return;
    var btnRect = btn.getBoundingClientRect();
    var listRect = tabList.getBoundingClientRect();
    tabPill.style.width = btnRect.width + "px";
    tabPill.style.transform = "translateX(" + (btnRect.left - listRect.left) + "px)";
  }

  tabButtons.forEach(function(btn){
    btn.addEventListener("click", function(){
      var target = btn.getAttribute("data-target");
      tabButtons.forEach(function(b){
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      panels.forEach(function(p){
        p.classList.toggle("is-active", p.id === "panel-" + target);
      });
      moveTabPill(btn);
    });
  });
  window.addEventListener("resize", function(){
    moveTabPill(document.querySelector(".product-tab.is-active"));
  });
  setTimeout(function(){
    moveTabPill(document.querySelector(".product-tab.is-active"));
  }, 500);

  /* ---------- Distance bars fill on view (replays every time) ---------- */
  var distanceItems = document.querySelectorAll("#distanceList li");
  if ("IntersectionObserver" in window && distanceItems.length){
    var maxMinutes = 60;
    var distObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var li = entry.target;
        var bar = li.querySelector(".d-bar i");
        if (!bar) return;
        if (entry.isIntersecting){
          var minutes = parseFloat(li.getAttribute("data-minutes")) || 0;
          requestAnimationFrame(function(){
            bar.style.width = Math.min((minutes / maxMinutes) * 100, 100) + "%";
          });
        } else {
          bar.style.width = "0%";
        }
      });
    }, { threshold: 0.5 });
    distanceItems.forEach(function(li){ distObserver.observe(li); });
  }

  /* ---------- Seasons toggle ---------- */
  var seasonBtns = document.querySelectorAll(".season-btn");
  var seasonPanels = document.querySelectorAll(".season-panel");
  seasonBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      var season = btn.getAttribute("data-season");
      seasonBtns.forEach(function(b){ b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      seasonPanels.forEach(function(p){
        p.classList.toggle("is-active", p.getAttribute("data-season-panel") === season);
      });
    });
  });

  /* ---------- Revenue scenarios ---------- */
  /* Ставки: студия 570 BYN/сутки × 5, вилла 1 800 BYN/сутки, баня от 1 800 BYN/сутки.
     Формула: ставка × загрузка × 365 дней; баня — ставка × число банных дней в году;
     допуслуги — 12% от суммы номеров + виллы + бани (округлено до сотен). */
  var scenarioData = {
    conservative: {
      total: "885 195",
      pct: 50,
      note: "38% загрузка номеров · 30% загрузка виллы · 110 банных дней в году",
      numera: "395 295 BYN", villa: "197 100 BYN", banya: "198 000 BYN", extra: "94 800 BYN",
      fNumera: "5 × 570 × 38% × 365", fVilla: "1 800 × 30% × 365", fBanya: "1 800 × 110 дней", fExtra: "≈12% от суммы выше"
    },
    base: {
      total: "1 312 678",
      pct: 75,
      note: "55% загрузка номеров · 42% загрузка виллы · 180 банных дней в году",
      numera: "572 138 BYN", villa: "275 940 BYN", banya: "324 000 BYN", extra: "140 600 BYN",
      fNumera: "5 × 570 × 55% × 365", fVilla: "1 800 × 42% × 365", fBanya: "1 800 × 180 дней", fExtra: "≈12% от суммы выше"
    },
    strong: {
      total: "1 761 420",
      pct: 100,
      note: "68% загрузка номеров · 55% загрузка виллы · 280 банных дней в году",
      numera: "707 370 BYN", villa: "361 350 BYN", banya: "504 000 BYN", extra: "188 700 BYN",
      fNumera: "5 × 570 × 68% × 365", fVilla: "1 800 × 55% × 365", fBanya: "1 800 × 280 дней", fExtra: "≈12% от суммы выше"
    }
  };
  var scenarioBtns = document.querySelectorAll(".scenario-btn");
  var scenarioNum = document.getElementById("scenarioNum");
  var scenarioBar = document.getElementById("scenarioBar");
  var scenarioNote = document.getElementById("scenarioNote");
  var brNumera = document.getElementById("brNumera");
  var brVilla = document.getElementById("brVilla");
  var brBanya = document.getElementById("brBanya");
  var brExtra = document.getElementById("brExtra");
  var brNumeraF = document.getElementById("brNumeraF");
  var brVillaF = document.getElementById("brVillaF");
  var brBanyaF = document.getElementById("brBanyaF");
  var brExtraF = document.getElementById("brExtraF");

  function setScenario(key){
    var d = scenarioData[key];
    if (!d) return;
    scenarioNum.style.opacity = 0;
    setTimeout(function(){
      scenarioNum.textContent = d.total;
      scenarioNum.style.opacity = 1;
    }, 120);
    scenarioBar.style.width = d.pct + "%";
    scenarioNote.textContent = d.note;
    brNumera.textContent = d.numera;
    brVilla.textContent = d.villa;
    brBanya.textContent = d.banya;
    brExtra.textContent = d.extra;
    if (brNumeraF) brNumeraF.textContent = d.fNumera;
    if (brVillaF) brVillaF.textContent = d.fVilla;
    if (brBanyaF) brBanyaF.textContent = d.fBanya;
    if (brExtraF) brExtraF.textContent = d.fExtra;
  }
  scenarioBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      scenarioBtns.forEach(function(b){ b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      setScenario(btn.getAttribute("data-scenario"));
    });
  });
  // init bar width once visible
  var scenarioBlock = document.getElementById("scenarios");
  if ("IntersectionObserver" in window && scenarioBlock){
    var scObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          setScenario("base");
          obs.unobserve(scenarioBlock);
        }
      });
    }, { threshold: 0.3 });
    scObserver.observe(scenarioBlock);
  }

  /* ---------- Roadmap timeline progress ---------- */
  var timelineSteps = document.querySelectorAll(".timeline-step");
  var timelineProgress = document.getElementById("timelineProgress");
  if ("IntersectionObserver" in window && timelineSteps.length){
    var activeCount = 0;
    var tlObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-active");
        }
      });
      var activeSteps = document.querySelectorAll(".timeline-step.is-active").length;
      var pct = (activeSteps / timelineSteps.length) * 100;
      if (timelineProgress){
        timelineProgress.style.strokeDasharray = "100";
        timelineProgress.style.strokeDashoffset = (100 - pct);
      }
    }, { threshold: 0.5 });
    timelineSteps.forEach(function(s){ tlObserver.observe(s); });
  }

  /* ---------- Gallery filters ---------- */
  var filterBtns = document.querySelectorAll(".gf-btn");
  var galleryItems = document.querySelectorAll(".g-item");
  filterBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      var filter = btn.getAttribute("data-filter");
      filterBtns.forEach(function(b){ b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      galleryItems.forEach(function(item){
        var show = filter === "all" || item.getAttribute("data-filter") === filter;
        item.classList.toggle("is-hidden", !show);
      });
      var grid = document.getElementById("galleryGrid");
      if (grid) grid.classList.toggle("is-filtered", filter !== "all");
    });
  });

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImage = document.getElementById("lbImage");
  var lbCaption = document.getElementById("lbCaption");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var galleryList = Array.prototype.slice.call(galleryItems);
  var currentIndex = -1;

  function openLightbox(index){
    var item = galleryList[index];
    if (!item) return;
    currentIndex = index;
    lbImage.src = item.getAttribute("data-full");
    lbImage.alt = item.getAttribute("data-caption") || "";
    lbCaption.textContent = item.getAttribute("data-caption") || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox(){
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function showRelative(delta){
    if (currentIndex < 0) return;
    var visible = galleryList.filter(function(el){ return !el.classList.contains("is-hidden"); });
    var visibleIdx = visible.indexOf(galleryList[currentIndex]);
    var nextIdx = (visibleIdx + delta + visible.length) % visible.length;
    var nextItem = visible[nextIdx];
    var globalIdx = galleryList.indexOf(nextItem);
    openLightbox(globalIdx);
  }

  galleryList.forEach(function(item, idx){
    item.addEventListener("click", function(){ openLightbox(idx); });
  });
  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", function(){ showRelative(-1); });
  if (lbNext) lbNext.addEventListener("click", function(){ showRelative(1); });
  if (lightbox){
    lightbox.addEventListener("click", function(e){
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function(e){
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showRelative(-1);
    if (e.key === "ArrowRight") showRelative(1);
  });

  /* ---------- Cookie consent ---------- */
  var COOKIE_KEY = "svidno_cookie_consent";
  var cookieBar = document.getElementById("cookieBar");
  var cookieAccept = document.getElementById("cookieAccept");
  var cookieMore = document.getElementById("cookieMore");

  function hasConsent(){
    try { return localStorage.getItem(COOKIE_KEY) === "1"; } catch(e){ return false; }
  }
  function setConsent(){
    try { localStorage.setItem(COOKIE_KEY, "1"); } catch(e){}
  }

  if (cookieBar && !hasConsent()){
    setTimeout(function(){
      cookieBar.classList.add("is-visible");
      document.body.classList.add("cookie-open");
    }, 900);
  }
  if (cookieAccept){
    cookieAccept.addEventListener("click", function(){
      setConsent();
      cookieBar.classList.remove("is-visible");
      document.body.classList.remove("cookie-open");
      loadMap(); // accepting cookies also loads the map
    });
  }
  if (cookieMore){
    cookieMore.addEventListener("click", openPrivacy);
  }

  /* ---------- Map: load on demand ---------- */
  var mapFrame = document.getElementById("mapFrame");
  var mapLoadBtn = document.getElementById("mapLoadBtn");
  function loadMap(){
    if (!mapFrame || mapFrame.querySelector("iframe")) return;
    var src = mapFrame.getAttribute("data-map-src");
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = "Карта расположения SVIDNO HOUSE";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    mapFrame.innerHTML = "";
    mapFrame.appendChild(iframe);
    setConsent();
  }
  if (mapLoadBtn){
    mapLoadBtn.addEventListener("click", loadMap);
  }
  if (hasConsent()) loadMap();

  /* ---------- Privacy modal ---------- */
  var privacyModal = document.getElementById("privacyModal");
  var privacyClose = document.getElementById("privacyClose");
  function openPrivacy(){
    if (!privacyModal) return;
    privacyModal.classList.add("is-open");
    privacyModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closePrivacy(){
    if (!privacyModal) return;
    privacyModal.classList.remove("is-open");
    privacyModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-open-privacy]").forEach(function(btn){
    btn.addEventListener("click", openPrivacy);
  });
  if (privacyClose) privacyClose.addEventListener("click", closePrivacy);
  if (privacyModal){
    privacyModal.addEventListener("click", function(e){
      if (e.target === privacyModal) closePrivacy();
    });
  }

  /* ---------- Chat panel ---------- */
  var chatFab = document.getElementById("chatFab");
  var chatPanel = document.getElementById("chatPanel");
  var chatPanelClose = document.getElementById("chatPanelClose");
  var chatBackdrop = document.getElementById("chatBackdrop");

  function openChat(){
    if (!chatPanel) return;
    chatPanel.classList.add("is-open");
    chatPanel.setAttribute("aria-hidden", "false");
    if (chatBackdrop) chatBackdrop.classList.add("is-open");
    if (chatFab) chatFab.setAttribute("aria-expanded", "true");
  }
  function closeChat(){
    if (!chatPanel) return;
    chatPanel.classList.remove("is-open");
    chatPanel.setAttribute("aria-hidden", "true");
    if (chatBackdrop) chatBackdrop.classList.remove("is-open");
    if (chatFab) chatFab.setAttribute("aria-expanded", "false");
  }
  document.querySelectorAll("[data-open-chat]").forEach(function(btn){
    btn.addEventListener("click", openChat);
  });
  if (chatFab) chatFab.addEventListener("click", function(){
    if (chatPanel.classList.contains("is-open")) closeChat(); else openChat();
  });
  if (chatPanelClose) chatPanelClose.addEventListener("click", closeChat);
  if (chatBackdrop) chatBackdrop.addEventListener("click", closeChat);
  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (chatPanel && chatPanel.classList.contains("is-open")) closeChat();
    if (privacyModal && privacyModal.classList.contains("is-open")) closePrivacy();
  });

  /* ---------- Aerial reel: silent, endless, cross-faded drone clips ----------
     Two <video> elements take turns: one plays, the other quietly loads the
     next clip, then they cross-fade. Every clip is a different shot, played
     once per cycle, so nothing repeats until the whole sequence loops. */
  var reel = document.getElementById("reel");
  if (reel){
    var reelVids = reel.querySelectorAll(".reel-video");
    var reelSegs = Array.prototype.slice.call(reel.querySelectorAll(".reel-seg"));
    var reelToggle = document.getElementById("reelToggle");
    var reelStage = document.getElementById("reelStage");
    var reelCount = document.getElementById("reelCount");
    var reelTitle = document.getElementById("reelTitle");
    var FADE = 0.9;                 // seconds of cross-fade overlap
    var cur = 0;                    // index of the clip on screen
    var front = 0;                  // which <video> element is visible
    var userPaused = reduceMotion;  // respect "reduce motion": start paused
    var inView = false;
    var started = false;
    var switching = false;
    var rafId = null;

    var conn = navigator.connection || {};
    var useSd = window.matchMedia("(max-width:760px)").matches || conn.saveData ||
                /(^|-)2g$|^3g$/.test(conn.effectiveType || "");

    for (var v = 0; v < reelVids.length; v++){
      reelVids[v].muted = true;
      reelVids[v].defaultMuted = true;
      reelVids[v].setAttribute("muted", "");
      reelVids[v].setAttribute("playsinline", "");
      reelVids[v].setAttribute("webkit-playsinline", "");
      reelVids[v].disablePictureInPicture = true;
    }

    function clipSrc(i){
      var s = reelSegs[i];
      return (useSd ? s.getAttribute("data-src-sd") : null) || s.getAttribute("data-src");
    }
    function pad(n){ return (n < 10 ? "0" : "") + n; }
    function setCaption(i){
      reelTitle.classList.add("is-switching");
      setTimeout(function(){
        reelCount.textContent = pad(i + 1) + " / " + pad(reelSegs.length);
        reelTitle.textContent = reelSegs[i].getAttribute("data-title");
        reelTitle.classList.remove("is-switching");
      }, 220);
    }
    function paintSegments(i){
      reelSegs.forEach(function(s, k){
        s.classList.toggle("is-done", k < i);
        s.classList.toggle("is-active", k === i);
        s.querySelector("i").style.width = k < i ? "100%" : "0%";
      });
    }
    function load(el, i){
      if (el.getAttribute("data-idx") === String(i)) return;
      el.setAttribute("data-idx", i);
      el.poster = reelSegs[i].getAttribute("data-poster");
      el.preload = "auto";
      el.src = clipSrc(i);
      el.load();
    }
    function tryPlay(el){
      var p = el.play();
      if (p && p.catch){
        p.catch(function(err){
          // autoplay blocked (e.g. iOS Low Power Mode): show the play button.
          // Other errors (AbortError while switching clips) are harmless.
          if (!err || err.name !== "NotAllowedError") return;
          userPaused = true;
          reel.classList.add("is-paused");
          reelToggle.setAttribute("aria-label", "Смотреть");
        });
      }
    }
    function tick(){
      var el = reelVids[front];
      if (el.duration){
        var bar = reelSegs[cur].querySelector("i");
        bar.style.width = Math.min(el.currentTime / el.duration * 100, 100) + "%";
        if (!switching && el.duration - el.currentTime <= FADE) next();
      }
      rafId = requestAnimationFrame(tick);
    }
    function startTick(){ if (!rafId) rafId = requestAnimationFrame(tick); }
    function stopTick(){ if (rafId){ cancelAnimationFrame(rafId); rafId = null; } }

    function show(i){
      var back = 1 - front;
      var incoming = reelVids[back];
      var outgoing = reelVids[front];
      switching = true;
      load(incoming, i);
      incoming.currentTime = 0;
      cur = i;
      front = back;
      paintSegments(i);
      setCaption(i);
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");
      if (!userPaused && inView) tryPlay(incoming);
      clearTimeout(show.t);
      show.t = setTimeout(function(){
        switching = false;
        var hidden = reelVids[1 - front];
        hidden.pause();
        // pre-load the following clip into the now hidden element
        load(hidden, (cur + 1) % reelSegs.length);
      }, FADE * 1000 + 100);
    }
    function next(){ show((cur + 1) % reelSegs.length); }
    function prev(){ show((cur - 1 + reelSegs.length) % reelSegs.length); }

    function resume(){
      if (userPaused || !inView) return;
      tryPlay(reelVids[front]);
      startTick();
    }
    function pauseNow(){
      reelVids[0].pause(); reelVids[1].pause();
      stopTick();
    }
    function setUserPaused(p){
      userPaused = p;
      reel.classList.toggle("is-paused", p);
      reelToggle.setAttribute("aria-label", p ? "Смотреть" : "Пауза");
      if (p) pauseNow(); else resume();
    }

    function begin(){
      if (started) return;
      started = true;
      load(reelVids[0], 0);
      load(reelVids[1], 1);
      paintSegments(0);
      if (userPaused) reel.classList.add("is-paused");
      resume();
    }

    reelToggle.addEventListener("click", function(){ setUserPaused(!userPaused); });
    reelStage.addEventListener("click", function(){ setUserPaused(!userPaused); });
    reelSegs.forEach(function(s, k){
      s.addEventListener("click", function(){
        if (!started) begin();
        if (k !== cur) show(k);
        if (userPaused) setUserPaused(false);
      });
    });

    // swipe left/right on touch screens
    var touchX = null;
    reel.addEventListener("touchstart", function(e){ touchX = e.touches[0].clientX; }, { passive:true });
    reel.addEventListener("touchend", function(e){
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50){ if (dx < 0) next(); else prev(); }
    }, { passive:true });

    // keep the clip running: if a frame stalls on a slow connection, just wait
    for (var w = 0; w < reelVids.length; w++){
      reelVids[w].addEventListener("ended", function(e){
        if (e.target === reelVids[front] && !switching) next();
      });
    }

    if ("IntersectionObserver" in window){
      // start downloading shortly before the reel scrolls into view
      new IntersectionObserver(function(entries, obs){
        if (entries[0].isIntersecting){ begin(); obs.disconnect(); }
      }, { rootMargin: "400px 0px" }).observe(reel);
      // play only while visible to save battery and data
      new IntersectionObserver(function(entries){
        inView = entries[0].isIntersecting;
        if (inView) resume(); else pauseNow();
      }, { threshold: 0.2 }).observe(reel);
    } else {
      inView = true; begin();
    }
    document.addEventListener("visibilitychange", function(){
      if (document.hidden) pauseNow(); else resume();
    });

    window.__pauseReel = function(){ setUserPaused(true); };
  }

  /* ---------- YouTube review: load the player only on click ---------- */
  var ytLoad = document.getElementById("ytLoad");
  var ytPlayer = document.getElementById("ytPlayer");
  if (ytLoad && ytPlayer){
    ytLoad.addEventListener("click", function(){
      var id = ytPlayer.getAttribute("data-yt");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1&modestbranding=1";
      iframe.title = "Видеообзор SVIDNO HOUSE";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      ytPlayer.innerHTML = "";
      ytPlayer.appendChild(iframe);
      if (window.__pauseReel) window.__pauseReel();
    });
  }

})();