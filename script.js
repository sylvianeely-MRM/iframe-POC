// ---------------------------------------------------------------------------
// script.js — Iframe content animation driver (single-iframe, both sections)
//
// Progress (0→1) is received from the parent page via postMessage (widget.js).
// This iframe contains two sections with different scroll depths:
//
//   Showcase: 3000px out of 4500px total → progress 0.000 → 0.667
//   Video:    1500px out of 4500px total → progress 0.667 → 1.000
//
// Each section's progress is normalised to its own 0→1 range.
// These values must match the data-scroll-depth on the parent iframe
// and the SHOWCASE_DEPTH / VIDEO_DEPTH constants below.
// ---------------------------------------------------------------------------

var SHOWCASE_DEPTH = 1600;
var VIDEO_DEPTH    = 800;
var TOTAL_DEPTH    = SHOWCASE_DEPTH + VIDEO_DEPTH;

var SHOWCASE_END   = SHOWCASE_DEPTH / TOTAL_DEPTH; // 0.6667

// ---------------------------------------------------------------------------
// Scroll Showcase — cycles through slides based on a 0→1 progress value.
// Returns applyProgress(p), or null if no showcase is found.
// ---------------------------------------------------------------------------
function setupScrollShowcase() {
    var section  = document.querySelector(".scroll-showcase-section");
    var stage    = document.querySelector(".scroll-showcase-stage");

    if (!section || !stage) return null;

    var images     = Array.from(section.querySelectorAll(".scroll-showcase-image"));
    var copies     = Array.from(section.querySelectorAll("[data-scroll-copy-index]"));
    var triggers   = Array.from(section.querySelectorAll("[data-scroll-trigger-index]"));
    var slideCount = Math.min(images.length, copies.length);

    if (!slideCount) return null;

    var activeIndex = 0;

    function setActiveIndex(nextIndex) {
        if (nextIndex === activeIndex) return;
        activeIndex = nextIndex;

        images.forEach(function(img, i) {
            img.classList.toggle("is-active", i === activeIndex);
        });

        copies.forEach(function(copy, i) {
            var isActive    = i === activeIndex;
            var description = copy.querySelector(".scroll-showcase-copy-description");
            var trigger     = copy.querySelector("[data-scroll-trigger-index]");
            copy.classList.toggle("is-active", isActive);
            if (description) description.setAttribute("aria-hidden", String(!isActive));
            if (trigger)     trigger.setAttribute("aria-pressed", String(isActive));
        });
    }

    triggers.forEach(function(trigger, i) {
        trigger.addEventListener("click", function() { setActiveIndex(i); });
    });

    return function applyProgress(progress) {
        var index = Math.min(Math.floor(progress * slideCount), slideCount - 1);
        setActiveIndex(index);
    };
}

// ---------------------------------------------------------------------------
// Scroll Scrub Video — scrubs video.currentTime based on a 0→1 progress value.
// Returns applyProgress(p), or null if no video is found.
// ---------------------------------------------------------------------------
function setupScrollScrubVideo() {
    var video = document.querySelector("[data-scroll-scrub-video]");

    if (!video) return null;

    var duration = 0;
    var unlocked = false;

    function unlockVideo() {
        if (unlocked) return;
        unlocked = true;
        var p = video.play();
        if (p && typeof p.then === "function") {
            p.then(function() { video.pause(); video.currentTime = 0; }).catch(function() {});
        } else {
            video.pause();
        }
    }

    video.addEventListener("loadedmetadata", function() { duration = video.duration || 0; });
    if (video.readyState >= 1) duration = video.duration || 0;
    video.pause();

    return function applyProgress(progress) {
        if (!duration) return;
        unlockVideo();
        video.currentTime = duration * progress;
    };
}

// ---------------------------------------------------------------------------
// Wire up — receive scrollProgress from widget.js, split into section phases
// ---------------------------------------------------------------------------
var applyShowcaseProgress = setupScrollShowcase();
var applyVideoProgress    = setupScrollScrubVideo();

window.addEventListener("message", function(e) {
    if (!e.data || e.data.type !== "scrollProgress") return;
    var progress = e.data.progress;
    if (typeof progress !== "number") return;

    // Toggle the video phase by class — far more reliable than setting scrollTop
    var inVideoPhase = progress >= SHOWCASE_END;
    document.body.classList.toggle('is-video-phase', inVideoPhase);

    if (applyShowcaseProgress) {
        var showcaseP = Math.min(Math.max(progress / SHOWCASE_END, 0), 1);
        applyShowcaseProgress(showcaseP);
    }

    if (applyVideoProgress) {
        var videoP = Math.min(Math.max((progress - SHOWCASE_END) / (1 - SHOWCASE_END), 0), 1);
        applyVideoProgress(videoP);
    }
});
