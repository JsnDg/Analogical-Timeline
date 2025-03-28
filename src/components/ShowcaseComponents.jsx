import React, { useState, useMemo } from 'react';

/** Utility function to generate a random ID */
export function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

/** Helper function to generate a simple Bezier path */
export function generateCurvePath(x1, y1, x2, y2) {
  const cx = (x1 + x2) / 2;
  return `M ${x1},${y1} C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}

/** Returns an icon based on wave.title */
export function getWaveIcon(title) {
  const lower = title.toLowerCase();
  if (lower.includes('genai')) return '💡';
  if (lower.includes('robot')) return '🤖';
  if (lower.includes('pc')) return '💻';
  if (lower.includes('internet')) return '🌐';
  if (lower.includes('smartphones')) return '📱';
  if (lower.includes('evs')) return '🚗';
  return '💻';
}

/** A custom ToggleSwitch component to replace traditional checkboxes */
export function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="slider"></span>
    </label>
  );
}

/** Modal for adding a new event */
export function AddEventModal({ isOpen, onClose, onSubmit, timelineOptions = [] }) {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState(0);

  React.useEffect(() => {
    if (isOpen && timelineOptions.length > 0) {
      setSelectedTimeline(timelineOptions[0].index);
    }
  }, [isOpen, timelineOptions]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (date && title) {
      onSubmit({
        timelineIndex: selectedTimeline,
        date,
        title,
        detail,
      });
      onClose();
      setDate('');
      setTitle('');
      setDetail('');
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Add New Event</h3>
        <form onSubmit={handleSubmit}>
          {timelineOptions.length > 0 && (
            <div className="form-item">
              <label className="label">Select Timeline:</label>
              <select
                value={selectedTimeline}
                onChange={(e) => setSelectedTimeline(parseInt(e.target.value))}
                className="select"
              >
                {timelineOptions.map((option, idx) => (
                  <option key={idx} value={option.index}>
                    {option.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-item">
            <label className="label">Date (YYYY-MM-DD):</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="form-item">
            <label className="label">Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="form-item">
            <label className="label">Details:</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="input"
              style={{ minHeight: '100px' }}
            />
          </div>
          <div className="btn-container">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Renders a gray connection line, thicker and darker on hover */
export function ConnectionLine({ fromPos, toPos, reason, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const strokeColor = hovered ? '#444' : 'rgba(128,128,128,0.4)';
  const strokeWidth = hovered ? 4 : 2;
  const textColor = hovered ? '#333' : 'rgba(128,128,128,0.4)';
  const fontSize = hovered ? 16 : 12;
  const fontWeight = hovered ? 'bold' : 'normal';
  const pathData = generateCurvePath(fromPos.x, fromPos.y, toPos.x, toPos.y);

  const handleClick = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this connection?')) {
      onDelete();
    }
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        style={{
          pointerEvents: 'all',
          filter: hovered ? 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' : 'none',
        }}
      />
      <text
        x={(fromPos.x + toPos.x) / 2}
        y={(fromPos.y + toPos.y) / 2 - 5}
        fill={textColor}
        fontSize={fontSize}
        fontWeight={fontWeight}
        textAnchor="middle"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {reason}
      </text>
    </g>
  );
}

/** Generates offsets to position events in a staggered manner */
export function getOffsets(count, gap = 80) {
  const offsets = [];
  const half = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    offsets.push((i - half) * gap);
  }
  if (count % 2 === 0) {
    offsets.forEach((val, idx) => {
      offsets[idx] = val + gap / 2;
    });
  }
  return offsets;
}

/** Global floating tooltip that follows hover events */
export function GlobalTooltip({ hoveredEvent }) {
  if (!hoveredEvent) return null;
  const { rect, title, detail } = hoveredEvent;
  if (!rect) return null;
  const left = rect.left + rect.width / 2 - 100;
  const top = rect.bottom + 8;
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width: '200px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        padding: '8px',
        fontSize: '12px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
      <div>{detail}</div>
    </div>
  );
}

/** Determines if an event is marked as failure */
export function isFailureEvent(ev) {
  return ev.isFailure === true;
}

/** Determines if an event is in the future (predicted) */
export function isFutureEvent(ev) {
  const eventTime = new Date(ev.date).getTime();
  const now = new Date().getTime();
  return eventTime > now;
}

/**
 * EventGroup: a group of events that are within 3 months of each other,
 * displayed on the same horizontal line but staggered vertically.
 * 
 * Logic for color:
 * - Non-failure: future => dark gray(#333), past => blue(#007BFF)
 * - Failure: future => darkred, past => #c0392b
 */
export function EventGroup({
  events,
  onEventDoubleClick,
  onDelete,
  groupTop,
  setHoveredEvent,
  getEventRef,
}) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  const offsets = useMemo(() => {
    return getOffsets(sortedEvents.length, 80);
  }, [sortedEvents.length]);

  const handleMouseEnter = (ev) => {
    if (!ev.detail) return;
    const refEl = getEventRef(ev.id)?.current;
    if (refEl) {
      const rect = refEl.getBoundingClientRect();
      setHoveredEvent({ rect, title: ev.title, detail: ev.detail });
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: groupTop,
        left: 0,
        width: '280px',
        zIndex: 500,
      }}
    >
      {sortedEvents.map((ev, i) => {
        const offsetTop = offsets[i];
        const eventRef = getEventRef(ev.id);
        const failure = isFailureEvent(ev);
        const eventTime = new Date(ev.date).getTime();
        const now = new Date().getTime();
        let titleColor;
        if (failure) {
          titleColor = eventTime > now ? 'darkred' : '#c0392b';
        } else {
          titleColor = eventTime > now ? '#333' : '#007BFF';
        }
        return (
          <div
            key={ev.id}
            ref={eventRef}
            style={{
              position: 'absolute',
              left: '10px',
              top: offsetTop + 'px',
              width: '180px',
              height: '60px',
              padding: '10px',
              border: `2px solid #ddd`,
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: '#000',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onDoubleClick={(e) => onEventDoubleClick(ev.id, e)}
            onMouseEnter={() => handleMouseEnter(ev)}
            onMouseLeave={() => setHoveredEvent(null)}
            onMouseOver={(e) => (e.currentTarget.style.zIndex = 999)}
            onMouseOut={(e) => (e.currentTarget.style.zIndex = 1)}
          >
            <div
              style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                fontSize: '14px',
                color: titleColor,
              }}
            >
              {ev.title}
            </div>
            <div
              style={{
                fontSize: '13px',
                marginBottom: '6px',
                color: failure
                  ? (eventTime > now ? 'darkred' : '#c0392b')
                  : '#555',
              }}
            >
              {ev.date}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ev.id);
              }}
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(0,0,255,0.6)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** A single timeline, including its title and multiple EventGroups */
export function Timeline({
  timelineIndex,
  wave,
  onEventDoubleClick,
  onDeleteEvent,
  setHoveredEvent,
  getEventRef,
}) {
  const timelineHeight = 1600;
  const timestamps = wave.events.map((e) => new Date(e.date).getTime());
  const firstEventTime = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
  const firstEventDate = new Date(firstEventTime);
  const timelineStart = new Date(firstEventDate.getFullYear(), 0, 1).getTime();
  const eightYearsInMs = 7.8 * 365.25 * 24 * 60 * 60 * 1000;
  const timelineEndTime = timelineStart + eightYearsInMs;
  const safeTimeSpan = timelineEndTime - timelineStart;

  // Sort events by date
  const sortedEvents = useMemo(() => {
    return [...wave.events].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [wave.events]);

  // Group events that occur within 3 months
  const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;
  const eventGroups = [];
  let currentGroup = [];

  sortedEvents.forEach((ev, index) => {
    if (index === 0) {
      currentGroup.push(ev);
    } else {
      const prevTime = new Date(sortedEvents[index - 1].date).getTime();
      const currTime = new Date(ev.date).getTime();
      if (currTime - prevTime <= THREE_MONTHS_MS) {
        currentGroup.push(ev);
      } else {
        eventGroups.push([...currentGroup]);
        currentGroup = [ev];
      }
    }
  });
  if (currentGroup.length > 0) {
    eventGroups.push(currentGroup);
  }

  // Calculate vertical positions for each group
  let lastUsedPos = 0;
  const groupSpacing = 20;
  function estimateGroupHeight(group) {
    const n = group.length;
    return 80 * (n - 1) + 60;
  }
  const groupPositions = eventGroups.map((group) => {
    const firstEv = group[0];
    const currentTime = new Date(firstEv.date).getTime();
    const ratio = (currentTime - timelineStart) / safeTimeSpan;
    const naivePos = ratio * timelineHeight;
    const groupHeight = estimateGroupHeight(group);
    const finalPos = Math.max(naivePos, lastUsedPos + groupSpacing);
    lastUsedPos = finalPos + groupHeight;
    return finalPos;
  });

  // Display an icon based on wave.title
  const waveIcon = getWaveIcon(wave.title);
  // If wave.predictionTime is defined, display that
  const predictedTag = wave.predictionTime ? ` (${wave.predictionTime})` : '';

  return (
    <div className="timeline-wrapper">
      <div style={{ height: '80px' }}>
        <div className="timeline-header">
          <h2 className="timeline-title">
            <span style={{ marginRight: '8px' }}>{waveIcon}</span>
            {wave.title}
            {predictedTag && (
              <span style={{ fontSize: '0.9rem', color: '#999', marginLeft: '8px' }}>
                {predictedTag}
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="timeline-period">{wave.period}</div>

      <div
        style={{
          position: 'relative',
          width: '2px',
          backgroundColor: '#bbb',
          height: timelineHeight + 'px',
          marginLeft: '0',
          marginTop: '-70px',
          borderRadius: '1px',
        }}
      >
        <div style={{ position: 'absolute', top: '0', left: '-10px', right: '-10px' }}>
          {eventGroups.map((group, idx) => (
            <EventGroup
              key={idx}
              events={group}
              onEventDoubleClick={onEventDoubleClick}
              onDelete={onDeleteEvent}
              groupTop={groupPositions[idx]}
              setHoveredEvent={setHoveredEvent}
              getEventRef={getEventRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The ConnectionsLayer draws all confirmed lines plus any in-progress line */
export function ConnectionsLayer({
  connections,
  eventPositions,
  containerRef,
  pendingConnection,
  pendingConnectionEnd,
  onDeleteConnection,
}) {
  const containerRect = containerRef.current
    ? containerRef.current.getBoundingClientRect()
    : { left: 0, top: 0 };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
        </marker>
      </defs>

      {connections.map((conn, index) => {
        const fromPos = eventPositions[conn.from];
        const toPos = eventPositions[conn.to];
        if (!fromPos || !toPos) return null;
        const adjustedFrom = {
          x: fromPos.x - containerRect.left,
          y: fromPos.y - containerRect.top,
        };
        const adjustedTo = {
          x: toPos.x - containerRect.left,
          y: toPos.y - containerRect.top,
        };
        return (
          <ConnectionLine
            key={index}
            fromPos={adjustedFrom}
            toPos={adjustedTo}
            reason={conn.reason}
            onDelete={() => onDeleteConnection(index)}
          />
        );
      })}

      {/* Draw the temporary line if a connection is in progress */}
      {pendingConnection &&
        pendingConnectionEnd &&
        eventPositions[pendingConnection.startEventId] &&
        (() => {
          const startPosGlobal = eventPositions[pendingConnection.startEventId];
          const startPos = {
            x: startPosGlobal.x - containerRect.left,
            y: startPosGlobal.y - containerRect.top,
          };
          return (
            <line
              x1={startPos.x}
              y1={startPos.y}
              x2={pendingConnectionEnd.x}
              y2={pendingConnectionEnd.y}
              stroke="gray"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
              style={{ pointerEvents: 'none' }}
            />
          );
        })()}
    </svg>
  );
}

/** Modal to fill out a reason for the new connection */
export function ConnectionReasonModal({ isOpen, onClose, onSubmit }) {
  const [reason, setReason] = useState('Manual connection');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason || 'Manual connection');
    onClose();
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Connection Reason</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-item">
            <label className="label">Reason for connection:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              autoFocus
            />
          </div>
          <div className="btn-container">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}