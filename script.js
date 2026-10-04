document.addEventListener("DOMContentLoaded", () => {

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    const body = document.body;

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
        setTimeout(startSite, 3500); 
    }


    const mouse = { x: -9999, y: -9999, active: false };

    window.addEventListener("pointermove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }, { passive: true });

    document.addEventListener("mouseleave", () => { mouse.active = false; });


    const canvas = document.getElementById("bg");
    const ctx = canvas.getContext("2d", { alpha: true });
    let W = 0, H = 0;
    let particles = [];
    let shocks = [];
    let running = true;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;           

        const count = Math.min(Math.floor((W * H) / 30000), 52);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - .5) * .4,
            vy: (Math.random() - .5) * .4,
            r: Math.random() * 1.4 + .8
        }));
    }

    resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
    });

    window.addEventListener("pointerdown", e => {
        shocks.push({ x: e.clientX, y: e.clientY, r: 0 });
    });

    const LINK = 125, LINK2 = LINK * LINK;
    const MOUSE_LINK = 180;

    function drawBackground() {
        ctx.clearRect(0, 0, W, H);

        shocks = shocks.filter(s => s.r < 300);
        for (const s of shocks) {
            s.r += 10;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 6.2832);
            ctx.strokeStyle = "rgba(45,167,255," + ((1 - s.r / 300) * .35).toFixed(2) + ")";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            if (mouse.active) {
                const dx = mouse.x - p.x, dy = mouse.y - p.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 48400 && d2 > 1) {          // 220px
                    const d = Math.sqrt(d2);
                    p.vx += (dx / d) * .015;
                    p.vy += (dy / d) * .015;
                }
            }

            for (let k = 0; k < shocks.length; k++) {
                const s = shocks[k];
                const dx = p.x - s.x, dy = p.y - s.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(d - s.r) < 40 && d > 1) {
                    p.vx += (dx / d) * .9;
                    p.vy += (dy / d) * .9;
                }
            }

            p.vx *= .985;
            p.vy *= .985;
            if (Math.abs(p.vx) + Math.abs(p.vy) < .15) {
                p.vx += (Math.random() - .5) * .03;
                p.vy += (Math.random() - .5) * .03;
            }
            const m = 2.2;
            if (p.vx > m) p.vx = m; else if (p.vx < -m) p.vx = -m;
            if (p.vy > m) p.vy = m; else if (p.vy < -m) p.vy = -m;

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
            if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
        }

        ctx.fillStyle = "rgba(80,180,255,.85)";
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.moveTo(p.x + p.r, p.y);
            ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        }
        ctx.fill();

        ctx.lineWidth = 1;
        const buckets = [[], [], []];
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x;
                if (dx > LINK || dx < -LINK) continue;
                const dy = p.y - q.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < LINK2) {
                    buckets[d2 < LINK2 * .25 ? 0 : d2 < LINK2 * .6 ? 1 : 2].push(p.x, p.y, q.x, q.y);
                }
            }
        }
        const alphas = [.32, .2, .09];
        for (let b = 0; b < 3; b++) {
            const arr = buckets[b];
            if (!arr.length) continue;
            ctx.strokeStyle = "rgba(45,167,255," + alphas[b] + ")";
            ctx.beginPath();
            for (let k = 0; k < arr.length; k += 4) {
                ctx.moveTo(arr[k], arr[k + 1]);
                ctx.lineTo(arr[k + 2], arr[k + 3]);
            }
            ctx.stroke();
        }

        if (mouse.active) {
            ctx.strokeStyle = "rgba(120,200,255,.35)";
            ctx.beginPath();
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const dx = p.x - mouse.x, dy = p.y - mouse.y;
                if (dx * dx + dy * dy < MOUSE_LINK * MOUSE_LINK) {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                }
            }
            ctx.stroke();
        }
    }

    
    const useCursor = finePointer && !reduceMotion;
    const ring = document.querySelector(".cursor-ring");
    const ringLabel = ring.querySelector("span");
    const glow = document.querySelector(".cursor-glow");
    let rx = -100, ry = -100, gx = -100, gy = -100;

    if (useCursor) {
        root.classList.add("has-cursor");

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

    let frame = 0;
    function tick() {
        if (running) {
            if (useCursor) {
                rx += (mouse.x - rx) * .3;
                ry += (mouse.y - ry) * .3;
                ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
                gx += (mouse.x - gx) * .12;
                gy += (mouse.y - gy) * .12;
                glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
            }
            drawBackground();
        }
        if (!reduceMotion) requestAnimationFrame(tick);
    }
    tick();

    
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

            el.addEventListener("pointerenter", () => {
                el.style.transition = "transform .12s linear, border-color .4s, box-shadow .4s";
            });

            el.addEventListener("pointermove", e => {
                const rect = el.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width - .5;
                const py = (e.clientY - rect.top) / rect.height - .5;
                el.style.transform =
                    `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
            });

            el.addEventListener("pointerleave", () => {
                el.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1), border-color .4s, box-shadow .4s";
                el.style.transform = "";
            });
        });

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
    
    const hero = document.querySelector(".hero");
    const emblem = document.querySelector(".emblem");

    if (hero && emblem && finePointer && !reduceMotion) {
        hero.addEventListener("pointermove", e => {
            emblem.style.setProperty("--px", (e.clientX / window.innerWidth - .5).toFixed(3));
            emblem.style.setProperty("--py", (e.clientY / window.innerHeight - .5).toFixed(3));
        });
    }


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
            setTimeout(() => { el.style.transitionDelay = ""; }, 1400);
        });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));

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

    if (finePointer) {
        navLinks.forEach(link => {
            link.addEventListener("pointerenter", () => {
                pill.style.width = link.offsetWidth + "px";
                pill.style.transform = `translateX(${link.offsetLeft}px)`;
            });
        });
        links?.addEventListener("pointerleave", movePill);
    }


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

    document.querySelectorAll('.projects a[href=""]').forEach(a => {
        a.addEventListener("click", e => e.preventDefault());
    });

});
