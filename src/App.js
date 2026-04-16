import React, { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

const SHEET_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/JSON";
const SKILL_LEVELS_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/SkillLevels";
const CLASS_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/Class";

export default function App() {
  const [classes, setClasses] = useState({});
  const [skillCaps, setSkillCaps] = useState({});
  const [classInfo, setClassInfo] = useState({});
  const [selected, setSelected] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(60);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoveredClass, setHoveredClass] = useState(null);

  const pageStyle = {
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f5f5f5",
    fontFamily: "Inter, sans-serif"
  };



  const getButtonStyle = (cls) => {
    const isSelected = selected.includes(cls);
    const isHovered = hoveredClass === cls;
    return {
      margin: "5px",
      padding: "10px 14px",
      border: `1px solid ${isSelected ? "#3c8f64" : "#334155"}`,
      borderRadius: "12px",
      color: "#f5f5f5",
      background: isSelected ? "#2a663d" : "#1e293b",
      cursor: "pointer",
      boxShadow: isSelected ? "0 0 10px rgba(60, 143, 100, 0.5)" : "none",
      transform: isHovered ? "scale(1.05)" : "scale(1)",
      transition: "all 0.2s ease"
    };
  };

  useEffect(() => {
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
    }, 60000);
    return () => clearInterval(timer);
  }, []);



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
    const allSpellNames = new Set();
    const selectedSpellNames = new Set();
    const spellProviders = {};
    const spellProviderLists = {};

    Object.values(classes).forEach(cls => {
      cls.skills.forEach(skill => {
        if (skill.competency === "Spell") {
          allSpellNames.add(skill.name);
        }
      });
    });

    selected.forEach(clsName => {
      const cls = classes[clsName];
      if (!cls) return;

      cls.skills.forEach(skill => {
        if (skill.competency === "Spell" && skill.level === 1) {
          selectedSpellNames.add(skill.name);
          // Track all providers for this spell
          if (!spellProviderLists[skill.name]) {
            spellProviderLists[skill.name] = [];
          }
          spellProviderLists[skill.name].push(clsName);
          // Only set provider if not already set (for legacy single-provider logic)
          if (!spellProviders[skill.name]) {
            spellProviders[skill.name] = clsName;
          }
        }
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

    const spellCells = Array.from(allSpellNames)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({
        name,
        included: selectedSpellNames.has(name),
        provider: spellProviders[name] || null,
        providers: spellProviderLists[name] || []
      }));

    return {
      groupedSkills,
      spellCells
    };
  }

  const analysis = analyze();

  return (
    <div style={pageStyle}>
      <Analytics />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: "1100px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "Cinzel", color: "#bfa76a" }}>Legendary Class Builder</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {lastUpdated && <span style={{ color: "#aaa", fontSize: "0.95rem" }}>Last refresh: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            backgroundColor: "#1e293b",
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
                #bfa76a 7px,
                #bfa76a 9px,
                transparent 9px,
                transparent 16px
              ),
              repeating-linear-gradient(
                to right,
                transparent,
                transparent 7px,
                #bfa76a 7px,
                #bfa76a 9px,
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
              max="60"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(Number(e.target.value))}
              style={{ width: '150px' }}
            />
          </div>
          <h2>Class Selection (Limit 3)</h2>
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
                    <div style={{ fontWeight: 600, color: "#bfa76a", margin: "4px 0 2px 0" }}>{label}</div>
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
            <h2>Spell Inclusion</h2>
            <div
              className="spell-inclusion-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "10px"
              }}
            >
              {analysis.spellCells.map((spell, i) => {
                let providerAbbrs = [];
                if (spell.included && spell.providers.length > 0) {
                  providerAbbrs = spell.providers.map(clsName =>
                    classInfo[clsName]?.Abbreviation || clsName
                  );
                }
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px",
                      minHeight: "60px",
                      background: spell.included ? "#2a663d" : "#1e293b",
                      color: "#f5f5f5",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "6px",
                      border: spell.included ? "1px solid #3c8f64" : "1px solid #334155"
                    }}
                  >
                    <div style={{ fontSize: "0.95rem", textAlign: "center", lineHeight: 1.1 }}>
                      {spell.name}
                    </div>
                    {spell.included && providerAbbrs.length > 0 && (
                      <div
                        style={{
                          fontSize: "0.75em",
                          color: "#bbb",
                          marginTop: 2,
                          textAlign: "center",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          overflowWrap: "anywhere"
                        }}
                      >
                        <span
                          style={{
                            display: 'inline',
                            whiteSpace: 'normal',
                            wordBreak: 'normal',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {'('}
                          {providerAbbrs.map((abbr, idx) => (
                            <React.Fragment key={abbr}>
                              {abbr}
                                    {idx < providerAbbrs.length - 1 && <>/{'\u200b'}</>}
                            </React.Fragment>
                          ))}
                          {')'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="overview-panel-wrapper">
        <div className="overview-panel">
          <h2>Overview</h2>
          <p>Overview details will be defined later.</p>
        </div>
      </div>

      <footer style={{ width: '100%', textAlign: 'center', color: '#bfa76a', fontSize: '1rem', margin: '32px 0 8px 0', letterSpacing: '0.5px' }}>
        Development by Shnate.
      </footer>
    </div>
  );
}