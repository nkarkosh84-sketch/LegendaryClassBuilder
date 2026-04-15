import React, { useEffect, useState } from "react";

const SHEET_URL = "https://opensheet.elk.sh/1za0-DAyxcbcavywbquHzaWm8BKLBU_2lO9Omw8CEqYY/JSON";

export default function App() {
  const [classes, setClasses] = useState({});
  const [selected, setSelected] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoveredClass, setHoveredClass] = useState(null);

  const pageStyle = {
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f5f5f5",
    fontFamily: "Inter, sans-serif"
  };

  const buttonBaseStyle = {
    margin: "5px",
    padding: "10px 14px",
    border: "1px solid #334155",
    borderRadius: "5px",
    color: "#f5f5f5",
    background: "#1e293b",
    cursor: "pointer"
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
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(err => {
        console.error("Failed to fetch data", err);
      });
    const timer = setInterval(() => {
      fetch(SHEET_URL)
        .then(res => res.json())
        .then(rows => {
          setClasses(transformData(rows));
          setLastUpdated(new Date().toLocaleTimeString());
        })
        .catch(err => {
          console.error("Failed to fetch data", err);
        });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSheetData = () => {
    fetch(SHEET_URL)
      .then(res => res.json())
      .then(rows => {
        setClasses(transformData(rows));
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(err => {
        console.error("Failed to fetch data", err);
      });
  };

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
    const allowedCompetencies = new Set(["Melee", "Ability", "Defense"]);
    const allSpellNames = new Set();
    const selectedSpellNames = new Set();

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
        }
        if (!allowedCompetencies.has(skill.competency)) return;

        const existing = combinedSkills[skill.name];
        if (!existing || skill.level > existing.level) {
          combinedSkills[skill.name] = {
            name: skill.name,
            level: skill.level,
            competency: skill.competency
          };
        }
      });
    });

    const groupedSkills = {
      Melee: [],
      Defense: [],
      Ability: []
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
        included: selectedSpellNames.has(name)
      }));

    return {
      groupedSkills,
      spellCells
    };
  }

  const analysis = analyze();

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: "1100px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "Cinzel", color: "#FFD700" }}>Legendary Class Builder</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={fetchSheetData} style={buttonBaseStyle}>Refresh Data</button>
            {lastUpdated && <span style={{ color: "#aaa", fontSize: "0.95rem" }}>Last refresh: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: "1100px", width: "100%", backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
          <h2>Select up to 3 classes</h2>

          <div>
            {classes && Object.keys(classes).map(cls => (
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
      </div>

      <hr />

      <div style={{ display: "flex", gap: "40px", alignItems: "flex-start", justifyContent: "center", maxWidth: "1100px", margin: "0 auto", backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
        <div style={{ flex: 1, minWidth: "320px" }}>
          <h2>Max Skill Levels</h2>
          {['Melee', 'Defense', 'Ability'].map(comp => (
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
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {analysis.groupedSkills[comp]
                      .filter(s => s.level > 0)
                      .map((s, i) => (
                        <li key={i}>
                          {s.name} - {s.level}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0 }}>
                    {selected.length === 0 ? "No Class Selected" : `No ${comp} skills selected.`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ minWidth: "320px" }}>
          <h2>Spell Inclusion</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "10px"
            }}
          >
            {analysis.spellCells.map((spell, i) => (
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
                <div style={{ fontSize: "0.95rem", textAlign: "center" }}>{spell.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", width: "100%", margin: "20px auto 0", backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
        <h2>Overview</h2>
        <p style={{ margin: 0, color: "#cbd5e1" }}>Overview details will be defined later.</p>
      </div>
    </div>
  );
}