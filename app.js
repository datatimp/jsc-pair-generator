document.addEventListener('DOMContentLoaded', async () => {
    const generateBtn = document.getElementById('generate-btn');
    const resultsContainer = document.getElementById('results-container');
    let iconRotation = 0;

    // --- Data loading ---

    async function fetchText(path) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.text();
    }

    function parseMembers(text) {
        return text.split('\n')
            .map(line => line.replace(/^[-*+]\s+/, '').trim())
            .filter(line => line && !line.startsWith('#'));
    }

    function parseLinks(text) {
        const entries = [];
        for (const block of text.trim().split(/\n{2,}/)) {
            const entry = {};
            for (const line of block.split('\n')) {
                const match = line.match(/^(\w+):\s*(.*)/);
                if (match) entry[match[1]] = match[2].trim();
            }
            if (entry.Name) entries.push(entry);
        }
        return entries;
    }

    // --- Rendering helpers ---

    function getAvatarHTML(name, size = '') {
        const lower = name.toLowerCase();
        const initial = name.charAt(0).toUpperCase();
        const sizeStyle = size ? `style="${size}"` : '';
        return `<img src="assets/images/${lower}.jpg" ${sizeStyle}
                     onerror="this.onerror=null;this.src='assets/images/${lower}.png';this.onerror=function(){this.style.display='none';this.parentElement.textContent='${initial}';};"
                     alt="${name}">`;
    }

    function renderInlineMarkdown(text) {
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    // --- Roster chips ---

    let members = [];
    try {
        members = parseMembers(await fetchText('assets/docs/members.md'));
    } catch (e) {
        console.error('Could not load members.md:', e);
    }

    const activeMembers = new Set(members);
    const rosterContainer = document.getElementById('roster-container');

    [...members].sort().forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'roster-chip';
        chip.innerHTML = `
            <div class="roster-avatar">${getAvatarHTML(name)}</div>
            <span>${name}</span>
        `;
        chip.addEventListener('click', () => {
            if (activeMembers.has(name)) {
                activeMembers.delete(name);
                chip.classList.add('inactive');
            } else {
                activeMembers.add(name);
                chip.classList.remove('inactive');
            }
        });
        rosterContainer.appendChild(chip);
    });

    // --- Links table ---

    const linksContainer = document.getElementById('links-container');
    try {
        const entries = parseLinks(await fetchText('assets/docs/links.md'));
        entries.sort((a, b) => a.Name.localeCompare(b.Name));

        const columns = ['LinkedIn', 'Website', 'Github', 'Other'];
        const table = document.createElement('table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Name', ...columns].forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        entries.forEach(entry => {
            const tr = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.innerHTML = `
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div class="avatar-ring">
                        <div class="member-avatar" style="width:2rem;height:2rem;font-size:0.75rem;">
                            ${getAvatarHTML(entry.Name, 'width:100%;height:100%;object-fit:cover;')}
                        </div>
                    </div>
                    <span>${entry.Name}</span>
                </div>`;
            tr.appendChild(nameTd);

            columns.forEach(col => {
                const td = document.createElement('td');
                const value = entry[col] || '';
                td.innerHTML = value ? renderInlineMarkdown(value) : '—';
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        linksContainer.appendChild(table);
    } catch (e) {
        console.error('Could not load links.md:', e);
        linksContainer.innerHTML = '<p class="empty-state" style="padding:1rem;">Could not load links.</p>';
    }

    // --- Pair generation ---

    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function createGroups(shuffled) {
        const groups = [];
        let i = 0;
        while (i < shuffled.length) {
            if (shuffled.length - i === 3) {
                groups.push([shuffled[i], shuffled[i + 1], shuffled[i + 2]]);
                break;
            }
            groups.push([shuffled[i], shuffled[i + 1]]);
            i += 2;
        }
        return groups;
    }

    function renderGroups(groups) {
        resultsContainer.innerHTML = '';
        groups.forEach((group, index) => {
            const card = document.createElement('div');
            card.className = 'group-card';
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="group-header">
                    <h2 class="group-title">Group ${index + 1}</h2>
                    <span class="group-badge">${group.length} Members</span>
                </div>
                <div class="member-list"></div>`;

            const memberList = card.querySelector('.member-list');
            group.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'member';
                memberDiv.innerHTML = `
                    <div class="member-avatar">${getAvatarHTML(member)}</div>
                    <span class="member-name">${member}</span>`;
                memberList.appendChild(memberDiv);
            });

            resultsContainer.appendChild(card);
        });
    }

    generateBtn.addEventListener('click', () => {
        const icon = generateBtn.querySelector('.btn-icon');
        iconRotation += 180;
        icon.style.transform = `rotate(${iconRotation}deg)`;
        renderGroups(createGroups(shuffleArray([...activeMembers])));
    });
});
