(function(){
  "use strict";
  var SITE = window.SITE;
  var MANIFEST = window.MANIFEST || {};
  var SECTION_ACCENT_CLASSES = ["accent-red","accent-chartreuse","accent-purple","accent-orange"];
  var GALLERY_ACCENT_HEX = ["#e81c1c","#dcff5f","#b573bc"];

  var navList = document.getElementById("navList");
  var contentEl = document.getElementById("content");
  var landingEl = document.getElementById("landing");
  var aboutBtn = document.getElementById("aboutBtn");
  var aboutModal = document.getElementById("aboutModal");
  var aboutBody = document.getElementById("aboutBody");
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
  var galleryColorCounter = 0;

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
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
      navList.appendChild(wrap);
    });

    navList.addEventListener("click", function(e){
      var target = e.target.closest("[data-target]");
      if(!target) return;
      goTo(target.dataset.target);
      if(window.innerWidth <= 860) closeMobileNav();
    });

    var groups = navList.querySelectorAll(".nav-section");
    groups.forEach(function(g, i){
      setTimeout(function(){ g.classList.add("unfolded"); }, 70 + i * 90);
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
      head.appendChild(el("h2","section-title", sec.title));
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
          subBlock.appendChild(buildEmbedGrid(sub.embedUrls));
        } else {
          var items = mediaFor(sub.mediaKey);
          subBlock.appendChild(buildGallery(items, sub.mediaKey));
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

  function buildGallery(items, key){
    var wrap = el("div","gallery-wrap");
    var accent = GALLERY_ACCENT_HEX[galleryColorCounter % GALLERY_ACCENT_HEX.length];
    galleryColorCounter++;
    wrap.style.setProperty("--nav-accent", accent);

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

    if(items.length > 1){
      var prev = el("button","gallery-arrow gallery-prev is-hidden","‹");
      var next = el("button","gallery-arrow gallery-next","›");

      function cellScrollLeft(cell){
        return cell.getBoundingClientRect().left - gallery.getBoundingClientRect().left + gallery.scrollLeft;
      }
      function scrollToAdjacent(dir){
        var cells = Array.prototype.slice.call(gallery.querySelectorAll(".gallery-item"));
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
        next.classList.toggle("is-hidden", gallery.scrollLeft >= maxScroll - 4 || maxScroll <= 0);
      }
      gallery.addEventListener("scroll", function(){ requestAnimationFrame(updateArrowVisibility); }, {passive:true});
      window.addEventListener("resize", updateArrowVisibility);
      setTimeout(updateArrowVisibility, 250);

      wrap.appendChild(prev); wrap.appendChild(next);
    }

    galleries.push(gallery);
    return wrap;
  }

  function buildEmbedGrid(urls){
    var grid = el("div","embed-grid");
    urls.forEach(function(u){
      if(!u || u.trim() === "https://www.instagram.com/") return;
      var cell = el("div","embed-cell");
      var bq = document.createElement("blockquote");
      bq.className = "instagram-media";
      bq.setAttribute("data-instgrm-permalink", u);
      bq.setAttribute("data-instgrm-version","14");
      cell.appendChild(bq);
      grid.appendChild(cell);
    });
    setTimeout(loadInstagramEmbeds, 50);
    return grid;
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

  /* ---------- ABOUT MODAL ---------- */
  function renderAbout(){
    aboutBody.appendChild(el("div","about-photo","photo"));
    aboutBody.appendChild(el("div","about-name", SITE.name));
    SITE.about.copy.forEach(function(p){
      aboutBody.appendChild(el("p", null, p));
    });
  }
  aboutBtn.addEventListener("click", function(){
    aboutModal.classList.add("open");
    aboutModal.setAttribute("aria-hidden","false");
  });
  document.querySelectorAll("#aboutModal [data-close]").forEach(function(b){
    b.addEventListener("click", function(){
      aboutModal.classList.remove("open");
      aboutModal.setAttribute("aria-hidden","true");
    });
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

  /* ---------- WIDGET: analog clock + weather emoji ---------- */
  function startWidget(){
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
      var timeStr = now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/New_York"});
      widgetText.innerHTML = '<span class="w-emoji">' + (window.__wxEmoji || "🌤") + '</span>' +
        timeStr + " EST · " + dateStr + (window.__wxTemp ? " · " + window.__wxTemp : "") +
        '<span class="w-loc">Brooklyn, NY</span>';
    }
    tick();
    setInterval(tick, 15000);

    fetch("https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=temperature_2m,weather_code&temperature_unit=fahrenheit")
      .then(function(r){ return r.json(); })
      .then(function(data){
        var c = data.current;
        if(!c) return;
        window.__wxTemp = Math.round(c.temperature_2m) + "°F";
        window.__wxEmoji = weatherEmoji(c.weather_code);
        tick();
      })
      .catch(function(){ /* offline / local preview: skip live weather */ });
  }
  function weatherEmoji(code){
    if(code === 0) return "☀️";
    if([1,2].indexOf(code) > -1) return "🌤";
    if(code === 3) return "☁️";
    if([45,48].indexOf(code) > -1) return "🌫";
    if(code >= 51 && code <= 67) return "🌧";
    if(code >= 71 && code <= 77) return "❄️";
    if(code >= 80 && code <= 82) return "🌦";
    if(code >= 95) return "⛈";
    return "🌤";
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
  function setActiveNav(sectionSlug, subSlug){
    navList.querySelectorAll(".nav-section-title.active").forEach(function(n){ n.classList.remove("active"); });
    navList.querySelectorAll(".nav-sub-item.active").forEach(function(n){ n.classList.remove("active"); });
    var titleEl = navList.querySelector('[data-target="sec-' + sectionSlug + '"]');
    if(titleEl) titleEl.classList.add("active");
    if(subSlug){
      var subEl = navList.querySelector('[data-target="sub-' + sectionSlug + '-' + subSlug + '"]');
      if(subEl) subEl.classList.add("active");
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

  /* ---------- INIT ---------- */
  renderNav();
  renderContent();
  renderAbout();
  startWidget();
  initScrollSpy();
  requestAnimationFrame(galleryLoop);
})();
