document.addEventListener("DOMContentLoaded", () => {

    

    const menu = document.querySelector(".menu");
    const links = document.querySelector(".links");

    menu?.addEventListener("click", () => {
        links.classList.toggle("open");

        if (links.classList.contains("open")) {
            menu.textContent = "✕";
        } else {
            menu.textContent = "☰";
        }
    });




    document.querySelectorAll(".links a").forEach(link => {

        link.addEventListener("click", () => {

            links.classList.remove("open");

            if (menu) {
                menu.textContent = "☰";
            }

        });

    });




    document.querySelectorAll(".form").forEach(form => {

        form.addEventListener("submit", async (e) => {

            e.preventDefault();

            const button = form.querySelector("button");
            const oldText = button.textContent;

            button.textContent = "Sending...";
            button.disabled = true;

            try {

                const response = await fetch(form.action, {

                    method: "POST",

                    body: new FormData(form),

                    headers: {
                        "Accept": "application/json"
                    }

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

                button.textContent = oldText;
                button.disabled = false;

            }, 2200);

        });

    });




    const revealElements = document.querySelectorAll(`
        .about,
        #services .eyebrow,
        #services h2,
        #services .lead,
        .service,
        #portfolio .portfolio-head,
        .project,
        .contact-wrap,
        .footer-brand,
        .footer-links,
        .footer-bottom
    `);

    revealElements.forEach(element => {
        element.classList.add("reveal");
    });


    const revealObserver = new IntersectionObserver(
        (entries, observer) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);

                }

            });

        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );


    revealElements.forEach(element => {
        revealObserver.observe(element);
    });




    document.querySelectorAll(".service").forEach((card, index) => {

        card.style.transitionDelay =
            `${index * 100}ms`;

    });



    document.querySelectorAll(".project").forEach((card, index) => {

        card.style.transitionDelay =
            `${index * 120}ms`;

    });



    const nav = document.querySelector(".nav");

    window.addEventListener("scroll", () => {

        if (!nav) return;

        if (window.scrollY > 30) {

            nav.classList.add("scrolled");

        } else {

            nav.classList.remove("scrolled");

        }

    }, { passive: true });



    const progress = document.createElement("div");

    progress.className = "scroll-progress";

    document.body.appendChild(progress);


    window.addEventListener("scroll", () => {

        const scrollTop = window.scrollY;

        const documentHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const percentage =
            documentHeight > 0
                ? (scrollTop / documentHeight) * 100
                : 0;

        progress.style.width =
            `${percentage}%`;

    }, { passive: true });


    

    const navLinks =
        document.querySelectorAll(".links a[href^='#']");

    const sections =
        document.querySelectorAll("section[id]");


    function updateActiveNav() {

        let current = "";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop - 150;

            if (window.scrollY >= sectionTop) {
                current = section.id;
            }

        });


        navLinks.forEach(link => {

            link.classList.remove("active");

            if (
                link.getAttribute("href") ===
                "#" + current
            ) {

                link.classList.add("active");

            }

        });

    }


    window.addEventListener(
        "scroll",
        updateActiveNav,
        { passive: true }
    );

    updateActiveNav();



    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const targetId =
                this.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) {
                return;
            }

            e.preventDefault();

            const navHeight =
                nav ? nav.offsetHeight : 0;

            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                navHeight;

            window.scrollTo({

                top: targetPosition,

                behavior: "smooth"

            });

        });

    });

});