(function(){
  "use strict";
  var SITE = window.SITE;
  var MANIFEST = window.MANIFEST || {};
  var SECTION_ACCENT_CLASSES = ["accent-red","accent-chartreuse","accent-purple","accent-orange"];
  var SECTION_ACCENT_HEX = ["#d13333","#0086ff","#c275d3","#dd9c0b"];

  var navList = document.getElementById("navList");
  var contentEl = document.getElementById("content");
  var landingEl = document.getElementById("landing");
  var aboutBtn = document.getElementById("aboutBtn");
  var aboutPanel = document.getElementById("aboutPanel");
  var aboutBody = document.getElementById("aboutBody");
  var LINKEDIN_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="2.5" width="19" height="19" rx="3"/><line x1="7.3" y1="10.2" x2="7.3" y2="17"/><circle cx="7.3" cy="6.6" r="0.35" fill="currentColor" stroke="none"/><path d="M11 17v-4.4c0-1.5 1-2.4 2.3-2.4 1.3 0 2.1.9 2.1 2.5V17"/><line x1="11" y1="10.2" x2="11" y2="17"/></svg>';
  var EMAIL_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4.7" width="19" height="14.6" rx="2.2"/><path d="M3 6.8l9 6.4 9-6.4"/></svg>';
  var PIXEL_ARROW_SVG = '<svg viewBox="0 0 10 10" shape-rendering="crispEdges"><rect x="3" y="1" width="1" height="1" fill="currentColor"/><rect x="3" y="2" width="2" height="1" fill="currentColor"/><rect x="3" y="3" width="3" height="1" fill="currentColor"/><rect x="3" y="4" width="4" height="1" fill="currentColor"/><rect x="3" y="5" width="3" height="1" fill="currentColor"/><rect x="3" y="6" width="2" height="1" fill="currentColor"/><rect x="3" y="7" width="1" height="1" fill="currentColor"/></svg>';
  var PIXEL_X_SVG = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges"><rect x="0" y="0" width="1" height="1" fill="currentColor"/><rect x="6" y="0" width="1" height="1" fill="currentColor"/><rect x="1" y="1" width="1" height="1" fill="currentColor"/><rect x="5" y="1" width="1" height="1" fill="currentColor"/><rect x="2" y="2" width="1" height="1" fill="currentColor"/><rect x="4" y="2" width="1" height="1" fill="currentColor"/><rect x="3" y="3" width="1" height="1" fill="currentColor"/><rect x="2" y="4" width="1" height="1" fill="currentColor"/><rect x="4" y="4" width="1" height="1" fill="currentColor"/><rect x="1" y="5" width="1" height="1" fill="currentColor"/><rect x="5" y="5" width="1" height="1" fill="currentColor"/><rect x="0" y="6" width="1" height="1" fill="currentColor"/><rect x="6" y="6" width="1" height="1" fill="currentColor"/></svg>';
  var SOUND_ON_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M15.5 12c0-1.77-1-3.3-2.5-4.03v8.06c1.5-.73 2.5-2.26 2.5-4.03z"/><path d="M13 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77z"/></svg>';
  var SOUND_OFF_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M19.8 12l2.5-2.5-1.3-1.3-2.5 2.5-2.5-2.5-1.3 1.3 2.5 2.5-2.5 2.5 1.3 1.3 2.5-2.5 2.5 2.5 1.3-1.3z"/></svg>';
  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var hamburger = document.getElementById("hamburger");
  var navEl = document.getElementById("nav");
  var handHr = document.getElementById("handHr");
  var handMin = document.getElementById("handMin");
  var lightbox = document.getElementById("lightbox");
  var lightboxContent = document.getElementById("lightboxContent");

  var hasRevealed = false;
  var currentGalleryItems = null;
  var currentGalleryIndex = 0;
  var landingAnim = null;

  /* ---------- helpers ---------- */
  function mediaFor(key){ return MANIFEST[key] || []; }
  function el(tag, cls, html){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ---------- NAV RENDER ---------- */
  function renderNav(){
    SITE.sections.forEach(function(sec, si){
      var wrap = el("div","nav-section");
      var title = el("button","nav-section-title " + SECTION_ACCENT_CLASSES[si % SECTION_ACCENT_CLASSES.length], sec.navTitle || sec.title);
      title.dataset.target = "sec-" + sec.slug;
      wrap.appendChild(title);

      var ul = el("ul","nav-sub-list");
      sec.subsections.forEach(function(sub){
        var li = el("li","nav-sub-item", sub.title);
        li.dataset.target = "sub-" + sec.slug + "-" + sub.slug;
        li.style.setProperty("--nav-accent", SECTION_ACCENT_HEX[si % SECTION_ACCENT_HEX.length]);
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
      navList.appendChild(wrap);
    });

    navList.addEventListener("click", function(e){
      var target = e.target.closest("[data-target]");
      if(!target) return;
      if(aboutPanel.classList.contains("open")) closeAbout();
      goTo(target.dataset.target);
      if(window.innerWidth <= 860) closeMobileNav();
    });

    // Waterfall reveal: every row (header or subsection) drops in on its own,
    // very quickly, one after another -- not grouped by section.
    var rows = navList.querySelectorAll(".nav-section-title, .nav-sub-item");
    rows.forEach(function(row, i){
      setTimeout(function(){ row.classList.add("row-in"); }, 60 + i * 45);
    });
  }

  function goTo(id){
    reveal();
    var node = document.getElementById(id);
    if(node){ node.scrollIntoView({behavior:"smooth", block:"start"}); }
  }

  function reveal(){
    if(hasRevealed) return;
    hasRevealed = true;
    landingEl.classList.add("hidden");
    contentEl.classList.add("visible");
    if(landingAnim){ landingAnim.stop(); landingAnim = null; }
  }

  /* ---------- CONTENT RENDER ---------- */
  function renderContent(){
    SITE.sections.forEach(function(sec, si){
      var block = el("div","section-block tinted");
      block.id = "sec-" + sec.slug;
      block.dataset.sectionSlug = sec.slug;

      var head = el("div","section-head");
      head.appendChild(el("h2","section-title " + SECTION_ACCENT_CLASSES[si % SECTION_ACCENT_CLASSES.length], sec.title));
      head.appendChild(el("p","section-intro", sec.intro));
      block.appendChild(head);

      var heroItems = mediaFor(sec.heroKey);
      if(heroItems.length){
        var heroWrap = el("div","hero-media");
        var heroMedia = buildMedia(heroItems[0], {sound: !!sec.heroSound, isHero:true});
        heroWrap.appendChild(heroMedia);
        if(heroItems[0].type === "video"){ wireHeroVideo(heroMedia, heroWrap); }
        block.appendChild(heroWrap);
      }
      contentEl.appendChild(block);

      sec.subsections.forEach(function(sub){
        var subBlock = el("div","section-block subsection");
        subBlock.id = "sub-" + sec.slug + "-" + sub.slug;
        subBlock.dataset.sectionSlug = sec.slug;
        subBlock.dataset.subSlug = sub.slug;
        subBlock.appendChild(el("h3","project-title", sub.title));
        subBlock.appendChild(el("p","project-copy", sub.copy));
        if(sub.credits && sub.credits.length){
          subBlock.appendChild(el("div","project-credits", sub.credits.join("<br>")));
        }

        if(sub.embeds){
          subBlock.appendChild(buildEmbedGallery(sub.embedUrls, SECTION_ACCENT_HEX[si % SECTION_ACCENT_HEX.length], SECTION_ACCENT_CLASSES[si % SECTION_ACCENT_CLASSES.length]));
        } else {
          var items = mediaFor(sub.mediaKey);
          subBlock.appendChild(buildGallery(items, sub.mediaKey, SECTION_ACCENT_HEX[si % SECTION_ACCENT_HEX.length], SECTION_ACCENT_CLASSES[si % SECTION_ACCENT_CLASSES.length], sub.padMedia));
        }
        contentEl.appendChild(subBlock);
      });
    });
  }

  function wireHeroVideo(video, wrap){
    var progress = el("div","hero-progress");
    var progressBar = el("div","hero-progress-bar");
    progress.appendChild(progressBar);
    wrap.appendChild(progress);

    var controls = el("div","hero-controls");
    var playBtn = el("button","hero-btn hero-play", PLAY_SVG);
    playBtn.setAttribute("aria-label","Play or pause");
    var soundBtn = el("button","hero-btn hero-sound", video.muted ? SOUND_OFF_SVG : SOUND_ON_SVG);
    soundBtn.setAttribute("aria-label","Toggle sound");
    soundBtn.addEventListener("click", function(e){
      e.stopPropagation();
      video.muted = !video.muted;
      soundBtn.innerHTML = video.muted ? SOUND_OFF_SVG : SOUND_ON_SVG;
    });
    playBtn.addEventListener("click", function(e){
      e.stopPropagation();
      if(video.paused){ video.play().catch(function(){}); } else { video.pause(); }
    });
    controls.appendChild(playBtn);
    controls.appendChild(soundBtn);
    wrap.appendChild(controls);

    video.addEventListener("play", function(){ playBtn.innerHTML = PAUSE_SVG; });
    video.addEventListener("pause", function(){ playBtn.innerHTML = PLAY_SVG; });
    video.addEventListener("timeupdate", function(){
      if(video.duration){ progressBar.style.width = (video.currentTime/video.duration*100) + "%"; }
    });
  }

  function buildMedia(item, opts){
    opts = opts || {};
    if(item.type === "video"){
      var v = document.createElement("video");
      v.muted = !opts.sound;
      v.loop = true; v.playsInline = true; v.preload = "metadata";
      v.src = item.src;
      if(item.poster) v.poster = item.poster;
      if(opts.isHero){
        v.autoplay = true;
        setTimeout(function(){
          var p = v.play();
          if(p && p.catch){
            p.catch(function(){ v.muted = true; v.play().catch(function(){}); });
          }
        }, 300);
      }
      return v;
    } else {
      var img = document.createElement("img");
      img.src = item.src; img.loading = "lazy"; img.alt = "";
      return img;
    }
  }

  // Shared prev/next chrome for any horizontally-scrolling gallery row.
  // Right arrow is visible by default whenever there's more than one item (no
  // fragile "wait until we can prove it" logic); left arrow stays hidden until
  // the user has actually scrolled. Visibility only recomputes on real scroll/
  // resize events, once layout is guaranteed settled.
  function attachGalleryArrows(wrap, gallery, itemSelector){
    var items = gallery.querySelectorAll(itemSelector);
    if(items.length <= 1) return;

    var prev = el("button","gallery-arrow gallery-prev is-hidden", PIXEL_ARROW_SVG);
    var next = el("button","gallery-arrow gallery-next", PIXEL_ARROW_SVG);

    function cellScrollLeft(cell){
      return cell.getBoundingClientRect().left - gallery.getBoundingClientRect().left + gallery.scrollLeft;
    }
    function scrollToAdjacent(dir){
      var cells = Array.prototype.slice.call(gallery.querySelectorAll(itemSelector));
      var cur = gallery.scrollLeft;
      var target = null;
      if(dir > 0){
        for(var i=0;i<cells.length;i++){
          var l = cellScrollLeft(cells[i]);
          if(l > cur + 10){ target = l; break; }
        }
      } else {
        for(var i=cells.length-1;i>=0;i--){
          var l = cellScrollLeft(cells[i]);
          if(l < cur - 10){ target = l; break; }
        }
      }
      if(target !== null) gallery.scrollTo({left: target, behavior:"smooth"});
    }
    prev.addEventListener("click", function(){ scrollToAdjacent(-1); });
    next.addEventListener("click", function(){ scrollToAdjacent(1); });

    function updateArrowVisibility(){
      var maxScroll = gallery.scrollWidth - gallery.clientWidth;
      prev.classList.toggle("is-hidden", gallery.scrollLeft <= 4);
      if(maxScroll > 8){ next.classList.toggle("is-hidden", gallery.scrollLeft >= maxScroll - 4); }
    }
    gallery.addEventListener("scroll", function(){ requestAnimationFrame(updateArrowVisibility); }, {passive:true});
    window.addEventListener("resize", updateArrowVisibility);

    wrap.appendChild(prev); wrap.appendChild(next);
  }

  function buildGallery(items, key, accent, accentClass, padMedia){
    var wrap = el("div","gallery-wrap" + (accentClass ? " " + accentClass : ""));
    wrap.style.setProperty("--nav-accent", accent || "#543923");

    var gallery = el("div","gallery");
    gallery.dataset.key = key;

    items.forEach(function(item, idx){
      var cell = el("div","gallery-item");
      cell.dataset.idx = idx;
      var shouldPad = padMedia && item.type === "image" && (padMedia === "all" || idx < padMedia);
      if(shouldPad) cell.classList.add("media-padded");
      var media = buildMedia(item, {sound:false});
      cell.appendChild(media);
      if(item.type === "video"){
        var badge = el("div","sound-badge", SOUND_OFF_SVG);
        badge.addEventListener("click", function(e){
          e.stopPropagation();
          media.muted = !media.muted;
          badge.innerHTML = media.muted ? SOUND_OFF_SVG : SOUND_ON_SVG;
        });
        cell.appendChild(badge);

        var pauseBtn = el("button","pause-badge", PAUSE_SVG);
        pauseBtn.setAttribute("aria-label","Play or pause");
        pauseBtn.addEventListener("click", function(e){
          e.stopPropagation();
          if(media.paused){
            delete cell.dataset.userPaused;
            media.play().catch(function(){});
          } else {
            cell.dataset.userPaused = "1";
            media.pause();
          }
        });
        cell.appendChild(pauseBtn);

        var progress = el("div","video-progress");
        var progressBar = el("div","video-progress-bar");
        progress.appendChild(progressBar);
        cell.appendChild(progress);

        var playOverlay = el("div","play-overlay");
        playOverlay.appendChild(el("div","play-overlay-icon", PLAY_SVG));
        cell.appendChild(playOverlay);

        media.addEventListener("play", function(){ cell.classList.add("is-playing"); pauseBtn.innerHTML = PAUSE_SVG; });
        media.addEventListener("pause", function(){ cell.classList.remove("is-playing"); pauseBtn.innerHTML = PLAY_SVG; });
        media.addEventListener("timeupdate", function(){
          if(media.duration){ progressBar.style.width = (media.currentTime/media.duration*100) + "%"; }
        });
      }
      cell.addEventListener("click", function(){
        openLightbox(items, idx);
      });
      gallery.appendChild(cell);
    });
    wrap.appendChild(gallery);
    attachGalleryArrows(wrap, gallery, ".gallery-item");

    galleries.push(gallery);
    return wrap;
  }

  function buildEmbedGallery(urls, accent, accentClass){
    var wrap = el("div","gallery-wrap" + (accentClass ? " " + accentClass : ""));
    wrap.style.setProperty("--nav-accent", accent || "#543923");

    var gallery = el("div","gallery gallery-embeds");
    urls.forEach(function(u){
      if(!u || u.trim() === "https://www.instagram.com/") return;
      var cell = el("div","gallery-item embed-item");
      var bq = document.createElement("blockquote");
      bq.className = "instagram-media";
      bq.setAttribute("data-instgrm-permalink", u);
      bq.setAttribute("data-instgrm-version","14");
      // Fallback content shown until (or unless) Instagram's script replaces this
      // blockquote with the live embed -- without this, a post that fails to embed
      // (deleted, private, rate-limited) just renders as blank empty space.
      bq.innerHTML = '<div class="embed-fallback">' +
        '<span class="embed-fallback-mark">IG</span>' +
        '<a href="' + u + '" target="_blank" rel="noopener">View this post on Instagram &#8599;</a>' +
        '</div>';
      cell.appendChild(bq);
      gallery.appendChild(cell);
    });
    wrap.appendChild(gallery);
    attachGalleryArrows(wrap, gallery, ".embed-item");
    setTimeout(loadInstagramEmbeds, 50);
    return wrap;
  }

  var igScriptLoaded = false;
  function loadInstagramEmbeds(){
    if(!igScriptLoaded){
      igScriptLoaded = true;
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = function(){ if(window.instgrm) window.instgrm.Embeds.process(); };
      document.body.appendChild(s);
    } else if(window.instgrm){
      window.instgrm.Embeds.process();
    }
  }

  /* ---------- LIGHTBOX ---------- */
  function openLightbox(items, idx){
    currentGalleryItems = items;
    currentGalleryIndex = idx;
    renderLightbox();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
  }
  function renderLightbox(){
    lightboxContent.innerHTML = "";
    var item = currentGalleryItems[currentGalleryIndex];
    lightboxContent.appendChild(buildMedia(item, {sound:true, isHero:true}));
  }
  function closeLightbox(){
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden","true");
    lightboxContent.innerHTML = "";
  }
  document.querySelectorAll("[data-lightbox-close]").forEach(function(b){
    b.addEventListener("click", closeLightbox);
  });
  document.querySelector(".lightbox-prev").addEventListener("click", function(){
    if(!currentGalleryItems) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
    renderLightbox();
  });
  document.querySelector(".lightbox-next").addEventListener("click", function(){
    if(!currentGalleryItems) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryItems.length;
    renderLightbox();
  });
  document.addEventListener("keydown", function(e){
    if(!lightbox.classList.contains("open")) return;
    if(e.key === "Escape") closeLightbox();
    if(e.key === "ArrowRight") document.querySelector(".lightbox-next").click();
    if(e.key === "ArrowLeft") document.querySelector(".lightbox-prev").click();
  });

  /* ---------- ABOUT PANEL (confined to the right/work section) ---------- */
  function renderAbout(){
    if(SITE.about.lead){
      aboutBody.appendChild(el("p","about-lead", SITE.about.lead));
    }
    SITE.about.copy.forEach(function(p){
      aboutBody.appendChild(el("p","about-copy-p", p));
    });

    var social = el("div","about-social");
    if(SITE.about.linkedin){
      var linkedinLink = document.createElement("a");
      linkedinLink.href = SITE.about.linkedin;
      linkedinLink.target = "_blank";
      linkedinLink.rel = "noopener";
      linkedinLink.setAttribute("aria-label","LinkedIn");
      linkedinLink.innerHTML = LINKEDIN_SVG;
      social.appendChild(linkedinLink);
    }
    var emailLink = document.createElement("a");
    emailLink.href = "mailto:" + (SITE.about.email || "");
    emailLink.setAttribute("aria-label","Email");
    emailLink.innerHTML = EMAIL_SVG;
    social.appendChild(emailLink);
    aboutBody.appendChild(social);
  }
  function openAbout(){
    aboutPanel.classList.add("open");
    aboutPanel.setAttribute("aria-hidden","false");
    aboutBtn.classList.add("open");
    aboutBtn.innerHTML = PIXEL_X_SVG;
    aboutBtn.setAttribute("aria-label","Close about");
  }
  function closeAbout(){
    aboutPanel.classList.remove("open");
    aboutPanel.setAttribute("aria-hidden","true");
    aboutBtn.classList.remove("open");
    aboutBtn.textContent = "About";
    aboutBtn.setAttribute("aria-label","About");
  }
  aboutBtn.addEventListener("click", function(){
    if(aboutPanel.classList.contains("open")){ closeAbout(); } else { openAbout(); }
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && aboutPanel.classList.contains("open")) closeAbout();
  });

  /* ---------- MOBILE NAV ---------- */
  function closeMobileNav(){
    navEl.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded","false");
  }
  hamburger.addEventListener("click", function(){
    var open = navEl.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", open ? "true":"false");
  });

  /* ---------- WIDGET: big analog clock + date / weather text rows ---------- */
  var WEATHER_EMOJI = {
    clear: "☀️", partly: "⛅", cloudy: "☁️", fog: "🌫️",
    rain: "🌧️", snow: "❄️", storm: "⛈️"
  };
  var WEATHER_LABEL = {
    clear: "Clear", partly: "Partly Cloudy", cloudy: "Cloudy", fog: "Foggy",
    rain: "Rainy", snow: "Snow", storm: "Storms"
  };
  function skyCategory(code){
    if(code === 0) return "clear";
    if([1,2].indexOf(code) > -1) return "partly";
    if(code === 3) return "cloudy";
    if([45,48].indexOf(code) > -1) return "fog";
    if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if(code >= 71 && code <= 77) return "snow";
    if(code >= 95) return "storm";
    return "partly";
  }

  function startWidget(){
    var widgetDate = document.getElementById("widgetDate");
    var widgetWeather = document.getElementById("widgetWeather");

    function tick(){
      var now = new Date();
      var parts = new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"numeric",hour12:false,timeZone:"America/New_York"}).formatToParts(now);
      var h = 0, m = 0;
      parts.forEach(function(p){ if(p.type==="hour") h = parseInt(p.value,10); if(p.type==="minute") m = parseInt(p.value,10); });
      var hrDeg = ((h % 12) + m/60) * 30;
      var minDeg = m * 6;
      handHr.setAttribute("transform", "rotate(" + hrDeg + " 20 20)");
      handMin.setAttribute("transform", "rotate(" + minDeg + " 20 20)");

      widgetDate.textContent = now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"America/New_York"});
      if(window.__wxCategory){
        widgetWeather.textContent = WEATHER_EMOJI[window.__wxCategory] + " " + WEATHER_LABEL[window.__wxCategory] + (window.__wxTemp ? " · " + window.__wxTemp : "");
      }
    }
    tick();
    setInterval(tick, 15000);

    fetch("https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=temperature_2m,weather_code&temperature_unit=fahrenheit")
      .then(function(r){ return r.json(); })
      .then(function(data){
        var c = data.current;
        if(!c) return;
        window.__wxTemp = Math.round(c.temperature_2m) + "°F";
        window.__wxCategory = skyCategory(c.weather_code);
        tick();
      })
      .catch(function(){ /* offline / local preview: skip live weather */ });
  }

  /* ---------- GALLERY AUTOPLAY-WHEN-CENTERED ---------- */
  var galleries = [];
  function galleryLoop(){
    galleries.forEach(function(g){
      var grect = g.getBoundingClientRect();
      var galleryVisible = grect.bottom > 0 && grect.top < window.innerHeight;
      var containerCenter = grect.left + grect.width/2;
      var threshold = Math.max(grect.width * 0.3, 160);
      var items = g.querySelectorAll(".gallery-item");
      var best = null, bestDist = Infinity;
      items.forEach(function(cell){
        var r = cell.getBoundingClientRect();
        var center = r.left + r.width/2;
        var dist = Math.abs(center - containerCenter);
        if(dist < bestDist){ bestDist = dist; best = cell; }
      });
      items.forEach(function(cell){
        var v = cell.querySelector("video");
        if(!v) return;
        var userPaused = cell.dataset.userPaused === "1";
        var shouldPlay = galleryVisible && cell === best && bestDist < threshold && !userPaused;
        if(shouldPlay){
          if(v.paused){ v.play().catch(function(){}); }
        } else if(!v.paused && !userPaused){
          v.pause();
        }
      });
    });
    requestAnimationFrame(galleryLoop);
  }

  /* ---------- SCROLL-SPY (active nav highlighting) ---------- */
  function setActiveNav(sectionSlug, subSlug){
    navList.querySelectorAll(".nav-section-title.active").forEach(function(n){ n.classList.remove("active"); });
    navList.querySelectorAll(".nav-sub-item.active").forEach(function(n){ n.classList.remove("active"); });

    var titleEl = navList.querySelector('[data-target="sec-' + sectionSlug + '"]');
    if(subSlug){
      // underline moves down to the subsection; text stays brown, only the underline (--nav-accent, set per-item in renderNav) takes the section's color
      var subEl = navList.querySelector('[data-target="sub-' + sectionSlug + '-' + subSlug + '"]');
      if(subEl){
        subEl.classList.add("active");
      }
    } else if(titleEl){
      titleEl.classList.add("active");
    }
  }
  function initScrollSpy(){
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          setActiveNav(e.target.dataset.sectionSlug, e.target.dataset.subSlug);
        }
      });
    }, {rootMargin: "-12% 0px -78% 0px", threshold: 0});
    document.querySelectorAll(".section-block").forEach(function(b){ observer.observe(b); });
  }

  /* ---------- LANDING ANIMATION: pixelated color cycle + random work thumbnails ----------
     Experimental -- easy to revert: this whole block, its two DOM hooks in
     index.html (#landingPixels, #landingThumbs), and the .landing-pixels /
     .landing-thumbs* rules in style.css were all added in one commit. */
  function startLandingAnimation(){
    var pixelCtrl = initLandingPixels();
    var thumbCtrl = initLandingThumbs();
    return {
      stop: function(){
        if(pixelCtrl) pixelCtrl.stop();
        if(thumbCtrl) thumbCtrl.stop();
      }
    };
  }

  function initLandingPixels(){
    var canvas = document.getElementById("landingPixels");
    if(!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var COLORS = ["#d8f723", "#d13333", "#c275d3", "#ffc136"]; // green, red, purple, orange
    var CELL = 0.34; // px per pixelated block -- another 10x finer
    var TRANSITION_MS = 200; // faster swap between colors
    var HOLD_MS = 5000; // hold each color longer
    var OTHER_AMP = 0.3; // how much the two non-adjacent colors mix into the noise mid-transition
    var ALPHA = 0.92; // slight blend with the page behind it -- a touch more subtle
    var NOISE_INTERVAL_MS = 32; // throttle the expensive regenerate-and-redraw to ~30fps at this density
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var w = 0, h = 0, cols = 0, rows = 0;
    var colorIndex = 0;
    var phase = "transition";
    var phaseStart = performance.now();
    var raf = null;
    var running = true;
    var lastNoiseDrawTime = -Infinity;
    var dataBuf = null; // reused across frames instead of reallocating every draw

    // fine pixel density is expensive to draw one fillRect per cell, so instead
    // we compute a tiny cols x rows buffer and let the GPU upscale it (nearest-
    // neighbor, so it stays crisply blocky) onto the visible canvas each frame
    var buffer = document.createElement("canvas");
    var bctx = buffer.getContext("2d");

    function hexToRGB(hex){
      var v = parseInt(hex.slice(1), 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }
    var COLOR_RGB = COLORS.map(hexToRGB);

    function toColorHex(){ return COLORS[colorIndex]; }
    // slow at both ends, fast in the middle -- so the tails of the transition
    // stay mostly the color it's coming from / going to, as requested
    function smoothstep(t){ return t * t * (3 - 2 * t); }

    function drawSolid(hex){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = ALPHA;
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    function drawNoise(t){
      if(cols < 1 || rows < 1) return;
      var fromIdx = (colorIndex - 1 + COLORS.length) % COLORS.length;
      var toIdx = colorIndex;
      var otherIdx = [];
      for(var i = 0; i < COLORS.length; i++){ if(i !== fromIdx && i !== toIdx) otherIdx.push(i); }

      // weighted mix across all four colors: from/to dominate the tails (one of
      // them is 100% right at t=0 / t=1), the other two colors bump in only
      // through the middle of the transition so every color gets used without
      // disturbing the gradual from->to read
      var s = smoothstep(t);
      var bump = Math.sin(Math.PI * t) * OTHER_AMP;
      var wFrom = (1 - s) * (1 - bump);
      var wTo = s * (1 - bump);
      var wOther = bump / 2;
      var c1 = wFrom, c2 = c1 + wTo, c3 = c2 + wOther; // remainder (to 1) is the 4th bucket

      var rgbFrom = COLOR_RGB[fromIdx], rgbTo = COLOR_RGB[toIdx];
      var rgbOther1 = COLOR_RGB[otherIdx[0]], rgbOther2 = COLOR_RGB[otherIdx[1]];

      var data = dataBuf;
      for(var i = 0, n = cols * rows; i < n; i++){
        var r = Math.random();
        var rgb = r < c1 ? rgbFrom : r < c2 ? rgbTo : r < c3 ? rgbOther1 : rgbOther2;
        var o = i * 4;
        data[o] = rgb[0]; data[o + 1] = rgb[1]; data[o + 2] = rgb[2]; data[o + 3] = 255;
      }
      buffer.width = cols; buffer.height = rows;
      bctx.putImageData(new ImageData(data, cols, rows), 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = ALPHA;
      ctx.drawImage(buffer, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    function resize(){
      var rect = canvas.parentElement.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      cols = Math.max(1, Math.ceil(w / CELL));
      rows = Math.max(1, Math.ceil(h / CELL));
      dataBuf = new Uint8ClampedArray(cols * rows * 4);
      if(phase === "hold") drawSolid(toColorHex());
    }
    window.addEventListener("resize", resize);
    resize();

    function frame(now){
      if(!running) return;
      var elapsed = now - phaseStart;
      if(phase === "transition"){
        var t = Math.min(1, elapsed / TRANSITION_MS);
        if(t >= 1 || now - lastNoiseDrawTime >= NOISE_INTERVAL_MS){
          drawNoise(t);
          lastNoiseDrawTime = now;
        }
        if(t >= 1){
          phase = "hold";
          phaseStart = now;
          drawSolid(toColorHex());
        }
      } else if(elapsed >= HOLD_MS){
        colorIndex = (colorIndex + 1) % COLORS.length;
        phase = "transition";
        phaseStart = now;
        lastNoiseDrawTime = -Infinity; // force an immediate draw at the start of the new transition
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      stop: function(){
        running = false;
        if(raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      }
    };
  }

  function initLandingThumbs(){
    var wrap = document.getElementById("landingThumbs");
    if(!wrap) return null;
    var pool = [];
    Object.keys(MANIFEST).forEach(function(key){
      (MANIFEST[key] || []).forEach(function(item){
        var src = item.type === "image" ? item.src : item.poster;
        if(src) pool.push(src);
      });
    });
    if(pool.length === 0) return null;

    var lastSrc = null;
    var currentThumb = null;
    var timer = null;
    var running = true;

    function pickSrc(){
      var src, guard = 0;
      do {
        src = pool[Math.floor(Math.random() * pool.length)];
        guard++;
      } while(src === lastSrc && pool.length > 1 && guard < 8);
      lastSrc = src;
      return src;
    }

    function spawn(){
      if(!running) return;
      var src = pickSrc();
      var img = document.createElement("img");
      img.className = "landing-thumb";
      img.src = src;
      img.alt = "";
      img.style.left = "50%";
      img.style.top = "50%";
      var rot = (Math.random() * 10 - 5).toFixed(1);
      img.style.transform = "translate(-50%, -50%) rotate(" + rot + "deg)";
      wrap.appendChild(img);

      var prevThumb = currentThumb;
      currentThumb = img;
      requestAnimationFrame(function(){ img.classList.add("show"); });

      if(prevThumb){
        prevThumb.classList.remove("show");
        setTimeout(function(){
          if(prevThumb.parentNode) prevThumb.parentNode.removeChild(prevThumb);
        }, 450);
      }
    }

    spawn();
    timer = setInterval(spawn, 2500);

    return {
      stop: function(){
        running = false;
        if(timer) clearInterval(timer);
        wrap.innerHTML = "";
      }
    };
  }

  /* ---------- LANDING: click takes you into the first section ---------- */
  function wireLanding(){
    var firstId = "sec-" + SITE.sections[0].slug;
    landingEl.addEventListener("click", function(){ goTo(firstId); });
    landingEl.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); goTo(firstId); }
    });
  }

  /* ---------- SITE NAME: click to jump to top ---------- */
  function wireSiteName(){
    var siteNameEl = document.getElementById("siteName");
    if(!siteNameEl) return;
    siteNameEl.addEventListener("click", function(){
      window.scrollTo({top:0, behavior:"smooth"});
    });
    siteNameEl.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); window.scrollTo({top:0, behavior:"smooth"}); }
    });
  }

  /* ---------- INIT ---------- */
  renderNav();
  renderContent();
  renderAbout();
  startWidget();
  initScrollSpy();
  wireLanding();
  wireSiteName();
  landingAnim = startLandingAnimation();
  requestAnimationFrame(galleryLoop);
})();
