
import React, { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

// Utility to get unique races from race data
function getUniqueRaces(raceRows) {
  const set = new Set();
  raceRows.forEach(row => set.add(row.Race));
  return Array.from(set);
}

const SHEET_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/JSON";
const SKILL_LEVELS_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/SkillLevels";
const CLASS_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/Class";
const RACE_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/Race";
const SPELL_LEVELS_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/SpellLevels";
const SPELL_TYPES_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/SpellType";

export default function App() {
  // Light/dark mode state
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  // Gold color for dark/light mode (must be inside component to access theme)
  const gold = theme === 'dark' ? '#bfa76a' : '#8c6d1f';
  const goldBorder = gold;
  // Modal state for mobile/tap tooltips
  const [modalTooltip, setModalTooltip] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [classes, setClasses] = useState({});
  const [skillCaps, setSkillCaps] = useState({});
  const [classInfo, setClassInfo] = useState({});
  const [raceData, setRaceData] = useState([]);
  const [spellLevels, setSpellLevels] = useState([]);
  const [spellTypes, setSpellTypes] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selected, setSelected] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(50);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoveredClass, setHoveredClass] = useState(null);

  const pageStyle = {
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: theme === 'dark' ? "#0f172a" : "#f5f5f5",
    color: theme === 'dark' ? "#f5f5f5" : "#222",
    fontFamily: "Inter, sans-serif",
    transition: 'background 0.2s, color 0.2s'
  };



  // For class selection, determine if a class is available for the first pick based on selectedRace
  function isClassAvailableForRace(cls) {
    if (!selectedRace || selected.length > 0) return true;
    // Find if this class is included for the selected race (Inclusion === '1')
    return raceData.some(row => row.Race === selectedRace && row.Class === cls && String(row.Inclusion).trim() === '1');
  }

  const getButtonStyle = (cls) => {
    const isSelected = selected.includes(cls);
    const isHovered = hoveredClass === cls;
    const isAvailable = isClassAvailableForRace(cls);
    return {
      margin: "5px",
      padding: "10px 14px",
      border: `1px solid ${isSelected ? "#3c8f64" : "#334155"}`,
      borderRadius: "12px",
      color: isAvailable ? "#f5f5f5" : "#888",
      background: isSelected ? "#2a663d" : "#1e293b",
      cursor: isAvailable ? "pointer" : "not-allowed",
      boxShadow: isSelected ? "0 0 10px rgba(60, 143, 100, 0.5)" : "none",
      transform: isHovered ? "scale(1.05)" : "scale(1)",
      transition: "all 0.2s ease",
      textDecoration: !isAvailable && selected.length === 0 ? "line-through" : "none",
      opacity: !isAvailable && selected.length === 0 ? 0.5 : 1
    };
  };


  useEffect(() => {
    fetch(SHEET_URL)
      .then(res => res.json())
      .then(rows => {
        console.log('SHEET_URL data:', rows);
        setClasses(transformData(rows));
      })
      .catch(err => {
        console.error("Failed to fetch class data", err);
      });
    fetch(SKILL_LEVELS_URL)
      .then(res => res.json())
      .then(rows => {
        console.log('SKILL_LEVELS_URL data:', rows);
        setSkillCaps(transformSkillCaps(rows));
      })
      .catch(err => {
        console.error("Failed to fetch skill levels data", err);
      });
    fetch(CLASS_URL)
      .then(res => res.json())
      .then(rows => {
        console.log('CLASS_URL data:', rows);
        setClassInfo(transformClassInfo(rows));
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(err => {
        console.error("Failed to fetch class info data", err);
      });
    fetch(RACE_URL)
      .then(res => res.json())
      .then(rows => {
        console.log('RACE_URL data:', rows);
        setRaceData(rows);
      })
      .catch(err => {
        console.error("Failed to fetch race data", err);
      });
    fetch(SPELL_LEVELS_URL)
      .then(res => res.json())
      .then(rows => {
        console.log('SPELL_LEVELS_URL data:', rows);
        setSpellLevels(transformSpellLevels(rows));
      })
      .catch(err => {
        console.error("Failed to fetch spell levels data", err);
      });
    fetch(SPELL_TYPES_URL)
      .then(res => {
        console.log('SPELL_TYPES_URL fetch status:', res.status);
        return res.json();
      })
      .then(rows => {
        console.log('SPELL_TYPES_URL data:', rows);
        setSpellTypes(transformSpellTypes(rows));
      })
      .catch(err => {
        console.error("Failed to fetch spell types data", err);
      });
    const timer = setInterval(() => {
      fetch(SHEET_URL)
        .then(res => res.json())
        .then(rows => {
          setClasses(transformData(rows));
        })
        .catch(err => {
          console.error("Failed to fetch class data", err);
        });
      fetch(SKILL_LEVELS_URL)
        .then(res => res.json())
        .then(rows => {
          setSkillCaps(transformSkillCaps(rows));
        })
        .catch(err => {
          console.error("Failed to fetch skill levels data", err);
        });
      fetch(CLASS_URL)
        .then(res => res.json())
        .then(rows => {
          setClassInfo(transformClassInfo(rows));
          setLastUpdated(new Date().toLocaleTimeString());
        })
        .catch(err => {
          console.error("Failed to fetch class info data", err);
        });
      fetch(RACE_URL)
        .then(res => res.json())
        .then(rows => {
          setRaceData(rows);
        })
        .catch(err => {
          console.error("Failed to fetch race data", err);
        });
      fetch(SPELL_LEVELS_URL)
        .then(res => res.json())
        .then(rows => {
          setSpellLevels(transformSpellLevels(rows));
        })
        .catch(err => {
          console.error("Failed to fetch spell levels data", err);
        });
      fetch(SPELL_TYPES_URL)
        .then(res => res.json())
        .then(rows => {
          setSpellTypes(transformSpellTypes(rows));
        })
        .catch(err => {
          console.error("Failed to fetch spell types data", err);
        });
    }, 60000);
    return () => clearInterval(timer);
  }, []);
    // Transform spell types data
    function transformSpellTypes(rows) {
      // Defensive: always return an array
      if (!Array.isArray(rows)) return [];
      return rows;
    }
  // Transform spell levels data
  function transformSpellLevels(rows) {
    // You may want to adjust this based on the actual structure of the sheet
    return rows;
  }



  // Transform sheet → structured class data
  function transformData(rows) {
    const result = {};

    rows.forEach(row => {
      const cls = row.Class;

      if (!result[cls]) {
        result[cls] = {
          name: cls,
          skills: [],
          competencies: {}
        };
      }

      // Store skill
      result[cls].skills.push({
        name: row.Skill,
        level: Number(row.SkillLevel),
        competency: row.Competency,
        characterLevel: Number(row.CharacterLevel)
      });

      // Aggregate competency score
      const comp = row.Competency;
      const level = Number(row.SkillLevel);

      if (!result[cls].competencies[comp]) {
        result[cls].competencies[comp] = 0;
      }

      result[cls].competencies[comp] += level;
    });

    return result;
  }

  // Transform skill levels data
  function transformSkillCaps(rows) {
    const result = {};
    rows.forEach(row => {
      const cls = row.Class;
      const skill = row.Skill;
      const level = Number(row.Level);
      const cap = Number(row["Skill Cap"]);

      if (!result[cls]) {
        result[cls] = {};
      }
      if (!result[cls][skill]) {
        result[cls][skill] = {};
      }

      if (!Number.isNaN(level)) {
        result[cls][skill][level] = cap;
      }
    });
    return result;
  }

  // Transform class info data
  function transformClassInfo(rows) {
    const result = {};
    rows.forEach(row => {
      const cls = row.Class;
      result[cls] = row; // Store the entire row for flexibility
    });
    return result;
  }

  // Toggle selection (max 3 classes)
  function toggleClass(cls) {
    // If picking first class, enforce race restriction
    if (selected.length === 0 && !isClassAvailableForRace(cls)) return;
    if (selected.includes(cls)) {
      setSelected(selected.filter(c => c !== cls));
    } else if (selected.length < 3) {
      setSelected([...selected, cls]);
    }
  }

  // Analyze selected combo
  function analyze() {
    const combinedSkills = {};
    const allowedCompetencies = new Set(["Melee", "Ability", "Defense", "Special"]);

    // Map selected class names to abbreviations
    const selectedAbbrs = selected
      .map(clsName => classInfo[clsName]?.Abbreviation)
      .filter(Boolean);
    console.log('[Step 1] Selected classes:', selected);
    console.log('[Step 1] Class abbreviations:', selectedAbbrs);

    // Build a map of SpellType to details
    const spellTypeDetails = {};
    spellTypes.forEach(type => {
      spellTypeDetails[type.SpellType] = type;
    });

    // Always show all SpellTypes with Inclusion=1 from SPELL_TYPES_URL
    const includedSpellTypes = Array.from(new Set(
      spellTypes.filter(type => type.Inclusion === "1" || type.Inclusion === 1).map(type => type.SpellType)
    ));

    // For each SpellType, find spells for selected classes (by abbreviation) up to selectedLevel
    // Step-by-step debug output
    if (spellLevels.length > 0) {
      console.log('[Step 2] SpellLevels rows:', spellLevels.length);
      includedSpellTypes.forEach(typeName => {
        spellLevels.forEach(row => {
          if (String(row.SpellType) === String(typeName)) {
            selectedAbbrs.forEach(abbr => {
              const classLevel = Number(row[abbr]);
              if (!isNaN(classLevel) && classLevel > 0 && classLevel <= selectedLevel) {
                console.log(`[Step 3] MATCH: SpellType ${typeName}, Spell: ${row.Name}, SpellTypeGroup: ${row.SpellTypeGroup}, Abbr: ${abbr}, Value: ${row[abbr]}, SpellID: ${row.ID}`);
              }
            });
          }
        });
      });
    }
    // Deduplicate by SpellTypeGroup (from spellTypeDetails)
    const seenGroups = new Set();
      const spellCells = includedSpellTypes.sort().map(typeName => {
        const group = (spellTypeDetails[typeName] && spellTypeDetails[typeName].SpellTypeGroup) || typeName;
        if (seenGroups.has(group)) return null;
        seenGroups.add(group);

        // Find all SpellTypes that belong to this group
        const allTypeNamesInGroup = spellTypes.filter(t => t.SpellTypeGroup === group).map(t => String(t.SpellType));

        // Collect all spells for all SpellTypes in this group and all selected classes
        let spells = [];
        spellLevels.forEach(row => {
          if (!allTypeNamesInGroup.includes(String(row.SpellType))) return;
          // For all selected class abbreviations, aggregate spells
          selectedAbbrs.forEach(abbr => {
            const classLevel = Number(row[abbr]);
            if (!isNaN(classLevel) && classLevel > 0 && classLevel <= selectedLevel) {
              // Track which class provides this spell for tooltip clarity
              spells.push({ ...row, Level: classLevel, ProvidedBy: abbr });
            }
          });
        });
        // Deduplicate spells by SpellID+Provider or Name+Provider if present
        const seen = new Set();
        spells = spells.filter(spell => {
          const key = (spell.SpellID || spell.Name || spell.SpellName) + ':' + spell.ProvidedBy;
          if (!key) return true;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Sort spells by level descending
        spells.sort((a, b) => Number(b.Level) - Number(a.Level));
        if (spells.length > 0) {
          console.log(`[SpellTypeGroup] ${group}:`, spells.map(s => (s.Name || s.SpellName) + ' (' + s.ProvidedBy + ')'));
        }
        return {
          typeName,
          included: spells.length > 0,
          spells: spells.slice(0, 5), // Top 5 spells for tooltip
          detail: spellTypeDetails[typeName] || {},
          group
        };
      }).filter(Boolean);

    // Skills logic remains unchanged
    // Only include skills for selected classes and levels that exist in skillCaps
    selected.forEach(clsName => {
      const cls = classes[clsName];
      if (!cls) return;
      cls.skills.forEach(skill => {
        if (!allowedCompetencies.has(skill.competency)) return;
        let effectiveLevel;
        if (skill.competency === "Special") {
          effectiveLevel = skill.level;
        } else {
          const cap = skillCaps[clsName]?.[skill.name]?.[selectedLevel];
          if (!cap) return;
          effectiveLevel = cap;
        }
        const existing = combinedSkills[skill.name];
        if (!existing || effectiveLevel > existing.level) {
          combinedSkills[skill.name] = {
            name: skill.name,
            level: effectiveLevel,
            competency: skill.competency,
            provider: clsName
          };
        }
      });
    });

    const groupedSkills = {
      Melee: [],
      Defense: [],
      Ability: [],
      Special: []
    };
    Object.values(combinedSkills).forEach(skill => {
      groupedSkills[skill.competency].push(skill);
    });
    Object.values(groupedSkills).forEach(group => {
      group.sort((a, b) => a.name.localeCompare(b.name));
    });

    return {
      groupedSkills,
      spellCells
    };
  }

  const analysis = analyze();

  // Unique races for race selection
  const uniqueRaces = getUniqueRaces(raceData);

  // Helper to detect touch device
  const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  };

  // Modal component
  const TooltipModal = ({ open, content, onClose }) => {
    if (!open) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} onClick={onClose}>
        <div style={{
          background: '#1e293b',
          color: '#f5f5f5',
          padding: '24px 20px',
          borderRadius: '10px',
          minWidth: '220px',
          maxWidth: '90vw',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
          fontSize: '1.05em',
          whiteSpace: 'pre-line',
          textAlign: 'left',
        }} onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <Analytics />
      {/* Header at the very top */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: "1100px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "Cinzel", color: gold }}>Legendary Class Builder</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={toggleTheme}
              style={{
                background: theme === 'dark' ? '#222' : '#e5e5e5',
                color: theme === 'dark' ? '#f5f5f5' : '#222',
                border: `1px solid ${goldBorder}`,
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: '1em',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.2s, color 0.2s',
              }}
              aria-label="Toggle light/dark mode"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {lastUpdated && <span style={{ color: theme === 'dark' ? "#aaa" : "#444", fontSize: "0.95rem" }}>Last refresh: {lastUpdated}</span>}
          </div>
        </div>
      </div>
      {/* Race Selection Panel */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <div style={{
          maxWidth: "1100px",
          width: "100%",
          backgroundColor: theme === 'dark' ? "#1e293b" : "#e3ecfa",
          padding: "10px 20px",
          borderRadius: "8px",
          borderLeft: `4px solid ${goldBorder}`,
          borderTop: "1px solid #334155",
          borderRight: "1px solid #334155",
          marginBottom: 0
        }}>
          <h2 style={{ margin: "0 0 10px 0" }}>Race Selection</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {uniqueRaces.map(race => (
              <button
                key={race}
                onClick={() => {
                  const newRace = selectedRace === race ? null : race;
                  setSelectedRace(newRace);
                  setSelected([]);
                }}
                onMouseEnter={() => setHoveredClass(race)}
                onMouseLeave={() => setHoveredClass(null)}
                style={(() => {
                  const isSelected = selectedRace === race;
                  const isHovered = hoveredClass === race;
                  return {
                    margin: "5px",
                    padding: "10px 14px",
                    border: `1px solid ${isSelected ? goldBorder : "#334155"}`,
                    borderRadius: "12px",
                    background: isSelected ? "#2a663d" : "#1e293b",
                    color: isSelected ? gold : "#f5f5f5",
                    fontWeight: isSelected ? 700 : 400,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 0 10px rgba(60, 143, 100, 0.5)" : "none",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease"
                  };
                })()}
              >
                {race}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* End Race Selection Panel */}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            backgroundColor: theme === 'dark' ? "#1e293b" : "#e3ecfa",
            padding: "5px 20px",
            borderRadius: "8px",
            borderLeft: "4px solid #bfa76a",
            borderBottom: "4px solid #bfa76a",
            borderTop: "1px solid #334155",
            borderRight: "1px solid #334155",
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 7px,
                ${gold} 7px,
                ${gold} 9px,
                transparent 9px,
                transparent 16px
              ),
              repeating-linear-gradient(
                to right,
                transparent,
                transparent 7px,
                ${gold} 7px,
                ${gold} 9px,
                transparent 9px,
                transparent 16px
              )
            `,
            backgroundPosition: 'left top, left bottom',
            backgroundRepeat: 'repeat-y, repeat-x',
            backgroundSize: '4px 16px, 16px 4px',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', top: 12, right: 24, zIndex: 2, background: 'rgba(30,41,59,0.95)', borderRadius: 8, padding: '8px 16px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: 2 }}>Character Level: {selectedLevel}</label>
            <input
              type="range"
              min="1"
              max="50"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(Number(e.target.value))}
              style={{ width: '150px' }}
            />
          </div>
          <h2>Class Selection <span style={{ fontSize: '0.8em', fontWeight: 400, color: gold }}>(Pick 3)</span></h2>
          <div>
            {(() => {
              if (!classes || !classInfo) return null;
              const buckets = {
                Melee: [],
                Hybrid: [],
                Priest: [],
                Caster: []
              };
              Object.keys(classes).forEach(cls => {
                const classification = classInfo[cls]?.Classification || "";
                if (buckets[classification]) {
                  buckets[classification].push(cls);
                }
              });
              // Render Melee/Hybrid in left column, Priest/Caster in right column
              const colStyle = { display: "flex", flexDirection: "column", gap: "6px", flex: 1 };
              const bucketBlock = (bucket, label) => (
                buckets[bucket]?.length ? (
                  <div key={bucket} style={{ minWidth: "180px", marginBottom: "0" }}>
                    <div style={{ fontWeight: 600, color: gold, margin: "4px 0 2px 0" }}>{label}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {buckets[bucket].sort().map(cls => (
                        <button
                          key={cls}
                          onClick={() => toggleClass(cls)}
                          onMouseEnter={() => setHoveredClass(cls)}
                          onMouseLeave={() => setHoveredClass(null)}
                          style={getButtonStyle(cls)}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              );
              return (
                <div style={{ display: "flex", gap: "32px", marginBottom: "0" }}>
                  <div style={colStyle}>
                    {bucketBlock("Melee", "Melee")}
                    {bucketBlock("Hybrid", "Hybrid")}
                  </div>
                  <div style={colStyle}>
                    {bucketBlock("Priest", "Priest")}
                    {bucketBlock("Caster", "Caster")}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Overview Panel moved here */}
      <div className="overview-panel-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 32, marginBottom: 32 }}>
        <div className="overview-panel" style={{ minWidth: 320, maxWidth: 480, width: '100%', background: theme === 'dark' ? '#1e293b' : '#e3ecfa', borderRadius: 12, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)', padding: 24, border: `1px solid ${goldBorder}` }}>
          <h2>Overview</h2>
          {(() => {
            if (!selected || selected.length === 0) {
              return <p>No classes selected.</p>;
            }
            // Define the categories to show
            const categories = [
              "Durability",
              "Melee Damage",
              "Spell Damage",
              "Sustainability",
              "Utility",
              "Crowd Control"
            ];
            // Sum values for each category
            const sums = {};
            selected.forEach(cls => {
              const info = classInfo[cls];
              if (!info) return;
              categories.forEach(cat => {
                const val = Number(info[cat]) || 0;
                if (!sums[cat]) sums[cat] = 0;
                sums[cat] += val;
              });
            });
            return (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <table style={{ maxWidth: 400, margin: '12px 0', borderCollapse: 'collapse', color: theme === 'dark' ? '#f5f5f5' : '#222' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #334155' }}>Category</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', borderBottom: '1px solid #334155' }}>Stars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => {
                      const value = sums[cat] || 0;
                      let stars = 0;
                      if (value >= 13) stars = 5;
                      else if (value >= 10) stars = 4;
                      else if (value >= 7) stars = 3;
                      else if (value >= 4) stars = 2;
                      else if (value >= 1) stars = 1;
                      else stars = 0;
                      return (
                        <tr key={cat}>
                          <td style={{ padding: '4px 8px', textAlign: 'right', minWidth: 120 }}>{cat}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '1.1em', minWidth: 120 }}>
                            {Array.from({ length: stars }).map((_, i) => (
                              <span key={i} style={{ color: gold, marginRight: 1 }}>★</span>
                            ))}
                            {Array.from({ length: 5 - stars }).map((_, i) => (
                              <span key={i} style={{ color: '#444', marginRight: 1 }}>☆</span>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="main-panels-container">
          <div className="max-skills-panel" style={{ maxWidth: '500px', width: '100%' }}>
            <h2>Max Skill Levels</h2>
            {['Melee', 'Defense', 'Ability', 'Special'].map(comp => (
              <div
                key={comp}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ minWidth: "90px", fontWeight: "bold" }}>{comp}</div>
                <div style={{ flex: 1 }}>
                  {analysis.groupedSkills[comp].length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: "0" }}>
                      {analysis.groupedSkills[comp]
                        .filter(s => s.level > 0)
                        .map((s, i) => (
                          <li
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                              padding: "6px 0",
                              borderBottom: "1px solid #334155",
                              listStyle: "none"
                            }}
                          >
                            <span>
                              {s.name}
                              {s.provider && (
                                <span style={{ fontSize: "0.75em", color: "#888", marginLeft: 4 }}>
                                  ({s.provider})
                                </span>
                              )}
                            </span>
                            {comp !== "Special" && (
                              <span style={{ minWidth: "36px", textAlign: "right", fontWeight: "bold" }}>{s.level}</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0 }}>
                      {selected.length === 0
                        ? "No Class Selected"
                        : comp === "Special"
                        ? "No Specials Available."
                        : `No ${comp} skills selected.`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="spell-inclusion-panel" style={{ maxWidth: '620px', width: '100%' }}>
            <h2>
              Spell Inclusion{' '}
              <span style={{ fontSize: '0.8em', fontWeight: 400, color: gold }}>
                {isTouchDevice() ? '(Tap for details)' : '(Mouseover for details)'}
              </span>
            </h2>
            <div
              className="spell-inclusion-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "10px"
              }}
            >
              {analysis.spellCells.length === 0 && (
                <div style={{ gridColumn: '1 / -1', color: '#bbb', textAlign: 'center', padding: '20px' }}>
                  No spell inclusion groups found. (Debug: spellTypes={JSON.stringify(spellTypes)}, spellCells={JSON.stringify(analysis.spellCells)})
                </div>
              )}
              {analysis.spellCells.map((cell, i) => {
                // Prepare top 5 spells by level descending
                const topSpells = cell.spells?.slice(0, 5) || [];
                const tooltip = cell.included && topSpells.length > 0
                  ? topSpells.map(spell => `${spell.Name || spell.SpellName || 'Unknown'} (Lv${spell.Level}) [${spell.ProvidedBy || ''}]`).join('\n')
                  : (cell.detail.SpellTypeGroup || cell.typeName);

                // Use SpellTypeGroup for cell label if present
                const cellLabel = cell.detail.SpellTypeGroup || cell.typeName;
                // Highlight green if spells are present
                const isHighlighted = cell.included;
                // On touch devices, show modal on tap; on desktop, use title
                const handleCellClick = () => {
                  if (isTouchDevice()) {
                    setModalTooltip(tooltip);
                    setModalOpen(true);
                  }
                };
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px",
                      minHeight: "60px",
                      background: theme === 'dark'
                        ? (isHighlighted ? "#2a663d" : "#1e293b")
                        : (isHighlighted ? "#b3d0f7" : "#e3ecfa"),
                      color: theme === 'dark' ? "#f5f5f5" : "#222",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "6px",
                      border: isHighlighted ? "1px solid #3c8f64" : "1px solid #b3c2d6",
                      cursor: isHighlighted ? "pointer" : "default"
                    }}
                    title={!isTouchDevice() ? tooltip : undefined}
                    onClick={handleCellClick}
                  >
                    <div style={{ fontSize: "0.95rem", textAlign: "center", lineHeight: 1.1 }}>
                      {cellLabel}
                    </div>
                  </div>
                );
              })}
              {/* Tooltip Modal for mobile/touch */}
              <TooltipModal open={modalOpen} content={modalTooltip} onClose={() => setModalOpen(false)} />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Panel moved here */}

      <footer style={{ width: '100%', textAlign: 'center', color: '#bfa76a', fontSize: '1rem', margin: '32px 0 8px 0', letterSpacing: '0.5px' }}>
        Development by Shnate.
      </footer>
    </div>
  );
}