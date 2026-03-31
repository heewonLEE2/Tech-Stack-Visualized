// ===== Git Interactive Playground =====

export function initPlayground() {
  const container = document.getElementById('playground-container');
  if (!container) return;

  const input = document.getElementById('playground-input');
  const runBtn = document.getElementById('playground-run');
  const resetBtn = document.getElementById('playground-reset');
  const logEl = document.getElementById('playground-log');
  const graphEl = document.getElementById('playground-container');

  // ─── State ───
  let state = freshState();

  function freshState() {
    return {
      commits: [
        { id: 'C0', msg: 'Initial commit', branch: 'main', parent: null },
      ],
      branches: { main: 'C0' },
      HEAD: 'main',
      detached: false,
      nextId: 1,
      stash: [],
    };
  }

  // ─── Command parsing ───
  const COMMANDS = {
    commit: handleCommit,
    branch: handleBranch,
    switch: handleSwitch,
    checkout: handleCheckout,
    merge: handleMerge,
    rebase: handleRebase,
    reset: handleReset,
    revert: handleRevert,
    stash: handleStash,
    log: handleLog,
    'cherry-pick': handleCherryPick,
    status: handleStatus,
    help: handleHelp,
  };

  function parse(raw) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('git '))
      return log(
        '❌ 명령어는 "git"으로 시작해야 합니다. "git help" 입력해 보세요.',
        'error',
      );

    const parts = trimmed.slice(4).trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (COMMANDS[cmd]) {
      COMMANDS[cmd](args);
    } else {
      log(`❌ 알 수 없는 명령어: git ${cmd}`, 'error');
      log(
        '   "git help"를 입력하면 사용 가능한 명령어를 볼 수 있습니다.',
        'info',
      );
    }
    render();
  }

  // ─── Handlers ───
  function handleCommit(args) {
    let msg = 'No message';
    const mIdx = args.indexOf('-m');
    if (mIdx !== -1 && args[mIdx + 1]) {
      msg = args
        .slice(mIdx + 1)
        .join(' ')
        .replace(/^["']|["']$/g, '');
    }
    const id = 'C' + state.nextId++;
    const parentId = state.detached ? state.HEAD : state.branches[state.HEAD];
    state.commits.push({
      id,
      msg,
      branch: state.detached ? null : state.HEAD,
      parent: parentId,
    });
    if (!state.detached) state.branches[state.HEAD] = id;
    else state.HEAD = id;
    log(`✅ [${id}] ${msg}`, 'success');
  }

  function handleBranch(args) {
    if (args.length === 0 || args[0] === '-a') {
      const lines = Object.entries(state.branches).map(([name, cid]) => {
        const prefix = name === state.HEAD && !state.detached ? '* ' : '  ';
        return `${prefix}${name}  →  ${cid}`;
      });
      log(lines.join('\n'), 'info');
      return;
    }
    if (args[0] === '-d' || args[0] === '-D') {
      const name = args[1];
      if (!name) return log('❌ 삭제할 브랜치 이름을 지정하세요.', 'error');
      if (name === state.HEAD)
        return log('❌ 현재 브랜치는 삭제할 수 없습니다.', 'error');
      if (!state.branches[name])
        return log(`❌ 브랜치 "${name}"이(가) 없습니다.`, 'error');
      delete state.branches[name];
      log(`🗑️ 브랜치 "${name}" 삭제됨`, 'success');
      return;
    }
    const name = args[0];
    if (state.branches[name])
      return log(`❌ 브랜치 "${name}"은(는) 이미 존재합니다.`, 'error');
    const tip = state.detached ? state.HEAD : state.branches[state.HEAD];
    state.branches[name] = tip;
    log(`🌿 브랜치 "${name}" 생성됨 (${tip}에서)`, 'success');
  }

  function handleSwitch(args) {
    const name = args[0];
    if (!name) return log('❌ 전환할 브랜치 이름을 지정하세요.', 'error');
    if (args.includes('-c') || args.includes('-C')) {
      const branchName = args[1] || args[0];
      if (!state.branches[branchName]) handleBranch([branchName]);
      state.HEAD = branchName;
      state.detached = false;
      log(`🔀 "${branchName}" 브랜치로 전환`, 'success');
      return;
    }
    if (!state.branches[name])
      return log(`❌ 브랜치 "${name}"이(가) 없습니다.`, 'error');
    state.HEAD = name;
    state.detached = false;
    log(`🔀 "${name}" 브랜치로 전환`, 'success');
  }

  function handleCheckout(args) {
    if (args.includes('-b')) {
      const idx = args.indexOf('-b');
      const name = args[idx + 1];
      if (!name) return log('❌ 새 브랜치 이름을 지정하세요.', 'error');
      handleBranch([name]);
      state.HEAD = name;
      state.detached = false;
      log(`🔀 "${name}" 브랜치로 전환`, 'success');
      return;
    }
    handleSwitch(args);
  }

  function handleMerge(args) {
    const name = args[0];
    if (!name) return log('❌ 병합할 브랜치 이름을 지정하세요.', 'error');
    if (!state.branches[name])
      return log(`❌ 브랜치 "${name}"이(가) 없습니다.`, 'error');
    if (state.detached)
      return log('❌ detached HEAD 상태에서는 merge할 수 없습니다.', 'error');

    const currentTip = state.branches[state.HEAD];
    const otherTip = state.branches[name];

    if (currentTip === otherTip)
      return log('ℹ️ 이미 최신 상태입니다. (Already up to date)', 'info');

    // Check fast-forward: other is descendant of current
    if (isAncestor(currentTip, otherTip)) {
      state.branches[state.HEAD] = otherTip;
      log(`⏩ Fast-forward merge: ${state.HEAD} → ${otherTip}`, 'success');
      return;
    }

    // 3-way merge
    const id = 'M' + state.nextId++;
    state.commits.push({
      id,
      msg: `Merge ${name} into ${state.HEAD}`,
      branch: state.HEAD,
      parent: currentTip,
      parent2: otherTip,
    });
    state.branches[state.HEAD] = id;
    log(`🔀 Merge commit [${id}]: ${name} → ${state.HEAD}`, 'success');
  }

  function handleRebase(args) {
    const target = args[0];
    if (!target) return log('❌ rebase 대상 브랜치를 지정하세요.', 'error');
    if (!state.branches[target])
      return log(`❌ 브랜치 "${target}"이(가) 없습니다.`, 'error');

    const targetTip = state.branches[target];
    const currentBranch = state.HEAD;
    // Simplified: just move current branch pointer and add a rebased commit
    const id = 'R' + state.nextId++;
    state.commits.push({
      id,
      msg: `Rebased onto ${target}`,
      branch: currentBranch,
      parent: targetTip,
    });
    state.branches[currentBranch] = id;
    log(
      `♻️ "${currentBranch}"를 "${target}" 위로 rebase 완료 [${id}]`,
      'success',
    );
  }

  function handleReset(args) {
    const mode = args.find((a) => a.startsWith('--')) || '--mixed';
    const target = args.find((a) => !a.startsWith('--'));
    if (!target)
      return log(
        '❌ 대상 커밋을 지정하세요 (예: git reset --soft C1)',
        'error',
      );

    const commit = state.commits.find((c) => c.id === target);
    if (!commit)
      return log(`❌ 커밋 "${target}"을(를) 찾을 수 없습니다.`, 'error');

    if (!state.detached) state.branches[state.HEAD] = target;
    else state.HEAD = target;

    const modeLabel = mode.replace('--', '');
    log(`⏪ reset ${modeLabel}: HEAD → ${target}`, 'success');
  }

  function handleRevert(args) {
    const target = args[0];
    if (!target) return log('❌ 되돌릴 커밋을 지정하세요.', 'error');
    const commit = state.commits.find((c) => c.id === target);
    if (!commit)
      return log(`❌ 커밋 "${target}"을(를) 찾을 수 없습니다.`, 'error');

    const id = 'V' + state.nextId++;
    const parentId = state.detached ? state.HEAD : state.branches[state.HEAD];
    state.commits.push({
      id,
      msg: `Revert "${commit.msg}"`,
      branch: state.detached ? null : state.HEAD,
      parent: parentId,
    });
    if (!state.detached) state.branches[state.HEAD] = id;
    else state.HEAD = id;
    log(
      `↩️ Revert [${id}]: "${target}"의 변경사항을 되돌리는 커밋 생성`,
      'success',
    );
  }

  function handleCherryPick(args) {
    const target = args[0];
    if (!target) return log('❌ cherry-pick할 커밋을 지정하세요.', 'error');
    const commit = state.commits.find((c) => c.id === target);
    if (!commit)
      return log(`❌ 커밋 "${target}"을(를) 찾을 수 없습니다.`, 'error');

    const id = 'P' + state.nextId++;
    const parentId = state.detached ? state.HEAD : state.branches[state.HEAD];
    state.commits.push({
      id,
      msg: `Cherry-pick ${target}: ${commit.msg}`,
      branch: state.detached ? null : state.HEAD,
      parent: parentId,
    });
    if (!state.detached) state.branches[state.HEAD] = id;
    else state.HEAD = id;
    log(`🍒 Cherry-pick [${id}]: ${target}의 변경사항 적용`, 'success');
  }

  function handleStash(args) {
    const sub = args[0] || 'push';
    if (sub === 'push' || sub === 'save') {
      const tip = state.detached ? state.HEAD : state.branches[state.HEAD];
      state.stash.push({ ref: tip, msg: `WIP on ${state.HEAD}` });
      log('📥 변경사항을 stash에 저장했습니다.', 'success');
    } else if (sub === 'pop') {
      if (state.stash.length === 0)
        return log('❌ stash가 비어있습니다.', 'error');
      state.stash.pop();
      log('📤 stash에서 변경사항을 복원했습니다.', 'success');
    } else if (sub === 'list') {
      if (state.stash.length === 0)
        return log('ℹ️ stash가 비어있습니다.', 'info');
      state.stash.forEach((s, i) => log(`  stash@{${i}}: ${s.msg}`, 'info'));
    } else {
      log(`❌ 알 수 없는 stash 하위 명령: ${sub}`, 'error');
    }
  }

  function handleLog() {
    const branch = state.detached ? null : state.HEAD;
    let tip = state.detached ? state.HEAD : state.branches[state.HEAD];
    const lines = [];
    const visited = new Set();
    while (tip && !visited.has(tip)) {
      visited.add(tip);
      const c = state.commits.find((x) => x.id === tip);
      if (!c) break;
      lines.push(`  ${c.id} — ${c.msg}`);
      tip = c.parent;
    }
    if (lines.length === 0) return log('ℹ️ 커밋이 없습니다.', 'info');
    log(lines.join('\n'), 'info');
  }

  function handleStatus() {
    const tip = state.detached ? state.HEAD : state.branches[state.HEAD];
    const branchInfo = state.detached
      ? `HEAD detached at ${state.HEAD}`
      : `On branch ${state.HEAD}`;
    log(
      `${branchInfo}\nHEAD → ${tip}\nBranches: ${Object.keys(state.branches).join(', ')}\nStash: ${state.stash.length}개`,
      'info',
    );
  }

  function handleHelp() {
    const lines = [
      '📖 사용 가능한 명령어:',
      '  git commit -m "메시지"  — 새 커밋',
      '  git branch <이름>       — 브랜치 생성',
      '  git branch              — 브랜치 목록',
      '  git branch -d <이름>    — 브랜치 삭제',
      '  git switch <이름>       — 브랜치 전환',
      '  git checkout -b <이름>  — 브랜치 생성+전환',
      '  git merge <이름>        — 병합',
      '  git rebase <이름>       — 리베이스',
      '  git reset --soft/--mixed/--hard <커밋>',
      '  git revert <커밋>       — 되돌리기',
      '  git cherry-pick <커밋>  — 체리픽',
      '  git stash               — 임시 저장',
      '  git stash pop           — 복원',
      '  git stash list          — 목록',
      '  git log                 — 히스토리',
      '  git status              — 상태',
    ];
    log(lines.join('\n'), 'info');
  }

  // ─── Helpers ───
  function isAncestor(ancestorId, descendantId) {
    let cur = descendantId;
    const visited = new Set();
    while (cur && !visited.has(cur)) {
      if (cur === ancestorId) return true;
      visited.add(cur);
      const c = state.commits.find((x) => x.id === cur);
      if (!c) break;
      cur = c.parent;
    }
    return false;
  }

  function log(text, type = 'info') {
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = text;
    entry.style.whiteSpace = 'pre-wrap';
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ─── Render graph ───
  function render() {
    if (!graphEl) return;
    graphEl.innerHTML = '';

    const svgNS = 'http://www.w3.org/2000/svg';
    const commits = state.commits;
    if (commits.length === 0) return;

    // Layout: assign positions
    const posMap = {};

    // Gather branch lanes
    const branchNames = Object.keys(state.branches);
    const laneMap = {};
    branchNames.forEach((name, i) => {
      laneMap[name] = i;
    });

    let nextFreeY = 0;
    const xSpacing = 80;
    const ySpacing = 50;
    const padX = 50;
    const padY = 30;

    // Assign x by order, y by branch lane
    commits.forEach((c, i) => {
      const lane =
        c.branch && laneMap[c.branch] !== undefined
          ? laneMap[c.branch]
          : Object.keys(laneMap).length;
      posMap[c.id] = {
        x: padX + i * xSpacing,
        y: padY + lane * ySpacing,
      };
    });

    const maxX = padX + commits.length * xSpacing;
    const maxY = padY + (branchNames.length + 1) * ySpacing;
    const svgW = Math.max(maxX, 400);
    const svgH = Math.max(maxY, 120);

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.width = '100%';
    svg.style.minHeight = svgH + 'px';

    // Draw edges
    commits.forEach((c) => {
      if (c.parent && posMap[c.parent] && posMap[c.id]) {
        drawEdge(svg, posMap[c.parent], posMap[c.id], '#555');
      }
      if (c.parent2 && posMap[c.parent2] && posMap[c.id]) {
        drawEdge(svg, posMap[c.parent2], posMap[c.id], '#ffb74d');
      }
    });

    // Draw nodes
    const headTip = state.detached ? state.HEAD : state.branches[state.HEAD];
    commits.forEach((c) => {
      const pos = posMap[c.id];
      if (!pos) return;

      let color = '#4fc3f7';
      if (c.id.startsWith('M'))
        color = '#ffb74d'; // merge
      else if (c.id.startsWith('R'))
        color = '#ce93d8'; // rebase
      else if (c.id.startsWith('V'))
        color = '#26a69a'; // revert
      else if (c.id.startsWith('P')) color = '#ffd54f'; // cherry-pick

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', 18);
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', c.id === headTip ? '#e94560' : '#fff');
      circle.setAttribute('stroke-width', c.id === headTip ? '3' : '1.5');
      svg.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#1a1a2e');
      text.textContent = c.id;
      svg.appendChild(text);

      // Tooltip
      const title = document.createElementNS(svgNS, 'title');
      title.textContent = `${c.id}: ${c.msg}`;
      circle.appendChild(title);
    });

    // Draw branch labels
    Object.entries(state.branches).forEach(([name, cid]) => {
      const pos = posMap[cid];
      if (!pos) return;
      const isCurrent = !state.detached && name === state.HEAD;
      const labelW = name.length * 7 + 14;
      const labelY = pos.y - 26;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', pos.x - labelW / 2);
      rect.setAttribute('y', labelY - 9);
      rect.setAttribute('width', labelW);
      rect.setAttribute('height', 18);
      rect.setAttribute('rx', '3');
      rect.setAttribute('fill', isCurrent ? '#81c784' : '#555');
      svg.appendChild(rect);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', labelY + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#fff');
      text.textContent = name;
      svg.appendChild(text);
    });

    graphEl.appendChild(svg);

    function drawEdge(svg, from, to, color) {
      if (from.y === to.y) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', from.x + 18);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x - 18);
        line.setAttribute('y2', to.y);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      } else {
        const path = document.createElementNS(svgNS, 'path');
        const mx = (from.x + to.x) / 2;
        path.setAttribute(
          'd',
          `M ${from.x + 18} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x - 18} ${to.y}`,
        );
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
      }
    }
  }

  // ─── Events ───
  runBtn?.addEventListener('click', () => {
    const val = input?.value?.trim();
    if (val) {
      log(`$ ${val}`, 'cmd');
      parse(val);
      input.value = '';
    }
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runBtn?.click();
    }
  });

  resetBtn?.addEventListener('click', () => {
    state = freshState();
    if (logEl) {
      logEl.innerHTML = '';
      log('🔄 Playground 초기화 완료. "git help"를 입력해 보세요!', 'info');
    }
    render();
  });

  // ─── Preset missions ───
  const missionBtns = document.querySelectorAll('[data-mission]');
  const missions = {
    merge: [
      'git commit -m "Feature A"',
      'git branch feature',
      'git switch feature',
      'git commit -m "Feature B"',
      'git commit -m "Feature C"',
      'git switch main',
      'git commit -m "Hotfix"',
      'git merge feature',
    ],
    rebase: [
      'git commit -m "Base"',
      'git branch feature',
      'git switch feature',
      'git commit -m "Feature work"',
      'git switch main',
      'git commit -m "Main update"',
      'git switch feature',
      'git rebase main',
    ],
    'cherry-pick': [
      'git commit -m "Setup"',
      'git branch feature',
      'git switch feature',
      'git commit -m "Nice feature"',
      'git commit -m "Bug fix"',
      'git switch main',
      'git cherry-pick C3',
    ],
  };

  missionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.mission;
      const cmds = missions[key];
      if (!cmds) return;

      state = freshState();
      if (logEl) logEl.innerHTML = '';
      log(`🎯 미션: ${key} 시나리오 실행`, 'info');

      cmds.forEach((cmd) => {
        log(`$ ${cmd}`, 'cmd');
        parse(cmd);
      });
    });
  });

  // Init
  log('🎮 Git Playground에 오신 걸 환영합니다!', 'info');
  log('   명령어를 입력하거나, 하단 미션 버튼을 눌러보세요.', 'info');
  log('   "git help"로 사용 가능한 명령어를 확인할 수 있습니다.', 'info');
  render();

  if (window.__gitProgress) {
    window.__gitProgress.save('section-playground');
  }
}
