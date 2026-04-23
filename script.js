// ---------------------------------------------------------------------------
// CTA Button — updates the status message text when the button is clicked,
// providing lightweight feedback for the prototype interaction test.
// ---------------------------------------------------------------------------
const ctaButton = document.getElementById("cta-button");
const statusMessage = document.getElementById("status-message");

if (ctaButton && statusMessage) {
    ctaButton.addEventListener("click", () => {
        statusMessage.textContent = "Interaction confirmed.";
    });
}

// ---------------------------------------------------------------------------
// Scroll Showcase — drives a sticky image/copy carousel by scroll position.
// As the user scrolls through the tall section, the active slide advances
// proportionally. Slides can also be changed by clicking the copy triggers.
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

    // Keep the CSS --showcase-count var in sync with the actual slide count
    // so the section height calculation in CSS stays accurate.
    section.style.setProperty("--showcase-count", String(slideCount));

    let activeIndex = 0;
    let rafId = 0;
    let selectedIndex = 0;

    // Toggles the is-active class on images and copy panels, and keeps
    // aria-hidden / aria-pressed attributes in sync for accessibility.
    const setActiveIndex = (nextIndex) => {
        if (nextIndex === activeIndex) {
            return;
        }

        activeIndex = nextIndex;

        images.forEach((image, index) => {
            image.classList.toggle("is-active", index === activeIndex);
        });

        copies.forEach((copy, index) => {
            const isActive = index === activeIndex;
            const description = copy.querySelector(".scroll-showcase-copy-description");
            const trigger = copy.querySelector("[data-scroll-trigger-index]");

            copy.classList.toggle("is-active", isActive);

            if (description) {
                description.setAttribute("aria-hidden", String(!isActive));
            }

            if (trigger) {
                trigger.setAttribute("aria-pressed", String(isActive));
            }
        });
    };

    // Calculates scroll progress within the section (0–1) and maps it to a
    // slide index. Uses the sticky element's computed top offset as the start
    // anchor so the first slide activates exactly when the stage becomes sticky.
    const updateShowcase = () => {
        rafId = 0;

        const rect = section.getBoundingClientRect();
        const stickyTop = parseFloat(window.getComputedStyle(stage).top) || 0;
        const startOffset = stickyTop;
        const scrollRange = Math.max(section.offsetHeight - window.innerHeight - startOffset, 1);
        const progress = Math.min(Math.max((startOffset - rect.top) / scrollRange, 0), 1);
        const nextIndex = Math.min(Math.floor(progress * slideCount), slideCount - 1);

        selectedIndex = nextIndex;

        setActiveIndex(nextIndex);
    };

    // Debounces updates via requestAnimationFrame to avoid redundant
    // recalculations on every scroll and resize event.
    const requestUpdate = () => {
        if (!rafId) {
            rafId = window.requestAnimationFrame(updateShowcase);
        }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    // Allow manual slide selection by clicking a copy trigger button.
    triggers.forEach((trigger, index) => {
        trigger.addEventListener("click", () => {
            selectedIndex = index;
            setActiveIndex(index);
        });
    });

    requestUpdate();
}

// ---------------------------------------------------------------------------
// Scroll Scrub Video — scrubs a video's playhead in sync with scroll position.
// The video is paused at all times; currentTime is set directly so the video
// acts as a frame-accurate animation driven by the user's scroll depth.
// ---------------------------------------------------------------------------
function setupScrollScrubVideo() {
    const videoSection = document.querySelector(".video-scrub-section");
    const video = document.querySelector("[data-scroll-scrub-video]");

    if (!videoSection || !video) {
        return;
    }

    let rafId = 0;
    let duration = 0;

    // Maps scroll progress through the section (0–1) to a time offset within
    // the video's total duration and sets currentTime accordingly.
    const updateVideoProgress = () => {
        rafId = 0;

        if (!duration) {
            return;
        }

        const rect = videoSection.getBoundingClientRect();
        const scrollRange = Math.max(videoSection.offsetHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max(-rect.top / scrollRange, 0), 1);

        video.currentTime = duration * progress;
    };

    // Debounces updates via requestAnimationFrame to avoid redundant
    // recalculations on every scroll and resize event.
    const requestUpdate = () => {
        if (!rafId) {
            rafId = window.requestAnimationFrame(updateVideoProgress);
        }
    };

    // Capture duration once metadata is available; also handles the case where
    // metadata is already loaded before this script runs (readyState >= 1).
    video.addEventListener("loadedmetadata", () => {
        duration = video.duration || 0;
        requestUpdate();
    });

    if (video.readyState >= 1) {
        duration = video.duration || 0;
    }

    // Android Chrome blocks currentTime seeking until the video has been
    // started at least once by a user gesture. A play→pause cycle on the
    // first scroll or touch event unlocks seeking without any visible flash.
    let unlocked = false;
    const unlockVideo = () => {
        if (unlocked) {
            return;
        }
        unlocked = true;
        const p = video.play();
        if (p && typeof p.then === "function") {
            p.then(() => {
                video.pause();
                // Force an initial frame decode so subsequent currentTime
                // assignments render immediately on Android.
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
    window.addEventListener("resize", requestUpdate);
    requestUpdate();
}

setupScrollShowcase();
setupScrollScrubVideo();
