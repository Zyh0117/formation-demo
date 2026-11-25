(function () {
  'use strict';

  const sides = ['home', 'away'];
  const sideNames = { home: '主队', away: '客队' };
  const eventLabels = {
    goal: '进球', assist: '助攻', own_goal: '乌龙球', penalty: '点球进球', yellow_card: '黄牌',
    red_card: '红牌', yellow_to_red: '两黄变一红', substitution: '换人',
    penalty_shootout_goal: '点球大战进球', penalty_shootout_miss: '点球大战罚失', penalty_miss: '点球罚失',
  };
  const markerEvents = {
    goal: ['goal', '⚽'], assist: ['assist', '助'], penalty: ['goal', '⚽'], own_goal: ['red', '⚽'],
    yellow_card: ['yellow', '黄'], red_card: ['red', '红'], yellow_to_red: ['red', '红'],
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(className, text) {
    const node = element('button', className, text);
    node.type = 'button';
    return node;
  }

  function eventCaption(event) {
    const label = eventLabels[event.eventType] || event.description || '比赛事件';
    return [event.eventTime, label + (event.count > 1 ? ' ×' + event.count : '')]
      .filter(Boolean).join(' · ');
  }

  // The order is goalkeeper first, then each outfield line from defence to attack.
  function positions(config, starters, side) {
    if (!config || !/^[1-5](?:-[1-5]){2,3}$/.test(config.shape) || !Array.isArray(config.playerIds)) return [];
    const lines = [1, ...config.shape.split('-').map(Number)];
    if (lines.reduce((total, count) => total + count, 0) !== 11 ||
        config.playerIds.length !== 11) return [];
    const assigned = config.playerIds.filter(id => id != null);
    if (new Set(assigned).size !== assigned.length || assigned.some(id => !starters.has(id))) return [];

    let index = 0;
    return lines.flatMap((count, row) => Array.from({ length: count }, (_, column) => {
      const distance = row === 0 ? 7 : 17 + (row - 1) * 24 / Math.max(1, lines.length - 2);
      return {
        entry: starters.get(config.playerIds[index++]),
        x: (column + 1) * 100 / (count + 1),
        y: side === 'home' ? distance : 100 - distance,
      };
    })).filter(position => position.entry);
  }

  // Accepts the site's Match data. Formation positions are an optional, separate publication.
  function mount(container, { match, formations = {}, onPlayerClick }) {
    const rows = match.lineups || [];
    const events = match.events || [];
    const markers = [];
    const view = element('div', 'match-lineups');
    const detail = element('section', 'ml-detail');
    const announcements = element('p', 'ml-announcement', '点击阵型图或名单中的球员，查看本场记录。');
    announcements.setAttribute('aria-live', 'polite');
    detail.setAttribute('aria-label', '球员本场记录');
    detail.append(announcements);

    function teamName(side) {
      return (side === 'home' ? match.homeTeam : match.awayTeam)?.teamName || sideNames[side];
    }

    function playerEvents(entry) {
      return events.filter(event => event.teamType === entry.teamType &&
        [event.playerId, event.assistPlayerId, event.subPlayerId].includes(entry.playerId));
    }

    function eventFlags(entry) {
      const flags = element('span', 'ml-flags');
      playerEvents(entry).forEach(event => {
        let flag;
        if (event.eventType === 'substitution') {
          flag = event.subPlayerId === entry.playerId ? ['out', '↓'] : ['in', '↑'];
        } else if (event.playerId === entry.playerId && Object.hasOwn(markerEvents, event.eventType)) {
          flag = markerEvents[event.eventType];
        } else if (event.assistPlayerId === entry.playerId) {
          flag = ['assist', '助'];
        }
        if (!flag) return;
        const badge = element('span', 'ml-flag ml-flag-' + flag[0], flag[1]);
        badge.title = eventCaption(event);
        flags.append(badge);
      });
      return flags;
    }

    function select(entry) {
      markers.forEach(({ control, player }) => {
        const active = player.teamType === entry.teamType && player.playerId === entry.playerId;
        control.setAttribute('aria-pressed', String(active));
      });
      const name = entry.player?.name || '未知球员';
      const number = entry.player?.jerseyNumber;
      announcements.replaceChildren(
        element('strong', '', (number != null ? '#' + number + ' ' : '') + name),
        element('span', 'ml-player-context', teamName(entry.teamType) + ' · ' + (entry.lineupType === 'starting' ? '首发' : '替补'))
      );
      const records = playerEvents(entry);
      const recordText = records.map(event => {
        const role = event.assistPlayerId === entry.playerId ? '（助攻）' :
          event.subPlayerId === entry.playerId ? '（换下）' :
          event.eventType === 'substitution' ? '（换上）' : '';
        return eventCaption(event) + role;
      }).join('　');
      detail.replaceChildren(announcements, element('p', 'ml-muted', recordText || '暂无本场事件记录。'));
      if (typeof onPlayerClick === 'function') {
        const link = button('ml-profile', '查看球员资料');
        link.addEventListener('click', () => onPlayerClick(entry.playerId, name));
        detail.append(link);
      }
    }

    function track(control, entry) {
      control.setAttribute('aria-pressed', 'false');
      control.addEventListener('click', () => {
        select(entry);
        detail.scrollIntoView({ block: 'nearest' });
      });
      markers.push({ control, player: entry });
    }

    const groups = sides.map(side => {
      const entries = rows.filter(entry => entry.teamType === side && entry.playerId);
      const starters = entries.filter(entry => entry.lineupType === 'starting');
      const published = positions(formations[side], new Map(starters.map(entry => [entry.playerId, entry])), side);
      return { side, entries, published };
    });
    const hasPitch = groups.some(group => group.published.length);
    if (hasPitch) {
      view.append(element('h3', 'ml-section-title ml-starting-title', '首发阵容'));
      const field = element('div', 'ml-field');
      field.setAttribute('role', 'group');
      field.setAttribute('aria-label', '双方首发阵型图');
      const markings = element('div', 'ml-field-lines');
      markings.setAttribute('aria-hidden', 'true');
      markings.append(element('span', 'ml-penalty-area ml-penalty-home'), element('span', 'ml-penalty-area ml-penalty-away'));
      const formationsBar = element('div', 'ml-formations');
      field.append(markings, formationsBar);
      groups.forEach(({ side, published }) => {
        const caption = published.length
          ? formations[side].shape + (published.length < 11 ? ' · ' + published.length + '/11' : '')
          : formations[side]?.shape ? formations[side].shape + ' · 待排阵' : '阵型未公布';
        const team = element('p', 'ml-field-team ml-field-' + side);
        team.append(element('span', '', sideNames[side]), element('strong', '', caption));
        formationsBar.append(team);
        published.forEach(({ entry, x, y }) => {
          const marker = button('ml-marker ml-' + side);
          const name = entry.player?.name || '未知球员';
          const number = entry.player?.jerseyNumber ?? '—';
          marker.style.left = x + '%';
          marker.style.top = y + '%';
          const flags = eventFlags(entry);
          const summaries = [...flags.children].map(flag => flag.title);
          marker.setAttribute('aria-label', [sideNames[side] + ' ' + name + ' ' + number + '号', ...summaries].join('，'));
          flags.setAttribute('aria-hidden', 'true');
          marker.append(element('span', 'ml-shirt', number), element('span', 'ml-marker-name', name), flags);
          track(marker, entry);
          field.append(marker);
        });
      });
      view.append(field);
    } else {
      view.append(element('p', 'ml-muted ml-unpublished', '阵型位置暂未公布，可查看下方名单。'));
    }
    view.append(detail);

    function renderLists(type, empty) {
      const lists = element('div', 'ml-lists');
      groups.forEach(({ side, entries }) => {
        const column = element('section', 'ml-team ml-team-' + side);
        const heading = element('h4', 'ml-team-name');
        heading.append(element('span', 'ml-team-dot'), element('span', '', teamName(side)));
        column.append(heading);
        const list = element('ul', 'ml-list');
        entries.filter(entry => entry.lineupType === type).forEach(entry => {
          const row = button('ml-player');
          row.append(element('span', 'ml-number', entry.player?.jerseyNumber == null ? '—' : '#' + entry.player.jerseyNumber),
            element('span', '', entry.player?.name || '未知球员'), eventFlags(entry));
          track(row, entry);
          const item = element('li');
          item.append(row);
          list.append(item);
        });
        column.append(list.childElementCount ? list : element('p', 'ml-muted', empty));
        lists.append(column);
      });
      return lists;
    }

    const bench = element('section', 'ml-squad-section');
    bench.append(element('h3', 'ml-section-title', '替补阵容'), renderLists('substitute', '未公布替补'));
    if (!hasPitch) {
      const starters = element('section', 'ml-squad-section');
      starters.append(element('h3', 'ml-section-title', '首发名单'), renderLists('starting', '未公布首发'));
      view.append(starters);
    }
    view.append(bench);
    container.replaceChildren(view);
    return () => view.remove();
  }

  window.MatchLineups = { mount };
})();
