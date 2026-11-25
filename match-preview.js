(function () {
  'use strict';

  const sampleTeams = [
    {
      side: 'home',
      name: '城市交通与物流学院',
      shape: '4-3-3',
      starters: [[13, '吴天睿'], [28, '冯子颖'], [82, '洪奕壕'], [8, '林家豪'], [99, '李行云'],
        [35, '卢艺隆'], [77, '彭云林'], [6], [10], [11], [19]],
      substitutes: [[12], [16], [21]],
    },
    {
      side: 'away',
      name: '集成电路与光电芯片学院',
      shape: '4-4-2',
      starters: [[1, '王志佳'], [66, '苏瑞栋'], [5, '吴培鑫'], [44, '郭翰文'], [18, '吴竞术'],
        [33, '周昀昊'], [7], [9], [20], [22], [23]],
      substitutes: [[14], [17], [26]],
    },
  ];

  const match = {
    id: 'match-preview',
    homeTeam: { teamName: sampleTeams[0].name },
    awayTeam: { teamName: sampleTeams[1].name },
    homeScore: 2,
    awayScore: 2,
    homePenaltyScore: 2,
    awayPenaltyScore: 4,
    location: '北区',
    matchDate: '2026年5月30日 16:26',
    status: 'completed',
    lineups: sampleTeams.flatMap(team => [
      ['starting', team.starters], ['substitute', team.substitutes],
    ].flatMap(([lineupType, players]) => players.map(([jerseyNumber, name]) => {
      const playerId = team.side + '-' + jerseyNumber;
      return {
        playerId, teamType: team.side, lineupType,
        player: { id: playerId, name: name || '球员 ' + jerseyNumber, jerseyNumber },
      };
    }))),
    events: [
      { teamType: 'home', eventTime: '28′', eventType: 'goal', playerId: 'home-8', playerName: '林家豪', assistPlayerId: 'home-99', assistPlayerName: '李行云' },
      { teamType: 'away', eventTime: '46′', eventType: 'yellow_card', playerId: 'away-5', playerName: '吴培鑫' },
      { teamType: 'home', eventTime: '62′', eventType: 'substitution', playerId: 'home-12', playerName: '球员 12', subPlayerId: 'home-35', subPlayerName: '卢艺隆' },
    ],
  };
  const formations = Object.fromEntries(sampleTeams.map(team => [team.side, {
    shape: team.shape,
    playerIds: team.starters.map(([number]) => team.side + '-' + number),
  }]));

  function text(tag, value) {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  }

  const score = text('strong', match.homeScore + ' : ' + match.awayScore);
  score.className = 'demo-score';
  score.append(text('small', '点球 ' + match.homePenaltyScore + '–' + match.awayPenaltyScore));
  function teamBadge(name, abbreviation, side) {
    const team = document.createElement('div');
    team.className = 'demo-team demo-team-' + side;
    const badge = text('span', abbreviation);
    badge.className = 'demo-team-badge';
    badge.setAttribute('aria-hidden', 'true');
    team.append(badge, text('span', name));
    return team;
  }
  document.getElementById('demoScore').append(
    teamBadge(match.homeTeam.teamName, '交运', 'home'), score,
    teamBadge(match.awayTeam.teamName, '集光', 'away')
  );
  document.getElementById('demoMeta').append(text('span', '比赛地点 · ' + match.location), text('span', '比赛时间 · ' + match.matchDate));

  const eventPanel = document.getElementById('demoEvents');
  const eventList = document.createElement('ul');
  eventList.className = 'demo-events';
  eventPanel.append(eventList);

  const lineupPanel = document.getElementById('demoLineups');
  const labels = { goal: '进球', assist: '助攻', yellow_card: '黄牌', red_card: '红牌' };
  let lastPreview = '';
  function update(lineups, positions, events) {
    const signature = JSON.stringify([lineups, positions, events]);
    if (signature === lastPreview) return;
    lastPreview = signature;
    window.MatchLineups.mount(lineupPanel, { match: { ...match, lineups, events }, formations: positions });
    eventList.replaceChildren(...events.map(event => {
      const description = event.eventType === 'substitution' ? '换上 ' + event.playerName + '，换下 ' + event.subPlayerName :
        event.playerName + ' ' + labels[event.eventType] + (event.count > 1 ? ' ×' + event.count : '');
      const team = event.teamType === 'home' ? '主队' : '客队';
      return text('li', [event.eventTime, team, description].filter(Boolean).join(' · '));
    }));
    if (!events.length) eventList.append(text('li', '暂无本场事件记录。'));
  }
  window.MatchDemo = { match, formations, update };
  const tabs = [document.getElementById('demoEventsTab'), document.getElementById('demoLineupsTab')];
  const panels = [eventPanel, lineupPanel];
  function selectTab(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  const editor = document.getElementById('lineupEditor');
  document.getElementById('editLineups').addEventListener('click', () => {
    editor.open = true;
    editor.querySelector('summary').focus();
    editor.scrollIntoView({ block: 'start' });
  });
  document.getElementById('previewLineups').addEventListener('click', () => {
    selectTab(1);
    tabs[1].focus();
    tabs[1].scrollIntoView({ block: 'start' });
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        ['ArrowLeft', 'ArrowRight'].includes(event.key) ? 1 - index : -1;
      if (nextIndex < 0) return;
      event.preventDefault();
      selectTab(nextIndex);
      tabs[nextIndex].focus();
    });
  });
})();
