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
    var visible = galleryList.filter(function(el){ return !el.classList.contains("is-hidden"); });
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
    if (!lightbox.classList.contains("is-open")) return;
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

})();