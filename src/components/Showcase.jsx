import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import {
  AddEventModal,
  ConnectionReasonModal,
  GlobalTooltip,
  Timeline,
  ConnectionsLayer,
  getWaveIcon,
  ToggleSwitch,
} from './ShowcaseComponents';
import './styles.css';

function Showcase() {
  const [waves, setWaves] = useState([]);
  const [connections, setConnections] = useState([]);
  const [eventPositions, setEventPositions] = useState({});
  const [selectedWaveIndices, setSelectedWaveIndices] = useState([]);
  const [showPredicted, setShowPredicted] = useState(true); // Controls whether to show predicted events

  const eventRefs = useRef({});

  const getEventRef = useCallback((eventId) => {
    if (!eventRefs.current[eventId]) {
      eventRefs.current[eventId] = React.createRef();
    }
    return eventRefs.current[eventId];
  }, []);

  // Measure positions of all event cards after layout changes
  useLayoutEffect(() => {
    let changed = false;
    const newPositions = { ...eventPositions };

    Object.entries(eventRefs.current).forEach(([eventId, refObj]) => {
      if (refObj.current) {
        const rect = refObj.current.getBoundingClientRect();
        const centerPos = {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        };
        const oldPos = newPositions[eventId];
        if (!oldPos || oldPos.x !== centerPos.x || oldPos.y !== centerPos.y) {
          changed = true;
          newPositions[eventId] = centerPos;
        }
      }
    });

    if (changed) {
      setEventPositions(newPositions);
    }
  });

  // Connection states
  const [pendingConnection, setPendingConnection] = useState(null);
  const [pendingConnectionEnd, setPendingConnectionEnd] = useState(null);
  const [showGlobalAddModal, setShowGlobalAddModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [pendingTo, setPendingTo] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const containerRef = useRef(null);

  // Load data.json
  useEffect(() => {
    fetch('/data.json')
      .then((r) => r.json())
      .then((data) => {
        setWaves(data.waves || []);
        setConnections(data.connections || []);
      })
      .catch((err) => console.error('Error loading data:', err));
  }, []);

  // By default, select all timelines
  useEffect(() => {
    if (waves.length > 0) {
      setSelectedWaveIndices(waves.map((_, idx) => idx));
    }
  }, [waves]);

  const handleEventDoubleClick = (eventId, e) => {
    if (!pendingConnection) {
      setPendingConnection({ startEventId: eventId });
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        setPendingConnectionEnd({ x, y });
      }
    } else {
      if (pendingConnection.startEventId === eventId) {
        // Same event => cancel
        setPendingConnection(null);
        setPendingConnectionEnd(null);
      } else {
        // Different event => prompt reason
        setPendingTo(eventId);
        setShowConnectionModal(true);
        setPendingConnectionEnd(null);
      }
    }
  };

  const handleSubmitNewEvent = (data) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setWaves((prev) => {
      const newWaves = [...prev];
      const idx = data.timelineIndex;
      if (newWaves[idx]) {
        const waveCopy = {
          ...newWaves[idx],
          events: [...newWaves[idx].events],
        };
        waveCopy.events.push({
          id: newId,
          date: data.date,
          title: data.title,
          detail: data.detail,
        });
        newWaves[idx] = waveCopy;
      }
      return newWaves;
    });
  };

  const handleSubmitConnection = (reason) => {
    setConnections((prev) => [
      ...prev,
      { from: pendingConnection.startEventId, to: pendingTo, reason },
    ]);
    setPendingConnection(null);
    setPendingConnectionEnd(null);
    setPendingTo(null);
  };

  const handleDeleteEvent = (eventId) => {
    setWaves((prev) =>
      prev.map((w) => ({
        ...w,
        events: w.events.filter((e) => e.id !== eventId),
      }))
    );
    setConnections((prev) =>
      prev.filter((c) => c.from !== eventId && c.to !== eventId)
    );
  };

  const handleDeleteConnection = (connIndex) => {
    setConnections((prev) => prev.filter((_, i) => i !== connIndex));
  };

  // Track mouse position for connection line
  const handleMouseMove = (e) => {
    if (pendingConnection && pendingConnectionEnd !== null) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setPendingConnectionEnd({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      });
    }
  };

  const timelineOptions = useMemo(() => {
    return waves.map((wave, i) => ({ index: i, title: wave.title }));
  }, [waves]);

  // Only display selected waves
  const displayedWaves = useMemo(() => {
    return waves.filter((_, idx) => selectedWaveIndices.includes(idx));
  }, [waves, selectedWaveIndices]);

  // Filter out predicted events if showPredicted = false
  const now = new Date().getTime();
  const filteredWaves = useMemo(() => {
    return displayedWaves.map((wave) => ({
      ...wave,
      events: wave.events.filter((ev) =>
        showPredicted ? true : new Date(ev.date).getTime() <= now
      ),
    }));
  }, [displayedWaves, showPredicted, now]);

  // Build set of displayed event IDs
  const displayedEventIds = useMemo(() => {
    const ids = new Set();
    filteredWaves.forEach((w) => {
      w.events.forEach((ev) => {
        ids.add(ev.id);
      });
    });
    return ids;
  }, [filteredWaves]);

  // Filter connections accordingly
  const displayedConnections = useMemo(() => {
    return connections.filter(
      (conn) =>
        displayedEventIds.has(conn.from) && displayedEventIds.has(conn.to)
    );
  }, [connections, displayedEventIds]);

  // Toggle which timeline is selected
  const toggleWave = (idx) => {
    setSelectedWaveIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      } else {
        return [...prev, idx];
      }
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ paddingBottom: '80px', position: 'relative' }}
    >
      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showGlobalAddModal}
        onClose={() => setShowGlobalAddModal(false)}
        onSubmit={handleSubmitNewEvent}
        timelineOptions={timelineOptions}
      />

      {/* Connection Reason Modal */}
      <ConnectionReasonModal
        isOpen={showConnectionModal}
        onClose={() => {
          setShowConnectionModal(false);
          setPendingConnection(null);
          setPendingConnectionEnd(null);
        }}
        onSubmit={handleSubmitConnection}
      />

      {/* Global Hover Tooltip */}
      <GlobalTooltip hoveredEvent={hoveredEvent} />

      {/* Page title */}
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '2rem',
          color: '#333',
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        Analogical Timeline for Hype Cycle
      </h1>
      <h2
        style={{
          textAlign: 'center',
          fontStyle: 'italic',
          color: '#555',
          marginBottom: '15px',
        }}
      >
        History doesn't repeat itself, but it often rhymes.
      </h2>

      <div style={{ textAlign: 'center', fontSize: '22px', paddingBottom: '30px' }}>
      <a
      className="author-link"
      href="https://jason-ding.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontWeight: "bold",
        fontSize: "1.5rem",
        textDecoration: "none",
        color: "#000"
      }}
    > Zijian "Jason" Ding </a>
        <div style={{ paddingTop: '0.2em' }}>University of Maryland, College Park</div>
        <div style={{paddingTop: '0.5em'}}><a
      className="author-link"
      href="https://github.com/JsnDg/Analogical-Timeline"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontWeight: "bold",
        fontSize: "1.5rem",
        textDecoration: "none",
        color: "#000"
      }}
    >[Code]</a></div>
      </div>

      {/* Add Event Button (top-right corner) */}
      <button
        onClick={() => setShowGlobalAddModal(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          color: '#3498db',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        }}
        title="Add Event"
      >
        +
      </button>

      {/* Timeline Selection (using ToggleSwitch) */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {waves.map((wave, idx) => {
          const waveIcon = getWaveIcon(wave.title);
          const isSelected = selectedWaveIndices.includes(idx);
          const predictedTag = wave.predictionTime
            ? ` (${wave.predictionTime})`
            : '';
          return (
            <label
              key={idx}
              style={{
                marginRight: '15px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: isSelected ? '#ebedef' : 'transparent',
                transition: 'background-color 0.2s ease',
              }}
              title={
                wave.predictionTime
                  ? `Predicted timeline at ${wave.predictionTime}`
                  : ''
              }
            >
              <ToggleSwitch
                checked={isSelected}
                onChange={() => toggleWave(idx)}
              />
              <span style={{ marginLeft: '6px', marginRight: '4px' }}>
                {waveIcon}
              </span>
              <span>
                {wave.title}
                {predictedTag}
              </span>
            </label>
          );
        })}
      </div>

      {/* Toggle button to control whether to show predicted events */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label style={{ cursor: 'pointer', fontSize: '16px' }}>
          <ToggleSwitch
            checked={showPredicted}
            onChange={() => setShowPredicted((prev) => !prev)}
          />
          <span style={{ marginLeft: '8px' }}>Show Predicted Events</span>
        </label>
      </div>

      {/* Display multiple timelines (filtered) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          marginTop: '40px',
          position: 'relative',
          zIndex: 0,
        }}
      >
        {filteredWaves.map((wave, idx) => {
          const originalIndex = waves.indexOf(wave);
          return (
            <Timeline
              key={originalIndex}
              timelineIndex={originalIndex}
              wave={wave}
              onEventDoubleClick={handleEventDoubleClick}
              onDeleteEvent={handleDeleteEvent}
              setHoveredEvent={setHoveredEvent}
              getEventRef={getEventRef}
            />
          );
        })}
      </div>

      {/* Connections Layer */}
      <ConnectionsLayer
        connections={displayedConnections}
        eventPositions={eventPositions}
        containerRef={containerRef}
        pendingConnection={pendingConnection}
        pendingConnectionEnd={pendingConnectionEnd}
        onDeleteConnection={handleDeleteConnection}
      />
    </div>
  );
}

export default Showcase;