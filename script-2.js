
// ---------------------------------------------------------------------------
// script-2.js — Iframe content animation driver
//
// Animations are driven by scroll progress (0→1) received via postMessage
// from the parent page (widget.js). No window scroll events needed here.
//
// Message format: { type: 'scrollProgress', progress: <0–1> }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Scroll Showcase — cycles through slides based on progress value.
// Returns an applyProgress(progress) function, or null if no showcase found.
// ---------------------------------------------------------------------------
function setupScrollShowcase() {
    const section  = document.querySelector(".scroll-showcase-section");
    const stage    = document.querySelector(".scroll-showcase-stage");

    if (!section || !stage) return null;

    const images     = Array.from(section.querySelectorAll(".scroll-showcase-image"));
    const copies     = Array.from(section.querySelectorAll("[data-scroll-copy-index]"));
    const triggers   = Array.from(section.querySelectorAll("[data-scroll-trigger-index]"));
    const slideCount = Math.min(images.length, copies.length);

    if (!slideCount) return null;

    let activeIndex = 0;

    const setActiveIndex = (nextIndex) => {
        if (nextIndex === activeIndex) return;
        activeIndex = nextIndex;

        images.forEach((img, i) =>
            img.classList.toggle("is-active", i === activeIndex));

        copies.forEach((copy, i) => {
            const isActive    = i === activeIndex;
            const description = copy.querySelector(".scroll-showcase-copy-description");
            const trigger     = copy.querySelector("[data-scroll-trigger-index]");
            copy.classList.toggle("is-active", isActive);
            if (description) description.setAttribute("aria-hidden", String(!isActive));
            if (trigger)     trigger.setAttribute("aria-pressed", String(isActive));
        });
    };

    // Allow manual trigger clicks to override progress
    triggers.forEach((trigger, i) =>
        trigger.addEventListener("click", () => setActiveIndex(i)));

    return function applyProgress(progress) {
        const index = Math.min(Math.floor(progress * slideCount), slideCount - 1);
        setActiveIndex(index);
    };
}

// ---------------------------------------------------------------------------
// Scroll Scrub Video — scrubs video.currentTime based on progress value.
// Returns an applyProgress(progress) function, or null if no video found.
// ---------------------------------------------------------------------------
function setupScrollScrubVideo() {
    const video = document.querySelector("[data-scroll-scrub-video]");

    if (!video) return null;

    let duration = 0;
    let unlocked = false;

    // Video must be "played" at least once to allow programmatic currentTime seeks
    const unlockVideo = () => {
        if (unlocked) return;
        unlocked = true;
        const p = video.play();
        if (p && typeof p.then === "function") {
            p.then(() => { video.pause(); video.currentTime = 0; }).catch(() => {});
        } else {
            video.pause();
        }
    };

    video.addEventListener("loadedmetadata", () => { duration = video.duration || 0; });
    if (video.readyState >= 1) duration = video.duration || 0;

    video.pause();

    return function applyProgress(progress) {
        if (!duration) return;
        unlockVideo();
        video.currentTime = duration * progress;
    };
}

// ---------------------------------------------------------------------------
// Wire up — listen for scrollProgress messages from widget.js on the parent
// ---------------------------------------------------------------------------
const applyShowcaseProgress = setupScrollShowcase();
const applyVideoProgress    = setupScrollScrubVideo();

window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "scrollProgress") return;
    const progress = e.data.progress;
    if (typeof progress !== "number") return;

    if (applyShowcaseProgress) applyShowcaseProgress(progress);
    if (applyVideoProgress)    applyVideoProgress(progress);
});
