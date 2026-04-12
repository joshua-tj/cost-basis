import { useState } from "react";
import { useSnapshot } from "valtio";
import { store, addGroup, removeGroup, updateGroup, allPlanTypes } from "../store";

export function GroupManager() {
  const snap = useSnapshot(store);
  const ticker = snap.tickers[snap.activeSymbol];
  if (!ticker) return null;

  const planTypes = allPlanTypes();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlanTypes, setNewPlanTypes] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlanTypes, setEditPlanTypes] = useState<string[]>([]);

  const togglePlanType = (
    pt: string,
    selected: string[],
    setSelected: (pts: string[]) => void
  ) => {
    if (selected.includes(pt)) {
      setSelected(selected.filter((p) => p !== pt));
    } else {
      setSelected([...selected, pt]);
    }
  };

  const handleAdd = () => {
    if (!newName.trim() || newPlanTypes.length === 0) return;
    addGroup(newName.trim(), newPlanTypes);
    setNewName("");
    setNewPlanTypes([]);
    setAdding(false);
  };

  const handleStartEdit = (idx: number) => {
    const g = ticker.groups[idx];
    setEditingIdx(idx);
    setEditName(g.name);
    setEditPlanTypes([...g.planTypes]);
  };

  const handleSaveEdit = () => {
    if (editingIdx === null || !editName.trim() || editPlanTypes.length === 0) return;
    updateGroup(editingIdx, editName.trim(), editPlanTypes);
    setEditingIdx(null);
  };

  return (
    <div className="group-manager">
      <h2>Groups</h2>
      <p className="subtitle">
        Groups determine which plan types are sold together.
        Available plans: {planTypes.join(", ")}
      </p>

      <div className="group-list">
        {ticker.groups.map((group, idx) => (
          <div key={idx} className="group-item">
            {editingIdx === idx ? (
              <div className="group-edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Group name"
                />
                <div className="plan-type-chips">
                  {planTypes.map((pt) => (
                    <button
                      key={pt}
                      className={`chip ${editPlanTypes.includes(pt) ? "active" : ""}`}
                      onClick={() => togglePlanType(pt, editPlanTypes, setEditPlanTypes)}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
                <div className="group-edit-actions">
                  <button className="btn btn-sm" onClick={handleSaveEdit}>Save</button>
                  <button className="btn btn-sm btn-muted" onClick={() => setEditingIdx(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="group-info">
                  <strong>{group.name}</strong>
                  <span className="group-plans">{group.planTypes.join(", ")}</span>
                </div>
                <div className="group-actions">
                  <button className="btn btn-sm btn-muted" onClick={() => handleStartEdit(idx)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeGroup(idx)}>Remove</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="group-add-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name"
            autoFocus
          />
          <div className="plan-type-chips">
            {planTypes.map((pt) => (
              <button
                key={pt}
                className={`chip ${newPlanTypes.includes(pt) ? "active" : ""}`}
                onClick={() => togglePlanType(pt, newPlanTypes, setNewPlanTypes)}
              >
                {pt}
              </button>
            ))}
          </div>
          <div className="group-edit-actions">
            <button className="btn btn-sm" onClick={handleAdd}>Add</button>
            <button className="btn btn-sm btn-muted" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-sm" onClick={() => setAdding(true)}>
          + Add Group
        </button>
      )}
    </div>
  );
}
