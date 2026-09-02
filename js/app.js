(function(){
  "use strict";
  var SITE = window.SITE;
  var MANIFEST = window.MANIFEST || {};
  var SECTION_ACCENT_CLASSES = ["accent-red","accent-chartreuse","accent-purple","accent-blue"];
  var SECTION_ACCENT_HEX = ["#e81c1c","#bfea0a","#ac21bf","#0086ff"];

  var navList = document.getElementById("navList");
  var contentEl = document.getElementById("content");
  var landingEl = document.getElementById("landing");
  var aboutBtn = document.getElementById("aboutBtn");
  var aboutPanel = document.getElementById("aboutPanel");
  var aboutPhoto = document.getElementById("aboutPhoto");
  var aboutBody = document.getElementById("aboutBody");
  var LINKEDIN_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="2.5" width="19" height="19" rx="3"/><line x1="7.3" y1="10.2" x2="7.3" y2="17"/><circle cx="7.3" cy="6.6" r="0.35" fill="currentColor" stroke="none"/><path d="M11 17v-4.4c0-1.5 1-2.4 2.3-2.4 1.3 0 2.1.9 2.1 2.5V17"/><line x1="11" y1="10.2" x2="11" y2="17"/></svg>';
  var EMAIL_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4.7" width="19" height="14.6" rx="2.2"/><path d="M3 6.8l9 6.4 9-6.4"/></svg>';
  var hamburger = document.getElementById("hamburger");
  var navEl = document.getElementById("nav");
  var widgetText = document.getElementById("widgetText");
  var handHr = document.getElementById("handHr");
  var handMin = document.getElementById("handMin");
  var lightbox = document.getElementById("lightbox");
  var lightboxContent = document.getElementById("lightboxContent");

  var hasRevealed = false;
  var currentGalleryItems = null;
  var currentGalleryIndex = 0;

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
      var title = el("button","nav-section-title " + SECTION_ACCENT_CLASSES[si % SECTION_ACCENT_CLASSES.length], sec.title);
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
        heroWrap.appendChild(buildMedia(heroItems[0], {sound: !!sec.heroSound, isHero:true}));
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
          subBlock.appendChild(buildEmbedGallery(sub.embedUrls, SECTION_ACCENT_HEX[si % SECTION_ACCENT_HEX.length]));
        } else {
          var items = mediaFor(sub.mediaKey);
          subBlock.appendChild(buildGallery(items, sub.mediaKey, SECTION_ACCENT_HEX[si % SECTION_ACCENT_HEX.length]));
        }
        contentEl.appendChild(subBlock);
      });
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

    var prev = el("button","gallery-arrow gallery-prev is-hidden","‹");
    var next = el("button","gallery-arrow gallery-next","›");

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

  function buildGallery(items, key, accent){
    var wrap = el("div","gallery-wrap");
    wrap.style.setProperty("--nav-accent", accent || "#543923");

    var gallery = el("div","gallery");
    gallery.dataset.key = key;

    items.forEach(function(item, idx){
      var cell = el("div","gallery-item");
      cell.dataset.idx = idx;
      var media = buildMedia(item, {sound:false});
      cell.appendChild(media);
      if(item.type === "video"){
        var badge = el("div","sound-badge","🔇");
        badge.addEventListener("click", function(e){
          e.stopPropagation();
          media.muted = !media.muted;
          badge.textContent = media.muted ? "🔇" : "🔊";
        });
        cell.appendChild(badge);
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

  function buildEmbedGallery(urls, accent){
    var wrap = el("div","gallery-wrap");
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
    if(SITE.about.photo){
      aboutPhoto.style.backgroundImage = "url('" + SITE.about.photo + "')";
      aboutPhoto.textContent = "";
    }
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
    aboutBtn.textContent = "\u00d7";
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

  /* ---------- WIDGET: analog clock + illustrated sky tile ---------- */
  var SKY_SVG = {
    clear: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#0086ff"/><circle cx="20" cy="20" r="10" fill="#bfea0a"/></svg>',
    partly: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#0086ff"/><circle cx="14" cy="14" r="7" fill="#bfea0a"/><ellipse cx="23" cy="26" rx="13" ry="8" fill="#543923"/><ellipse cx="15" cy="24" rx="9" ry="6" fill="#543923"/></svg>',
    cloudy: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#cabfae"/><ellipse cx="22" cy="20" rx="14" ry="9" fill="#543923"/><ellipse cx="13" cy="23" rx="10" ry="7" fill="#543923"/></svg>',
    fog: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#cabfae"/><rect y="10" width="40" height="4" fill="#543923" opacity="0.5"/><rect y="18" width="40" height="4" fill="#543923" opacity="0.35"/><rect y="26" width="40" height="4" fill="#543923" opacity="0.5"/></svg>',
    rain: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#005fb3"/><ellipse cx="20" cy="15" rx="14" ry="8" fill="#543923"/><line x1="12" y1="27" x2="9" y2="36" stroke="#f7f3ec" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="27" x2="17" y2="36" stroke="#f7f3ec" stroke-width="2" stroke-linecap="round"/><line x1="28" y1="27" x2="25" y2="36" stroke="#f7f3ec" stroke-width="2" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#0086ff"/><ellipse cx="20" cy="15" rx="13" ry="8" fill="#543923"/><circle cx="12" cy="30" r="1.6" fill="#f7f3ec"/><circle cx="20" cy="33" r="1.6" fill="#f7f3ec"/><circle cx="28" cy="30" r="1.6" fill="#f7f3ec"/></svg>',
    storm: '<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#543923"/><ellipse cx="20" cy="14" rx="14" ry="8" fill="#2e2013"/><polygon points="21,18 15,28 19,28 16,36 26,24 21,24 24,18" fill="#e81c1c"/></svg>'
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
    var skyTile = document.getElementById("skyTile");
    skyTile.innerHTML = SKY_SVG.partly;

    function tick(){
      var now = new Date();
      var parts = new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"numeric",hour12:false,timeZone:"America/New_York"}).formatToParts(now);
      var h = 0, m = 0;
      parts.forEach(function(p){ if(p.type==="hour") h = parseInt(p.value,10); if(p.type==="minute") m = parseInt(p.value,10); });
      var hrDeg = ((h % 12) + m/60) * 30;
      var minDeg = m * 6;
      handHr.setAttribute("transform", "rotate(" + hrDeg + " 20 20)");
      handMin.setAttribute("transform", "rotate(" + minDeg + " 20 20)");

      var dateStr = now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"America/New_York"});
      widgetText.textContent = dateStr + (window.__wxTemp ? " · " + window.__wxTemp : "");
    }
    tick();
    setInterval(tick, 15000);

    fetch("https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=temperature_2m,weather_code&temperature_unit=fahrenheit")
      .then(function(r){ return r.json(); })
      .then(function(data){
        var c = data.current;
        if(!c) return;
        window.__wxTemp = Math.round(c.temperature_2m) + "°F";
        skyTile.innerHTML = SKY_SVG[skyCategory(c.weather_code)];
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
        var shouldPlay = galleryVisible && cell === best && bestDist < cell.getBoundingClientRect().width * 0.6;
        if(shouldPlay){
          if(v.paused){ v.play().catch(function(){}); }
        } else if(!v.paused){
          v.pause();
        }
      });
    });
    requestAnimationFrame(galleryLoop);
  }

  /* ---------- SCROLL-SPY (active nav highlighting) ---------- */
  var SECTION_HEX_BY_SLUG = {};
  SITE.sections.forEach(function(sec, si){ SECTION_HEX_BY_SLUG[sec.slug] = SECTION_ACCENT_HEX[si % SECTION_ACCENT_HEX.length]; });

  function setActiveNav(sectionSlug, subSlug){
    navList.querySelectorAll(".nav-section-title.active").forEach(function(n){ n.classList.remove("active"); });
    navList.querySelectorAll(".nav-sub-item.active").forEach(function(n){ n.classList.remove("active"); n.style.borderBottomColor = ""; });

    var titleEl = navList.querySelector('[data-target="sec-' + sectionSlug + '"]');
    if(subSlug){
      // underline moves down to the subsection; text stays brown, only the underline takes the section's color
      var subEl = navList.querySelector('[data-target="sub-' + sectionSlug + '-' + subSlug + '"]');
      if(subEl){
        subEl.classList.add("active");
        subEl.style.borderBottomColor = SECTION_HEX_BY_SLUG[sectionSlug] || "";
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

  /* ---------- LANDING: click takes you into the first section ---------- */
  function wireLanding(){
    var firstId = "sec-" + SITE.sections[0].slug;
    landingEl.addEventListener("click", function(){ goTo(firstId); });
    landingEl.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); goTo(firstId); }
    });
  }

  /* ---------- INIT ---------- */
  renderNav();
  renderContent();
  renderAbout();
  startWidget();
  initScrollSpy();
  wireLanding();
  requestAnimationFrame(galleryLoop);
})();
