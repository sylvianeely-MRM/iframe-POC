const ctaButton = document.getElementById("cta-button");
const statusMessage = document.getElementById("status-message");

if (ctaButton && statusMessage) {
    ctaButton.addEventListener("click", () => {
        statusMessage.textContent = "Interaction confirmed.";
    });
}

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
    let selectedIndex = 0;

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

    const requestUpdate = () => {
        if (!rafId) {
            rafId = window.requestAnimationFrame(updateShowcase);
        }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    triggers.forEach((trigger, index) => {
        trigger.addEventListener("click", () => {
            selectedIndex = index;
            setActiveIndex(index);
        });
    });

    requestUpdate();
}

function setupScrollScrubVideo() {
    const videoSection = document.querySelector(".video-scrub-section");
    const video = document.querySelector("[data-scroll-scrub-video]");

    if (!videoSection || !video) {
        return;
    }

    let rafId = 0;
    let duration = 0;

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

    const requestUpdate = () => {
        if (!rafId) {
            rafId = window.requestAnimationFrame(updateVideoProgress);
        }
    };

    video.addEventListener("loadedmetadata", () => {
        duration = video.duration || 0;
        requestUpdate();
    });

    if (video.readyState >= 1) {
        duration = video.duration || 0;
    }

    video.pause();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();
}

setupScrollShowcase();
setupScrollScrubVideo();
