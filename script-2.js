
// ---------------------------------------------------------------------------
// pinStage — manages position:fixed for a stage element within its section.
// Three states:
//   "before"  — section hasn't reached the pin point yet → relative, top:0
//   "active"  — section is in the scroll zone → fixed to viewport
//   "after"   — section has scrolled past → absolute, pinned to section bottom
// This keeps the frame visually locked in place throughout the scroll range.
// ---------------------------------------------------------------------------
function pinStage(section, stage) {
    const getHeaderOffset = () =>
        parseFloat(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-offset')) || 0;

    const update = () => {
        const headerOffset = getHeaderOffset();
        const sectionRect = section.getBoundingClientRect();
        const stageH = stage.offsetHeight;

        if (sectionRect.top > headerOffset) {
            // Section top is still below the pin point — sit at top of section
            stage.style.cssText = 'position:relative;top:0;left:0;width:100%';
        } else if (sectionRect.bottom <= stageH + headerOffset) {
            // Section is ending — pin stage to the bottom of the section
            stage.style.cssText =
                `position:absolute;top:${section.offsetHeight - stageH}px;left:0;width:100%`;
        } else {
            // Active scroll zone — fix stage in the viewport
            const left = sectionRect.left;
            const width = section.offsetWidth;
            stage.style.cssText =
                `position:fixed;top:${headerOffset}px;left:${left}px;width:${width}px`;
        }
    };

    return update;
}

// ---------------------------------------------------------------------------
// Scroll Showcase — drives a fixed image/copy carousel by scroll position.
// The stage is held in place via JS-managed fixed positioning (pinStage).
// As the user scrolls through the tall section, the active slide advances.
// ---------------------------------------------------------------------------
function setupScrollShowcase() {
    const section = document.querySelector(".scroll-showcase-section");
    const stage = document.querySelector(".scroll-showcase-stage");

    if (!section || !stage) {
        return;
    }

    const images = Array.from(section.querySelectorAll(".scroll-showcase-image"));
    const copies = Array.from(section.querySelectorAll("[data-scroll-copy-index]"));
    const triggers = Array.from(section.querySelectorAll("[data-scroll-trigger-index]"));
    const slideCount = Math.min(images.length, copies.length);

    if (!slideCount) {
        return;
    }

    section.style.setProperty("--showcase-count", String(slideCount));

    let activeIndex = 0;
    let rafId = 0;

    const updateStagePin = pinStage(section, stage);

    const setActiveIndex = (nextIndex) => {
        if (nextIndex === activeIndex) return;
        activeIndex = nextIndex;

        images.forEach((image, i) => {
            image.classList.toggle("is-active", i === activeIndex);
        });

        copies.forEach((copy, i) => {
            const isActive = i === activeIndex;
            const description = copy.querySelector(".scroll-showcase-copy-description");
            const trigger = copy.querySelector("[data-scroll-trigger-index]");
            copy.classList.toggle("is-active", isActive);
            if (description) description.setAttribute("aria-hidden", String(!isActive));
            if (trigger) trigger.setAttribute("aria-pressed", String(isActive));
        });
    };

    const updateShowcase = () => {
        rafId = 0;

        const headerOffset = parseFloat(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-offset')) || 0;
        const rect = section.getBoundingClientRect();
        const scrollRange = Math.max(section.offsetHeight - stage.offsetHeight, 1);
        const progress = Math.min(Math.max((headerOffset - rect.top) / scrollRange, 0), 1);
        const nextIndex = Math.min(Math.floor(progress * slideCount), slideCount - 1);

        setActiveIndex(nextIndex);
    };

    const requestUpdate = () => {
        // Pin position synchronously — must not be deferred or fast scroll causes jumps
        updateStagePin();
        // Slide animation can be rAF-deferred since CSS transitions handle smoothness
        if (!rafId) rafId = window.requestAnimationFrame(updateShowcase);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", () => { updateStagePin(); requestUpdate(); });

    triggers.forEach((trigger, index) => {
        trigger.addEventListener("click", () => setActiveIndex(index));
    });

    updateStagePin();
    requestUpdate();
}

// ---------------------------------------------------------------------------
// Scroll Scrub Video — scrubs a video's playhead in sync with scroll position.
// The stage is held in place via JS-managed fixed positioning (pinStage).
// ---------------------------------------------------------------------------
function setupScrollScrubVideo() {
    const videoSection = document.querySelector(".video-scrub-section");
    const videoStage = document.querySelector(".video-scrub-stage");
    const video = document.querySelector("[data-scroll-scrub-video]");

    if (!videoSection || !video) {
        return;
    }

    let rafId = 0;
    let duration = 0;

    const updateStagePin = videoStage ? pinStage(videoSection, videoStage) : () => {};

    const updateVideoProgress = () => {
        rafId = 0;
        if (!duration) return;

        const headerOffset = parseFloat(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-offset')) || 0;
        const rect = videoSection.getBoundingClientRect();
        const stageH = videoStage ? videoStage.offsetHeight : 0;
        const scrollRange = Math.max(videoSection.offsetHeight - stageH, 1);
        const progress = Math.min(Math.max((headerOffset - rect.top) / scrollRange, 0), 1);

        video.currentTime = duration * progress;
    };

    const requestUpdate = () => {
        // Pin position synchronously — must not be deferred or fast scroll causes jumps
        updateStagePin();
        if (!rafId) rafId = window.requestAnimationFrame(updateVideoProgress);
    };

    video.addEventListener("loadedmetadata", () => {
        duration = video.duration || 0;
        requestUpdate();
    });

    if (video.readyState >= 1) {
        duration = video.duration || 0;
    }

    let unlocked = false;
    const unlockVideo = () => {
        if (unlocked) return;
        unlocked = true;
        const p = video.play();
        if (p && typeof p.then === "function") {
            p.then(() => {
                video.pause();
                video.currentTime = 0;
                requestUpdate();
            }).catch(() => {});
        } else {
            video.pause();
        }
        window.removeEventListener("touchstart", unlockVideo);
        window.removeEventListener("scroll", unlockVideo);
    };

    video.pause();
    window.addEventListener("touchstart", unlockVideo, { passive: true, once: true });
    window.addEventListener("scroll", unlockVideo, { passive: true, once: true });
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", () => { updateStagePin(); requestUpdate(); });

    updateStagePin();
    requestUpdate();
}

setupScrollShowcase();
setupScrollScrubVideo();
