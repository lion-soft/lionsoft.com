document.addEventListener("DOMContentLoaded", () => {

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    const body = document.body;

    /* ------------------------------------------------------------
       Intro loader -> reveal hero
    ------------------------------------------------------------ */
    const loader = document.querySelector(".loader");

    function startSite() {
        body.classList.remove("is-loading");
        body.classList.add("ready");
        loader?.classList.add("done");
    }

    if (reduceMotion) {
        startSite();
    } else {
        window.addEventListener("load", () => setTimeout(startSite, 1250));
        setTimeout(startSite, 3500); // safety net if an image is slow
    }

    /* ------------------------------------------------------------
       Shared mouse state
    ------------------------------------------------------------ */
    const mouse = { x: -9999, y: -9999, active: false };

    window.addEventListener("pointermove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }, { passive: true });

    document.addEventListener("mouseleave", () => { mouse.active = false; });

    /* ------------------------------------------------------------
       Animated background: living particle network + cursor trail
    ------------------------------------------------------------ */
    const canvas = document.getElementById("bg");
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, DPR = 1;
    let particles = [];
    let trail = [];
    let shocks = [];
    let running = true;

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const count = Math.min(Math.floor((W * H) / 15000), 110);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - .5) * .35,
            vy: (Math.random() - .5) * .35,
            r: Math.random() * 1.6 + .6,
            hue: Math.random() < .2 ? "143,134,255" : "45,167,255"
        }));
    }

    resize();
    window.addEventListener("resize", resize);

    document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
        if (running) requestAnimationFrame(draw);
    });

    window.addEventListener("pointerdown", e => {
        shocks.push({ x: e.clientX, y: e.clientY, r: 0 });
    });

    const LINK = 135;
    const MOUSE_LINK = 190;

    function draw() {
        if (!running) return;

        ctx.clearRect(0, 0, W, H);

        // trail
        if (mouse.active && finePointer) {
            trail.push({ x: mouse.x, y: mouse.y, life: 1 });
        }
        trail = trail.filter(t => (t.life -= .035) > 0);
        for (const t of trail) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2 + t.life * 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(45,167,255,${t.life * .18})`;
            ctx.fill();
        }

        // shockwaves from clicks
        shocks = shocks.filter(s => s.r < 320);
        for (const s of shocks) {
            s.r += 9;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(45,167,255,${(1 - s.r / 320) * .35})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // pull gently toward the cursor
            if (mouse.active) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const d = Math.hypot(dx, dy);
                if (d < 220 && d > 1) {
                    p.vx += (dx / d) * .012;
                    p.vy += (dy / d) * .012;
                }
            }

            // push away from click shockwaves
            for (const s of shocks) {
                const dx = p.x - s.x;
                const dy = p.y - s.y;
                const d = Math.hypot(dx, dy);
                if (Math.abs(d - s.r) < 40 && d > 1) {
                    p.vx += (dx / d) * .9;
                    p.vy += (dy / d) * .9;
                }
            }

            // friction + speed limit
            p.vx *= .985;
            p.vy *= .985;
            const sp = Math.hypot(p.vx, p.vy);
            if (sp < .12) {
                p.vx += (Math.random() - .5) * .02;
                p.vy += (Math.random() - .5) * .02;
            }
            if (sp > 2.4) {
                p.vx = (p.vx / sp) * 2.4;
                p.vy = (p.vy / sp) * 2.4;
            }

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -20) p.x = W + 20;
            if (p.x > W + 20) p.x = -20;
            if (p.y < -20) p.y = H + 20;
            if (p.y > H + 20) p.y = -20;

            // node
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.hue},.85)`;
            ctx.fill();

            // links to neighbours
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < LINK * LINK) {
                    const a = (1 - Math.sqrt(d2) / LINK) * .28;
                    ctx.strokeStyle = `rgba(${p.hue},${a})`;
                    ctx.lineWidth = .8;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }

            // links to the cursor
            if (mouse.active) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const d = Math.hypot(dx, dy);
                if (d < MOUSE_LINK) {
                    ctx.strokeStyle = `rgba(120,200,255,${(1 - d / MOUSE_LINK) * .6})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }

        if (!reduceMotion) requestAnimationFrame(draw);
    }

    draw(); // with reduced motion this paints a single still frame

    /* ------------------------------------------------------------
       Custom cursor (dot + lagging ring + page-wide glow)
    ------------------------------------------------------------ */
    if (finePointer && !reduceMotion) {
        root.classList.add("has-cursor");

        const dot = document.querySelector(".cursor-dot");
        const ring = document.querySelector(".cursor-ring");
        const ringLabel = ring.querySelector("span");
        const glow = document.querySelector(".cursor-glow");

        let rx = -100, ry = -100, gx = -100, gy = -100;

        (function loop() {
            dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;

            rx += (mouse.x - rx) * .18;
            ry += (mouse.y - ry) * .18;
            ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

            gx += (mouse.x - gx) * .07;
            gy += (mouse.y - gy) * .07;
            glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;

            requestAnimationFrame(loop);
        })();

        window.addEventListener("pointermove", () => glow.classList.add("on"), { once: true });

        const hoverables = "a, button, input, textarea, [data-magnetic]";

        document.addEventListener("pointerover", e => {
            const target = e.target.closest(hoverables);
            if (!target) return;
            const label = target.closest("[data-cursor]")?.dataset.cursor;
            if (label) {
                ringLabel.textContent = label;
                ring.classList.add("label");
            } else {
                ring.classList.add("hover");
            }
        });

        document.addEventListener("pointerout", e => {
            if (!e.target.closest(hoverables)) return;
            ring.classList.remove("hover", "label");
        });

        document.addEventListener("pointerdown", e => {
            ring.classList.add("down");
            const r = document.createElement("span");
            r.className = "cursor-ripple";
            r.style.left = e.clientX + "px";
            r.style.top = e.clientY + "px";
            document.body.appendChild(r);
            setTimeout(() => r.remove(), 750);
        });

        document.addEventListener("pointerup", () => ring.classList.remove("down"));
    }

    /* ------------------------------------------------------------
       Card spotlight + 3D tilt
    ------------------------------------------------------------ */
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("pointermove", e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
            card.style.setProperty("--my", (e.clientY - rect.top) + "px");
        });
    });

    if (finePointer && !reduceMotion) {
        document.querySelectorAll("[data-tilt]").forEach(el => {
            const max = parseFloat(el.dataset.tilt) || 6;

            el.addEventListener("pointermove", e => {
                const rect = el.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width - .5;
                const py = (e.clientY - rect.top) / rect.height - .5;
                el.style.transition = "transform .1s linear, border-color .4s, box-shadow .4s";
                el.style.transform =
                    `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
            });

            el.addEventListener("pointerleave", () => {
                el.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1), border-color .4s, box-shadow .4s";
                el.style.transform = "";
            });
        });

        /* magnetic buttons */
        document.querySelectorAll("[data-magnetic]").forEach(el => {
            el.addEventListener("pointermove", e => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - (rect.left + rect.width / 2);
                const y = e.clientY - (rect.top + rect.height / 2);
                el.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
            });
            el.addEventListener("pointerleave", () => {
                el.style.transform = "";
            });
        });
    }

    /* ------------------------------------------------------------
       Hero emblem parallax (mouse) + scroll
    ------------------------------------------------------------ */
    const hero = document.querySelector(".hero");
    const emblem = document.querySelector(".emblem");

    if (hero && emblem && finePointer && !reduceMotion) {
        hero.addEventListener("pointermove", e => {
            emblem.style.setProperty("--px", (e.clientX / window.innerWidth - .5).toFixed(3));
            emblem.style.setProperty("--py", (e.clientY / window.innerHeight - .5).toFixed(3));
        });
    }

    /* ------------------------------------------------------------
       Mobile menu
    ------------------------------------------------------------ */
    const menu = document.querySelector(".menu");
    const links = document.querySelector(".links");
    const nav = document.querySelector(".nav");

    menu?.addEventListener("click", () => {
        links.classList.toggle("open");
        nav.classList.toggle("open", links.classList.contains("open"));
        menu.textContent = links.classList.contains("open") ? "✕" : "☰";
    });

    document.querySelectorAll(".links a").forEach(link => {
        link.addEventListener("click", () => {
            links.classList.remove("open");
            nav.classList.remove("open");
            if (menu) menu.textContent = "☰";
        });
    });

    /* ------------------------------------------------------------
       Contact form (same Formspree behaviour as before)
    ------------------------------------------------------------ */
    document.querySelectorAll(".form").forEach(form => {
        form.addEventListener("submit", async e => {
            e.preventDefault();

            const button = form.querySelector("button");
            const oldHTML = button.innerHTML;

            button.textContent = "Sending...";
            button.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: "POST",
                    body: new FormData(form),
                    headers: { "Accept": "application/json" }
                });

                if (response.ok) {
                    button.textContent = "✓ Message Sent";
                    form.reset();
                } else {
                    button.textContent = "✕ Failed to Send";
                }
            } catch (error) {
                button.textContent = "✕ Failed to Send";
            }

            setTimeout(() => {
                button.innerHTML = oldHTML;
                button.disabled = false;
            }, 2200);
        });
    });

    /* ------------------------------------------------------------
       Scroll reveal
    ------------------------------------------------------------ */
    const revealElements = document.querySelectorAll(`
        .about,
        #services .head,
        .service,
        #portfolio .portfolio-head,
        .project,
        .contact-wrap,
        .footer-brand,
        .footer-links,
        .footer-bottom
    `);

    revealElements.forEach(el => el.classList.add("reveal"));

    document.querySelectorAll(".service").forEach((card, i) => {
        card.style.transitionDelay = `${i * 100}ms`;
    });
    document.querySelectorAll(".project").forEach((card, i) => {
        card.style.transitionDelay = `${i * 110}ms`;
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add("show");
            observer.unobserve(el);
            // drop the stagger delay afterwards so tilt/hover stay snappy
            setTimeout(() => { el.style.transitionDelay = ""; }, 1400);
        });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));

    /* ------------------------------------------------------------
       Nav: scrolled state, progress bar, active link + sliding pill
    ------------------------------------------------------------ */
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    document.body.appendChild(progress);

    const navLinks = document.querySelectorAll(".links a");
    const sections = document.querySelectorAll("section[id]");
    const pill = document.querySelector(".nav-pill");

    function movePill() {
        const active = document.querySelector(".links a.active");
        if (!pill || !active) return;
        pill.style.width = active.offsetWidth + "px";
        pill.style.transform = `translateX(${active.offsetLeft}px)`;
        pill.style.opacity = 1;
    }

    function onScroll() {
        const y = window.scrollY;

        nav.classList.toggle("scrolled", y > 30);

        const docH = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";

        let current = "home";
        sections.forEach(section => {
            if (y >= section.offsetTop - 220) current = section.id;
        });

        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            const isActive = href === "#" + current || (current === "home" && href === "index.html");
            link.classList.toggle("active", isActive);
        });

        movePill();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", movePill);
    onScroll();
    window.addEventListener("load", movePill);
    if (document.fonts?.ready) document.fonts.ready.then(movePill);

    /* hover preview for the pill */
    if (finePointer) {
        navLinks.forEach(link => {
            link.addEventListener("pointerenter", () => {
                pill.style.width = link.offsetWidth + "px";
                pill.style.transform = `translateX(${link.offsetLeft}px)`;
            });
        });
        links?.addEventListener("pointerleave", movePill);
    }

    /* ------------------------------------------------------------
       Smooth anchor scrolling (+ ignore empty project link)
    ------------------------------------------------------------ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (!targetId || targetId === "#") {
                e.preventDefault();
                return;
            }
            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - (targetId === "#home" ? 0 : 20);
            window.scrollTo({ top, behavior: "smooth" });
        });
    });

    document.querySelector('a[href="index.html"].active, .links a[href="index.html"]')
        ?.addEventListener("click", e => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

    // project card with no link yet: don't reload the page
    document.querySelectorAll('.projects a[href=""]').forEach(a => {
        a.addEventListener("click", e => e.preventDefault());
    });

});
